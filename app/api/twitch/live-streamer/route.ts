import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all active partner streamers ordered by priority
    const streamers = await prisma.partnerStreamer.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    if (streamers.length === 0) {
      return NextResponse.json({ isLive: false, message: 'No partner streamers configured' })
    }

    // Check each streamer to see who's live (in priority order)
    for (const streamer of streamers) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/twitch/stream-status?username=${streamer.username}`)
        const data = await response.json()

        if (response.ok && data.isLive) {
          return NextResponse.json({
            isLive: true,
            streamer: streamer,
            stream: data.stream,
            user: data.user
          })
        }
      } catch (error) {
        console.error(`Error checking streamer ${streamer.username}:`, error)
        // Continue to next streamer
      }
    }

    // No streamers are live
    return NextResponse.json({ 
      isLive: false, 
      message: 'No partner streamers are currently live',
      totalStreamers: streamers.length
    })

  } catch (error) {
    console.error('Error checking live streamers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
