import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

/**
 * Update user's payment method after successful Setup Intent
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID required" }, { status: 400 })
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    if (!paymentMethod || paymentMethod.type !== 'card') {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    // Update user with payment method info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripePaymentMethodId: paymentMethodId,
        hasPaymentMethod: true,
        cardLast4: paymentMethod.card?.last4,
        cardBrand: paymentMethod.card?.brand,
        cardExpMonth: paymentMethod.card?.exp_month,
        cardExpYear: paymentMethod.card?.exp_year,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update payment method error:", error)
    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 })
  }
}

