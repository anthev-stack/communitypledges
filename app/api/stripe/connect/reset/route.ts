import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Remove the Stripe Connect account ID from the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: null }
    });

    return NextResponse.json({ 
      message: 'Stripe Connect account reset successfully. You can now create a new one with Australia as the country.',
      success: true
    });
  } catch (error) {
    console.error('Error resetting Stripe Connect account:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
