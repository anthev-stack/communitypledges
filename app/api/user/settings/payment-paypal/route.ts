import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        paymentPaypalEmail: null,
        paymentPaypalUserId: null,
        paymentPaypalConnected: false,
        paymentPaypalConnectedAt: null,
      }
    })

    return NextResponse.json({ message: 'PayPal payment method removed successfully' })
  } catch (error) {
    console.error('Error removing PayPal payment method:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
