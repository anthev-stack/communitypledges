import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkStripeExpressAccountStatus } from '@/lib/withdrawal'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe payout account ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripePayoutAccountId: true,
        stripePayoutConnected: true,
        stripePayoutRequirements: true
      }
    })

    if (!user?.stripePayoutAccountId) {
      return NextResponse.json({
        success: false,
        error: 'No Stripe Express account found'
      }, { status: 404 })
    }

    const result = await checkStripeExpressAccountStatus(user.stripePayoutAccountId)

    if (result.success) {
      // Update user's payout status if account is ready
      if (result.chargesEnabled && result.payoutsEnabled && result.detailsSubmitted) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            stripePayoutConnected: true,
            stripePayoutConnectedAt: new Date(),
            stripePayoutRequirements: JSON.stringify(result.requirements)
          }
        })
      }

      return NextResponse.json({
        success: true,
        chargesEnabled: result.chargesEnabled,
        payoutsEnabled: result.payoutsEnabled,
        detailsSubmitted: result.detailsSubmitted,
        requirements: result.requirements,
        connected: user.stripePayoutConnected
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error checking Stripe Express account status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check Stripe Express account status'
    }, { status: 500 })
  }
}

