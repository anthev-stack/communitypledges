import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can toggle bats
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Toggle bats for the current user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        batsEnabled: !session.user.batsEnabled 
      },
      select: {
        id: true,
        batsEnabled: true
      }
    })

    return NextResponse.json({
      message: `Bats ${updatedUser.batsEnabled ? 'enabled' : 'disabled'} successfully`,
      batsEnabled: updatedUser.batsEnabled
    })

  } catch (error) {
    console.error('Error toggling bats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
