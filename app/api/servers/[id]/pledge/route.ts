import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateOptimizedCosts, canAcceptPledge, getOptimizationPreview } from "@/lib/optimization"
import { sendPledgeNotification, sendPledgeCancelNotification } from "@/lib/discord-webhook"
import { MIN_PLEDGE, MAX_PLEDGE } from "@/lib/constants"
import { emailService } from "@/lib/email"
import { getCurrencyFromCountry } from "@/lib/currency"

// Get pledge status and optimization preview
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        pledges: {
          where: { status: "ACTIVE" },
          select: { amount: true, userId: true },
        },
      },
    })

    if (!server) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      )
    }

    // Get user's existing pledge if any (only ACTIVE pledges)
    let userPledge = null
    if (session?.user?.id) {
      userPledge = await prisma.pledge.findFirst({
        where: {
          userId: session.user.id,
          serverId: id,
          status: "ACTIVE",
        },
      })
    }

    const pledgeAmounts = server.pledges.map(p => p.amount)
    const optimization = calculateOptimizedCosts(pledgeAmounts, server.cost)

    return NextResponse.json({
      canPledge: optimization.isAcceptingPledges && !userPledge,
      hasPledge: !!userPledge,
      userPledge,
      currentPledges: server.pledges.length,
      maxPledges: optimization.maxPeople,
      totalPledged: optimization.totalPledged,
      serverCost: server.cost,
      savings: optimization.savings,
    })
  } catch (error) {
    console.error("Get pledge status error:", error)
    return NextResponse.json(
      { error: "Failed to get pledge status" },
      { status: 500 }
    )
  }
}

// Create a pledge
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to pledge" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { amount } = body

    // Validate amount
    const pledgeAmount = parseFloat(amount)
    if (isNaN(pledgeAmount) || pledgeAmount < MIN_PLEDGE || pledgeAmount > MAX_PLEDGE) {
      return NextResponse.json(
        { error: `Pledge amount must be between $${MIN_PLEDGE} and $${MAX_PLEDGE}` },
        { status: 400 }
      )
    }

    // Check user status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        country: true,
        hasPaymentMethod: true,
        stripePaymentMethodId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is suspended or banned
    if (user.role === "SUSPENDED" || user.role === "BANNED") {
      return NextResponse.json(
        { error: "Your account is suspended. Please contact support." },
        { status: 403 }
      )
    }

    if (!user.country) {
      return NextResponse.json(
        {
          error:
            "Please confirm your country before pledging so amounts use the correct currency.",
        },
        { status: 400 }
      )
    }

    // Check if user has payment method
    if (!user.hasPaymentMethod || !user.stripePaymentMethodId) {
      return NextResponse.json(
        { error: "Please add a payment method in Settings before pledging" },
        { status: 400 }
      )
    }

    // Get server and existing pledges
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        pledges: {
          where: { status: "ACTIVE" },
          select: { amount: true, userId: true },
        },
      },
    })

    if (!server) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      )
    }

    if (!server.isActive) {
      return NextResponse.json(
        { error: "This server is not accepting pledges" },
        { status: 400 }
      )
    }

    // Check if user already has an ACTIVE pledge
    const existingPledge = server.pledges.find(p => p.userId === session.user.id)
    if (existingPledge) {
      return NextResponse.json(
        { error: "You already have a pledge for this server" },
        { status: 400 }
      )
    }

    // Check if server can accept more pledges
    if (!canAcceptPledge(server.pledges.length, server.cost)) {
      return NextResponse.json(
        { error: "Server has reached maximum capacity" },
        { status: 400 }
      )
    }

    // Calculate optimization preview
    const existingAmounts = server.pledges.map(p => p.amount)
    const preview = getOptimizationPreview(pledgeAmount, existingAmounts, server.cost)

    // Create or update pledge (use upsert to handle cancelled pledges)
    const pledge = await prisma.pledge.upsert({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: id,
        },
      },
      update: {
        amount: parseFloat(pledgeAmount.toFixed(2)),
        optimizedAmount: parseFloat(preview.estimatedPayment.toFixed(2)),
        status: "ACTIVE",
      },
      create: {
        amount: parseFloat(pledgeAmount.toFixed(2)),
        optimizedAmount: parseFloat(preview.estimatedPayment.toFixed(2)),
        userId: session.user.id,
        serverId: id,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        serverId: id,
        action: "pledge_created",
        metadata: {
          amount: pledgeAmount,
          optimizedAmount: preview.estimatedPayment,
        },
      },
    })

    // Recalculate optimization for all pledges
    const allPledges = await prisma.pledge.findMany({
      where: {
        serverId: id,
        status: "ACTIVE",
      },
      select: { id: true, amount: true },
    })

    const allAmounts = allPledges.map(p => p.amount)
    const optimization = calculateOptimizedCosts(allAmounts, server.cost)

    // Update optimized amounts for all pledges
    await Promise.all(
      allPledges.map((p, index) =>
        prisma.pledge.update({
          where: { id: p.id },
          data: { optimizedAmount: parseFloat(optimization.optimizedCosts[index].toFixed(2)) },
        })
      )
    )

    // Send Discord webhook notification if webhook is configured
    if (server.discordWebhook) {
      try {
        const totalPledged = allPledges.reduce((sum, p) => sum + p.amount, 0)
        const serverUrl = `${process.env.NEXTAUTH_URL || 'https://communitypledges.com'}/servers/${server.id}`
        
        // Get user's country to determine currency for display in webhook
        const userWithCountry = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { country: true },
        })
        
        // Convert country code to currency code
        const currency = userWithCountry?.country 
          ? getCurrencyFromCountry(userWithCountry.country)
          : 'USD'
        
        await sendPledgeNotification(server.discordWebhook, {
          serverName: server.name,
          pledgerName: pledge.user.name || 'Anonymous',
          pledgeAmount: pledgeAmount,
          totalPledged: totalPledged,
          monthlyGoal: server.cost,
          pledgerCount: allPledges.length,
          serverUrl: serverUrl,
          currency: currency,
        })
      } catch (error) {
        console.error('Failed to send Discord webhook notification:', error)
        // Don't fail the pledge creation if webhook fails
      }
    }

    return NextResponse.json({
      pledge,
      message: preview.potentialSavings > 0
        ? `Pledge created! You'll pay approximately $${preview.estimatedPayment.toFixed(2)} (saving $${preview.potentialSavings.toFixed(2)})`
        : `Pledge created! You'll pay $${preview.estimatedPayment.toFixed(2)} monthly`,
      optimization: {
        pledgedAmount: pledgeAmount,
        estimatedPayment: preview.estimatedPayment,
        potentialSavings: preview.potentialSavings,
      },
    })
  } catch (error) {
    console.error("Create pledge error:", error)
    return NextResponse.json(
      { error: "Failed to create pledge" },
      { status: 500 }
    )
  }
}

