import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe Connect onboard API called');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id ? 'Found' : 'Not found');

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get country from JSON body or form data, default to AU
    let country = 'AU';
    try {
      const body = await request.json();
      country = body.country || 'AU';
      console.log('Country from JSON:', country);
    } catch (jsonError) {
      // Fallback to form data parsing
      try {
        const formData = await request.formData();
        country = (formData.get('country') as string) || 'AU';
        console.log('Country from form data:', country);
      } catch (formError) {
        console.log('Could not parse JSON or form data, using default country:', country);
      }
    }

    // Check if user already has a Stripe Connect account
    console.log('Checking for existing Stripe account...');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    });
    console.log('User Stripe account:', user?.stripeAccountId || 'None');

    if (user?.stripeAccountId) {
      // User already has an account, create a new account link for onboarding
      console.log('Creating account link for existing account...');
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`,
        return_url: `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`,
        type: 'account_onboarding'
      });
      
      console.log('Account link created:', accountLink.url);
      return NextResponse.json({ 
        accountId: user.stripeAccountId,
        onboardingUrl: accountLink.url
      });
    }

    // Create Stripe Connect account
    console.log('Creating new Stripe Connect account...');
    const account = await stripe.accounts.create({
      type: 'express', // Express accounts are easier to set up
      country: country, // Use detected country
      email: session.user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual', // or 'company' based on your needs
      settings: {
        payouts: {
          schedule: {
            interval: 'daily' // or 'weekly', 'monthly'
          }
        }
      }
    });
    console.log('Stripe account created:', account.id);

    // Save the account ID to the user
    console.log('Saving account ID to database...');
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: account.id }
    });

    // Create account link for onboarding
    console.log('Creating account link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`,
      type: 'account_onboarding'
    });
    console.log('Account link created:', accountLink.url);

    // Return onboarding URL
    return NextResponse.json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}



