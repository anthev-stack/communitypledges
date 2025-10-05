import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for adding a partner streamer
const addStreamerSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  priority: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true)
})

// Schema for updating a partner streamer
const updateStreamerSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const streamers = await prisma.partnerStreamer.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        addedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(streamers)
  } catch (error) {
    console.error('Error fetching partner streamers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = addStreamerSchema.parse(body)

    // Check if streamer already exists
    const existingStreamer = await prisma.partnerStreamer.findUnique({
      where: { username: validatedData.username }
    })

    if (existingStreamer) {
      return NextResponse.json(
        { message: 'Streamer with this username already exists' },
        { status: 400 }
      )
    }

    const streamer = await prisma.partnerStreamer.create({
      data: {
        username: validatedData.username,
        displayName: validatedData.displayName,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
        addedBy: session.user.id
      },
      include: {
        addedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(streamer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating partner streamer:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
