import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendUsernameChangeEmail } from '@/lib/email'
import { z } from 'zod'

const changeUsernameSchema = z.object({
  newUsername: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { newUsername } = changeUsernameSchema.parse(body)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        lastUsernameChange: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if username is the same
    if (user.name === newUsername) {
      return NextResponse.json(
        { message: 'New username is the same as current username' },
        { status: 400 }
      )
    }

    // Check 14-day restriction
    if (user.lastUsernameChange) {
      const daysSinceLastChange = Math.floor(
        (Date.now() - user.lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceLastChange < 14) {
        const daysRemaining = 14 - daysSinceLastChange
        return NextResponse.json(
          { 
            message: `You can only change your username once every 14 days. Please wait ${daysRemaining} more day${daysRemaining === 1 ? '' : 's'}.`,
            daysRemaining
          },
          { status: 400 }
        )
      }
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { name: newUsername }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 400 }
      )
    }

    const oldUsername = user.name

    // Update username
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: newUsername,
        lastUsernameChange: new Date()
      }
    })

    // Log the username change
    await prisma.activityLog.create({
      data: {
        type: 'username_changed',
        message: `Username changed from "${oldUsername}" to "${newUsername}"`,
        userId: user.id
      }
    })

    // Send email notification
    try {
      await sendUsernameChangeEmail({
        userName: newUsername,
        userEmail: user.email,
        oldUsername: oldUsername || 'Unknown',
        newUsername: newUsername,
        changeTime: new Date().toLocaleString()
      })
    } catch (emailError) {
      console.error('Failed to send username change email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      message: 'Username changed successfully',
      newUsername
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Change username error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
