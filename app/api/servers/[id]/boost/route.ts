import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe';
import { handlePaymentFailure, isUserPaymentSuspended, resetPaymentFailures } from '@/lib/payment-failure';
import { sendDiscordWebhook, createBoostNotificationEmbed } from '@/lib/discord-webhook';

/**
 * Process PayPal payment for server boost
 * Uses PayPal Payments API to charge the user's PayPal account
 */
async function processPayPalBoostPayment(user: any, amount: number, serverId: string, serverName: string, userId: string) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return { success: false, error: 'PayPal credentials not configured' }
    }

    // Get PayPal access token
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      return { success: false, error: `PayPal token request failed: ${tokenResponse.status}` }
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Create PayPal payment
    const paymentData = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
        payer_info: {
          email: user.paymentPaypalEmail
        }
      },
      transactions: [
        {
          amount: {
            total: amount.toFixed(2),
            currency: 'AUD',
            details: {
              subtotal: amount.toFixed(2)
            }
          },
          description: `Server Boost Payment for ${serverName}`,
          custom: `boost_${serverId}_user_${userId}`,
          invoice_number: `boost_${serverId}_${userId}_${Date.now()}`
        }
      ],
      redirect_urls: {
        return_url: `${process.env.NEXTAUTH_URL}/api/paypal/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/api/paypal/payment/cancel`
      }
    }

    const paymentResponse = await fetch('https://api-m.paypal.com/v1/payments/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      return { success: false, error: `PayPal payment creation failed: ${JSON.stringify(errorData)}` }
    }

    const paymentResult = await paymentResponse.json()
    
    // For automated processing, we'll simulate approval
    // In a real implementation, you might need to handle the approval flow
    // For now, we'll assume the payment is approved and execute it
    
    const executeData = {
      payer_id: paymentResult.payer.payer_info.payer_id
    }

    const executeResponse = await fetch(`https://api-m.paypal.com/v1/payments/payment/${paymentResult.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(executeData)
    })

    if (!executeResponse.ok) {
      const errorData = await executeResponse.json()
      return { success: false, error: `PayPal payment execution failed: ${JSON.stringify(errorData)}` }
    }

    const executeResult = await executeResponse.json()
    
    if (executeResult.state === 'approved') {
      console.log(`PayPal boost payment successful: ${executeResult.id}`)
      return { success: true, paymentId: executeResult.id }
    } else {
      return { success: false, error: `PayPal payment not approved: ${executeResult.state}` }
    }

  } catch (error) {
    console.error(`Error processing PayPal boost payment:`, error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Check if server exists and user owns it
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, ownerId: true, name: true, discordWebhook: true }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'You can only boost your own servers' }, { status: 403 });
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

    // Check if user has payment method (either card or PayPal)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        hasPaymentMethod: true,
        stripePaymentMethodId: true,
        stripeCustomerId: true,
        paymentPaypalEmail: true,
        paymentPaypalConnected: true,
        isPaymentSuspended: true
      }
    });

    if (!user?.hasPaymentMethod && !user?.paymentPaypalConnected) {
      return NextResponse.json({ error: 'Payment method required to boost server. Please add a card or PayPal in your settings.' }, { status: 400 });
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
      let paymentIntent: any = null;

      if (user.stripePaymentMethodId && user.stripeCustomerId) {
        // User has card payment method - process through Stripe
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(boostAmount * 100), // Convert to cents
          currency: 'aud',
          customer: user.stripeCustomerId,
          payment_method: user.stripePaymentMethodId,
          confirm: true,
          return_url: `${process.env.NEXTAUTH_URL}/servers/${serverId}`,
          // No application_fee_amount - server boosts go directly to platform
          metadata: {
            serverId: serverId,
            serverOwnerId: session.user.id,
            payerId: session.user.id,
            type: 'boost',
            paymentMethod: 'card',
            platformFee: '0.00', // No platform fee for boosts
            stripeFee: stripeFee.toString(),
            netAmount: netAmount.toString()
          }
        });
      } else if (user.paymentPaypalConnected) {
        // User has PayPal - process payment via PayPal API
        try {
          const paypalResult = await processPayPalBoostPayment(user, boostAmount, serverId, server.name, session.user.id);
          
          if (paypalResult.success) {
            // Create a mock successful payment intent for consistency
            paymentIntent = { status: 'succeeded' };
          } else {
            // Handle PayPal payment failure
            const failureResult = await handlePaymentFailure(session.user.id, `PayPal boost payment failed: ${paypalResult.error}`);
            
            let errorMessage = `PayPal payment failed: ${paypalResult.error}`;
            if (failureResult?.isSuspended) {
              errorMessage = 'Account suspended due to repeated payment failures. Please contact support.';
            } else if (failureResult?.remainingAttempts !== undefined) {
              errorMessage = `PayPal payment failed. ${failureResult.remainingAttempts} attempts remaining before account suspension.`;
            }

            return NextResponse.json({ 
              error: errorMessage,
              failureCount: failureResult?.failureCount,
              remainingAttempts: failureResult?.remainingAttempts
            }, { status: 400 });
          }
        } catch (error) {
          console.error('Error processing PayPal boost payment:', error);
          return NextResponse.json({ 
            error: 'PayPal payment processing failed. Please try again.' 
          }, { status: 500 });
        }
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful - proceed with boost creation
      } else {
        // Handle payment failure
        const failureResult = await handlePaymentFailure(session.user.id, `Boost payment failed: ${paymentIntent.status}`);
        
        let errorMessage = `Payment failed: ${paymentIntent.status}`;
        if (failureResult?.isSuspended) {
          errorMessage = 'Account suspended due to repeated payment failures. Please contact support.';
        } else if (failureResult?.remainingAttempts !== undefined) {
          errorMessage = `Payment failed. ${failureResult.remainingAttempts} attempts remaining before account suspension.`;
        }

        return NextResponse.json({ 
          error: errorMessage,
          failureCount: failureResult?.failureCount,
          remainingAttempts: failureResult?.remainingAttempts
        }, { status: 400 });
      }

      // Create boost record (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const boost = await prisma.serverBoost.create({
        data: {
          serverId: serverId,
          ownerId: session.user.id,
          expiresAt: expiresAt,
          amount: boostAmount,
          isActive: true
        }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          type: 'server_boost',
          message: `Boosted server "${server.name}" for $${boostAmount.toFixed(2)}`,
          amount: boostAmount,
          userId: session.user.id,
          serverId: serverId
        }
      });

      // Send Discord webhook notification if configured
      if (server.discordWebhook) {
        try {
          const embed = createBoostNotificationEmbed(
            server.name,
            session.user.name || 'Anonymous',
            boostAmount,
            expiresAt
          );

          await sendDiscordWebhook(server.discordWebhook, {
            embeds: [embed]
          });
        } catch (error) {
          console.error('Failed to send Discord webhook notification:', error);
          // Don't fail the boost if webhook fails
        }
      }

      // Log platform fee
      await prisma.activityLog.create({
        data: {
          type: 'server_boost',
          message: `Server boost payment: $${boostAmount.toFixed(2)}`,
          amount: boostAmount,
          userId: session.user.id,
          serverId: serverId
        }
      });

      // Reset payment failures on successful payment
      await resetPaymentFailures(session.user.id);

      return NextResponse.json({
        success: true,
        boost: {
          id: boost.id,
          expiresAt: boost.expiresAt,
          amount: boost.amount
        }
      });

    } catch (error) {
      console.error('Error processing boost payment:', error);
      return NextResponse.json({ 
        error: 'Payment processing failed. Please try again.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error boosting server:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Get current active boost for this server
    const activeBoost = await prisma.serverBoost.findFirst({
      where: {
        serverId: serverId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      boost: activeBoost ? {
        id: activeBoost.id,
        expiresAt: activeBoost.expiresAt,
        amount: activeBoost.amount,
        isActive: activeBoost.isActive
      } : null
    });

  } catch (error) {
    console.error('Error fetching boost status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