// Delete a pledge (unpledge)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find user's pledge with server info
    const pledge = await prisma.pledge.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: id,
        },
      },
      include: {
        server: {
          select: {
            name: true,
            discordWebhook: true,
            cost: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!pledge) {
      return NextResponse.json(
        { error: "You don't have a pledge for this server" },
        { status: 404 }
      )
    }

    // Cancel pledge
    await prisma.pledge.update({
      where: { id: pledge.id },
      data: { status: "CANCELLED" },
    })

    // Send pledge removal email
    if (pledge.user?.email && pledge.user?.id) {
      try {
        await emailService.sendRemovedPledge(
          pledge.user.id,
          pledge.user.email,
          pledge.user.name || 'User',
          pledge.server.name,
          'Pledge cancelled by user'
        )
      } catch (error) {
        console.error('Failed to send pledge removal email:', error)
      }
    }

    // Send Discord webhook notification for pledge cancellation
    if (pledge.server.discordWebhook) {
      try {
        const remainingPledges = await prisma.pledge.findMany({
          where: {
            serverId: id,
            status: "ACTIVE",
          },
          select: { amount: true },
        })
        
        const totalPledged = remainingPledges.reduce((sum, p) => sum + p.amount, 0)
        const serverUrl = `${process.env.NEXTAUTH_URL || 'https://communitypledges.com'}/servers/${id}`
        
        await sendPledgeCancelNotification(pledge.server.discordWebhook, {
          serverName: pledge.server.name,
          pledgerName: pledge.user.name || 'Anonymous',
          totalPledged: totalPledged,
          monthlyGoal: pledge.server.cost,
          pledgerCount: remainingPledges.length,
          serverUrl: serverUrl,
        })
      } catch (error) {
        console.error('Failed to send Discord webhook cancellation notification:', error)
        // Don't fail the pledge cancellation if webhook fails
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        serverId: id,
        action: "pledge_cancelled",
        metadata: {
          amount: pledge.amount,
        },
      },
    })

    // Recalculate optimization for remaining pledges
    const remainingPledges = await prisma.pledge.findMany({
      where: {
        serverId: id,
        status: "ACTIVE",
      },
      select: { id: true, amount: true },
    })

    if (remainingPledges.length > 0) {
      const server = await prisma.server.findUnique({
        where: { id },
        select: { cost: true },
      })

      if (server) {
        const amounts = remainingPledges.map(p => p.amount)
        const optimization = calculateOptimizedCosts(amounts, server.cost)

        // Update optimized amounts
        await Promise.all(
          remainingPledges.map((p, index) =>
            prisma.pledge.update({
              where: { id: p.id },
              data: { optimizedAmount: parseFloat(optimization.optimizedCosts[index].toFixed(2)) },
            })
          )
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete pledge error:", error)
    return NextResponse.json(
      { error: "Failed to cancel pledge" },
      { status: 500 }
    )
  }
}
