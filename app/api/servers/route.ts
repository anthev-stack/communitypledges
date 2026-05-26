import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/email"

// Get all servers
export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      where: {
        status: "active",
        isPrivate: false, // Only show public servers in browser
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            pledges: true,
            favorites: true,
          },
        },
        boosts: {
          where: {
            isActive: true,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        {
          boosts: {
            _count: 'desc'
          }
        },
        {
          createdAt: "desc"
        }
      ],
    })

    // Calculate pledge stats for each server
    const serversWithStats = await Promise.all(
      servers.map(async (server) => {
        const pledgeStats = await prisma.pledge.aggregate({
          where: {
            serverId: server.id,
            status: "ACTIVE",
          },
          _sum: {
            amount: true,
            optimizedAmount: true,
          },
          _count: true,
        })

        return {
          ...server,
          totalPledged: pledgeStats._sum.amount || 0,
          totalOptimized: pledgeStats._sum.optimizedAmount || 0,
          pledgerCount: pledgeStats._count,
          isBoosted: server.boosts.length > 0,
          boostExpiresAt: server.boosts[0]?.expiresAt || null,
        }
      })
    )

    return NextResponse.json(serversWithStats)
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    )
  }
}

// Create a new server
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, gameType, serverIp, serverPort, playerCount, cost, withdrawalDay, imageUrl, isPrivate } = body

    const isMinecraftJava = gameType === "Minecraft: Java Edition"
    if (isMinecraftJava) {
      if (!body.minecraftVersion) {
        return NextResponse.json({ error: "Minecraft version is required" }, { status: 400 })
      }
      if (!body.minecraftEditionType) {
        return NextResponse.json({ error: "Select vanilla or modded" }, { status: 400 })
      }
      if (body.minecraftEditionType === "modded" && !body.minecraftModLoader) {
        return NextResponse.json({ error: "Mod loader is required for modded servers" }, { status: 400 })
      }
    }

    if (!name || !gameType || !cost) {
      return NextResponse.json(
        { error: "Name, game type, and monthly cost are required" },
        { status: 400 }
      )
    }

    const monthlyCost = parseFloat(cost)
    if (isNaN(monthlyCost) || monthlyCost < 1) {
      return NextResponse.json(
        { error: "Monthly cost must be at least $1" },
        { status: 400 }
      )
    }

    const withdrawalDayNum = withdrawalDay ? parseInt(withdrawalDay) : 15
    if (withdrawalDayNum < 1 || withdrawalDayNum > 31) {
      return NextResponse.json(
        { error: "Withdrawal day must be between 1 and 31" },
        { status: 400 }
      )
    }

    // Check if user has connected Stripe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true, stripeOnboardingComplete: true },
    })

    if (!user?.stripeAccountId || !user?.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "Please connect your Stripe account before creating a server" },
        { status: 400 }
      )
    }

    const server = await prisma.server.create({
      data: {
        name,
        description,
        gameType,
        serverIp,
        serverPort: serverPort ? parseInt(serverPort) : null,
        playerCount: null, // Will be updated by live stats
        cost: monthlyCost,
        withdrawalDay: withdrawalDayNum,
        imageUrl,
        region: body.region || null,
        tags: body.tags || [],
        communityId: body.communityId || null,
        discordWebhook: body.discordWebhook || null,
        isPrivate: isPrivate || false,
        isRealm: body.isRealm || false,
        minecraftVersion: isMinecraftJava ? body.minecraftVersion : null,
        minecraftEditionType: isMinecraftJava ? body.minecraftEditionType : null,
        minecraftModLoader:
          isMinecraftJava && body.minecraftEditionType === "modded" ? body.minecraftModLoader : null,
        hasModrinthInstance: false,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    })

    // Send admin notification for new server
    try {
      await emailService.sendAdminNewServer(
        server.name,
        server.owner.name || 'Unknown User',
        server.owner.email || 'no-email',
        server.gameType,
        `$${monthlyCost.toFixed(2)}/month`
      )
    } catch (emailError) {
      console.error('Failed to send admin new server notification:', emailError)
    }

    return NextResponse.json(server)
  } catch (error) {
    console.error("Error creating server:", error)
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    )
  }
}
