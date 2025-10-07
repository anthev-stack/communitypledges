import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripeExpressAccount } from '@/lib/withdrawal'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const result = await createStripeExpressAccount(session.user.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        accountId: result.accountId,
        requirements: result.requirements
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating Stripe Express account:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create Stripe Express account'
    }, { status: 500 })
  }
}

