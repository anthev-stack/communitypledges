import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripeExpressAccountLink } from '@/lib/withdrawal'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: 'Account ID is required'
      }, { status: 400 })
    }

    const refreshUrl = `${process.env.NEXTAUTH_URL}/settings?tab=payouts&refresh=true`
    const returnUrl = `${process.env.NEXTAUTH_URL}/settings?tab=payouts&success=true`

    const result = await createStripeExpressAccountLink(accountId, refreshUrl, returnUrl)

    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.url
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating Stripe Express account link:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create Stripe Express account link'
    }, { status: 500 })
  }
}

