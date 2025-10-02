import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Remove payment method from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        hasPaymentMethod: false,
        cardLast4: null,
        cardBrand: null,
        cardExpMonth: null,
        cardExpYear: null,
        stripePaymentMethodId: null
      }
    })

    return NextResponse.json({ 
      message: 'Payment method removed successfully'
    })
  } catch (error) {
    console.error('Error removing payment method:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}