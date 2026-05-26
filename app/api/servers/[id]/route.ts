import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteModrinthInstance } from "@/lib/modrinth-storage"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            stripeAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        pledges: {
          where: {
            status: "ACTIVE",
          },
          take: 10,
          orderBy: {
            createdAt: "desc",
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
        },
      },
    })

    if (!server) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      )
    }

    // Calculate pledge stats
    const pledgeStats = await prisma.pledge.aggregate({
      where: {
        serverId: id,
        status: "ACTIVE",
      },
      _sum: {
        amount: true,
        optimizedAmount: true,
      },
      _count: true,
    })

    return NextResponse.json({
      ...server,
      totalPledged: pledgeStats._sum.amount || 0,
      totalOptimized: pledgeStats._sum.optimizedAmount || 0,
      pledgerCount: pledgeStats._count,
    })
  } catch (error) {
    console.error("Error fetching server:", error)
    return NextResponse.json(
      { error: "Failed to fetch server" },
      { status: 500 }
    )
  }
}

// Update server
export async function PATCH(
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
    const body = await request.json()

    // Check if user owns this server
    const existingServer = await prisma.server.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!existingServer || existingServer.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Check if cost or withdrawalDay changed - if so, remove all pledges
    const oldServer = await prisma.server.findUnique({
      where: { id },
      select: {
        cost: true,
        withdrawalDay: true,
      },
    })

    const costChanged = body.cost && parseFloat(body.cost) !== oldServer?.cost
    const withdrawalDayChanged = body.withdrawalDay && parseInt(body.withdrawalDay) !== oldServer?.withdrawalDay
    
    let pledgesRemoved = 0

    if (costChanged || withdrawalDayChanged) {
      // Delete all pledges for this server
      const result = await prisma.pledge.deleteMany({
        where: { serverId: id },
      })
      pledgesRemoved = result.count
    }

    const server = await prisma.server.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        gameType: body.gameType,
        serverIp: body.serverIp,
        cost: body.cost ? parseFloat(body.cost) : undefined,
        withdrawalDay: body.withdrawalDay ? parseInt(body.withdrawalDay) : undefined,
        imageUrl: body.imageUrl,
        region: body.region !== undefined ? body.region : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
        communityId: body.communityId !== undefined ? (body.communityId || null) : undefined,
        isPrivate: body.isPrivate !== undefined ? body.isPrivate : undefined,
        isRealm: body.isRealm !== undefined ? body.isRealm : undefined,
        minecraftVersion:
          body.gameType === "Minecraft: Java Edition" || body.minecraftVersion !== undefined
            ? body.minecraftVersion ?? null
            : undefined,
        minecraftEditionType:
          body.minecraftEditionType !== undefined ? body.minecraftEditionType || null : undefined,
        minecraftModLoader:
          body.minecraftModLoader !== undefined ? body.minecraftModLoader || null : undefined,
        hasModrinthInstance:
          body.hasModrinthInstance !== undefined ? body.hasModrinthInstance : undefined,
      },
    })

    return NextResponse.json({
      ...server,
      pledgesRemoved,
    })
  } catch (error) {
    console.error("Error updating server:", error)
    return NextResponse.json(
      { error: "Failed to update server" },
      { status: 500 }
    )
  }
}

// Delete server
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

    // Check if user owns the server
    const existingServer = await prisma.server.findUnique({
      where: { id },
      select: {
        ownerId: true,
        modrinthInstanceExtension: true,
        _count: {
          select: {
            pledges: true,
          },
        },
      },
    })

    if (!existingServer || existingServer.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Get server name before deleting
    const server = await prisma.server.findUnique({
      where: { id },
      select: { name: true },
    })

    // Log server deletion activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "server_deleted",
        metadata: {
          serverName: server?.name,
          pledgesRemoved: existingServer._count.pledges,
        },
      },
    })

    await deleteModrinthInstance(id, existingServer.modrinthInstanceExtension)

    // Delete server (cascades to pledges due to Prisma schema)
    await prisma.server.delete({
      where: { id },
    })

    return NextResponse.json({ 
      message: "Server deleted successfully",
      pledgesRemoved: existingServer._count.pledges,
    })
  } catch (error) {
    console.error("Error deleting server:", error)
    return NextResponse.json(
      { error: "Failed to delete server" },
      { status: 500 }
    )
  }
}
