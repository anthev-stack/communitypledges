import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTwitchStreamByUsername } from "@/lib/twitch"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const streamers = await prisma.partnerStreamer.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    })

    if (streamers.length === 0) {
      return NextResponse.json({ isLive: false, message: "No partner streamers configured" })
    }

    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
      return NextResponse.json(
        { isLive: false, message: "Twitch API not configured on server" },
        { status: 503 }
      )
    }

    for (const streamer of streamers) {
      try {
        const data = await getTwitchStreamByUsername(streamer.username)
        if (data.isLive && data.stream && data.user) {
          return NextResponse.json({
            isLive: true,
            streamer,
            stream: data.stream,
            user: data.user,
          })
        }
      } catch (error) {
        console.error(`Error checking streamer ${streamer.username}:`, error)
      }
    }

    return NextResponse.json({
      isLive: false,
      message: "No partner streamers are currently live",
      totalStreamers: streamers.length,
    })
  } catch (error) {
    console.error("Error checking live streamers:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
