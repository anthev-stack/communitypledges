import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONNECT_REFRESH_URL, STRIPE_CONNECT_RETURN_URL } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Create/Connect Stripe Connect Express Account
 * This handles the entire onboarding flow for server owners
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let accountId = user.stripeAccountId;

    // Check if user has selected a country
    if (!user.country) {
      return NextResponse.json(
        { error: 'Please select your country first' },
        { status: 400 }
      );
    }

    // If account exists but onboarding not complete, check if country matches
    if (accountId && !user.stripeOnboardingComplete) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        
        // If country doesn't match, delete old account and create new one
        if (existingAccount.country !== user.country) {
          console.log(`Country mismatch. Deleting old account.`);
          try {
            await stripe.accounts.del(accountId);
          } catch (deleteError) {
            console.log("Failed to delete account, may not exist:", deleteError);
          }
          accountId = null;
        }
      } catch (error) {
        console.log("Account doesn't exist in Stripe");
        accountId = null;
      }
    }

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: user.country,
        email: user.email || undefined,
        business_type: "individual", // CRITICAL: Personal account, not business
        business_profile: {
          mcc: "8398", // Charitable and Social Service Organizations
          product_description: "Receiving donations for game server hosting",
          url: process.env.NEXTAUTH_URL || undefined,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: "daily", // Automatic daily payouts
            },
          },
        },
      });

      accountId = account.id;

      // Save to database
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeAccountId: accountId,
          stripeAccountStatus: "pending",
          stripeOnboardingComplete: false,
        },
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: STRIPE_CONNECT_REFRESH_URL,
      return_url: STRIPE_CONNECT_RETURN_URL,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}



