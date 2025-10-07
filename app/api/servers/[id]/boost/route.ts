import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, calculateStripeFee } from '@/lib/stripe';
import { handlePaymentFailure, isUserPaymentSuspended, resetPaymentFailures } from '@/lib/payment-failure';
import { sendDiscordWebhook, createBoostNotificationEmbed } from '@/lib/discord-webhook';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serverId = params.id;

    // Get server details
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        owner: {
          select: {
            name: true
          }
        }
      }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check if server already has an active boost
    const existingBoost = await prisma.serverBoost.findFirst({
      where: {
        serverId: serverId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingBoost) {
      return NextResponse.json({ error: 'Server already has an active boost' }, { status: 400 });
    }

    // Check global boost limit (max 10 active boosts)
    const activeBoostsCount = await prisma.serverBoost.count({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (activeBoostsCount >= 10) {
      return NextResponse.json({ error: 'Maximum number of boosted servers reached (10)' }, { status: 400 });
    }

    // Check if user has Stripe payment method
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        hasPaymentMethod: true,
        stripePaymentMethodId: true,
        stripeCustomerId: true,
        isPaymentSuspended: true
      }
    });

    if (!user?.hasPaymentMethod || !user?.stripePaymentMethodId || !user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Payment method required to boost server. Please add a Stripe card in your settings.' }, { status: 400 });
    }

    // Check if user is payment suspended
    if (user.isPaymentSuspended) {
      return NextResponse.json({ 
        error: 'Account suspended due to payment failures. Please contact support.' 
      }, { status: 403 });
    }

    // Process immediate payment for boost
    const boostAmount = 3.0; // AUD amount
    // Server boosts go directly to platform - no platform fee
    const stripeFee = calculateStripeFee(boostAmount);
    const netAmount = boostAmount - stripeFee; // Only subtract Stripe fee

    try {
      // Process payment via Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(boostAmount * 100), // Convert to cents
        currency: 'aud',
        customer: user.stripeCustomerId,
        payment_method: user.stripePaymentMethodId,
        confirm: true,
        metadata: {
          serverId: serverId,
          serverOwnerId: server.ownerId,
          payerId: session.user.id,
          type: 'server_boost',
          stripeFee: stripeFee.toString(),
          netAmount: netAmount.toString()
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Reset payment failures on successful payment
        await resetPaymentFailures(session.user.id);

        // Create server boost record
        const boost = await prisma.serverBoost.create({
          data: {
            serverId: serverId,
            ownerId: session.user.id,
            amount: boostAmount,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });

        // Log boost activity
        await prisma.activityLog.create({
          data: {
            type: 'server_boost',
            message: `You boosted "${server.name}" for A$${boostAmount.toFixed(2)}`,
            amount: boostAmount,
            userId: session.user.id,
            serverId: serverId
          }
        });

        // Send Discord notification
        try {
          const embed = createBoostNotificationEmbed(
            server.name,
            session.user.name || 'Unknown',
            boostAmount,
            boost.expiresAt
          );
          await sendDiscordWebhook(server.discordWebhook || '', {
            content: 'Server boosted! 🚀',
            embeds: [embed]
          });
        } catch (discordError) {
          console.error('Failed to send Discord notification:', discordError);
        }

        return NextResponse.json({
          success: true,
          message: `Server "${server.name}" has been boosted for 30 days!`,
          boost: {
            id: boost.id,
            amount: boostAmount,
            expiresAt: boost.expiresAt
          }
        });
      } else {
        // Handle payment failure
        const failureResult = await handlePaymentFailure(session.user.id, `Server boost payment failed: ${paymentIntent.status}`);
        
        let errorMessage = `Payment failed: ${paymentIntent.status}`;
        if (failureResult && !failureResult.isSuspended) {
          errorMessage = `Payment failed. ${failureResult.remainingAttempts} attempts remaining before account suspension.`;
        }

        return NextResponse.json({ 
          error: errorMessage 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error processing server boost payment:', error);
      
      // Handle payment failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failureResult = await handlePaymentFailure(session.user.id, `Server boost payment error: ${errorMessage}`);
      
      let userErrorMessage = 'Payment processing failed. Please try again.';
      if (failureResult && !failureResult.isSuspended) {
        userErrorMessage = `Payment failed. ${failureResult.remainingAttempts} attempts remaining before account suspension.`;
      }

      return NextResponse.json({ 
        error: userErrorMessage 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Server boost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}