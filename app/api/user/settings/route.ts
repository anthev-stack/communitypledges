import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[Settings API] Starting request...')
    const session = await getServerSession(authOptions)
    console.log('[Settings API] Session:', session?.user?.id ? 'Found' : 'Not found')
    
    if (!session?.user?.id) {
      console.log('[Settings API] No session, returning 401')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Settings API] Fetching user:', session.user.id)
    
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          hasPaymentMethod: true,
          cardLast4: true,
          cardBrand: true,
          cardExpMonth: true,
          cardExpYear: true,
          stripePaymentMethodId: true,
          // paypalEmail: true, // Temporarily disabled until database migration works
          name: true,
          email: true,
          image: true
        }
      })
      console.log('[Settings API] User query successful:', user ? 'Found' : 'Not found')
    } catch (dbError) {
      console.error('[Settings API] Database error:', dbError)
      throw dbError
    }

    if (!user) {
      console.log('[Settings API] User not found in database')
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[Settings API] User found, returning data')
    return NextResponse.json(user)
  } catch (error) {
    console.error('[Settings API] Error fetching user settings:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

