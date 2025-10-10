import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

/**
 * Check Stripe Connect account status
 * Returns onboarding status and account capabilities
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
      });
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const isComplete = account.details_submitted && account.charges_enabled;

    // Update database if status changed
    if (isComplete !== user.stripeOnboardingComplete) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeOnboardingComplete: isComplete,
          stripeAccountStatus: isComplete ? "active" : "pending",
        },
      });
    }

    return NextResponse.json({
      connected: true,
      onboardingComplete: isComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error('Error checking Stripe status:', error);
    return NextResponse.json({ error: 'Failed to check Stripe status' }, { status: 500 });
  }
}



