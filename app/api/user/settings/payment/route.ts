import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ message: 'Payment method ID required' }, { status: 400 })
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    if (!paymentMethod || paymentMethod.type !== 'card') {
      return NextResponse.json({ message: 'Invalid payment method' }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true }
    }).then(user => user?.stripeCustomerId)

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id
        }
      })
      customerId = customer.id
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Update user with payment method details
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasPaymentMethod: true,
        cardLast4: paymentMethod.card?.last4,
        cardBrand: paymentMethod.card?.brand,
        cardExpMonth: paymentMethod.card?.exp_month,
        cardExpYear: paymentMethod.card?.exp_year,
        stripePaymentMethodId: paymentMethodId,
        stripeCustomerId: customerId
      }
    })

    return NextResponse.json({ 
      message: 'Payment method added successfully',
      paymentMethod: {
        id: paymentMethodId,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year
      }
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get current user data to find the payment method ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        stripePaymentMethodId: true,
        stripeCustomerId: true
      }
    })

    // Detach payment method from Stripe if it exists
    if (user?.stripePaymentMethodId && user?.stripeCustomerId) {
      try {
        await stripe.paymentMethods.detach(user.stripePaymentMethodId)
        console.log('Payment method detached from Stripe:', user.stripePaymentMethodId)
      } catch (stripeError) {
        console.error('Error detaching payment method from Stripe:', stripeError)
        // Continue with database cleanup even if Stripe fails
      }
    }

    // Remove payment method from user database
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

    console.log('Payment method removed from database for user:', session.user.id)

    return NextResponse.json({ 
      message: 'Payment method removed successfully'
    })
  } catch (error) {
    console.error('Error removing payment method:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}