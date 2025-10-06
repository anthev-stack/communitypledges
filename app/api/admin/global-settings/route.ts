import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch global settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view global settings
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get global settings
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    })

    // If no settings exist, create default
    if (!settings) {
      const newSettings = await prisma.globalSettings.create({
        data: {
          id: 'settings',
          batsEnabled: false
        }
      })
      return NextResponse.json(newSettings)
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Error fetching global settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update global settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can update global settings
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { batsEnabled } = body

    console.log('🦇 Admin API: Received batsEnabled:', batsEnabled, 'Type:', typeof batsEnabled)

    if (typeof batsEnabled !== 'boolean') {
      console.log('❌ Admin API: Invalid batsEnabled type:', typeof batsEnabled)
      return NextResponse.json(
        { message: 'Invalid batsEnabled value' },
        { status: 400 }
      )
    }

             console.log('🦇 Admin API: Updating database with batsEnabled:', batsEnabled)

             // Update global settings
             const updatedSettings = await prisma.globalSettings.upsert({
               where: { id: 'settings' },
               update: { batsEnabled },
               create: {
                 id: 'settings',
                 batsEnabled
               }
             })

             console.log('✅ Admin API: Database updated successfully:', updatedSettings)

             // Verify the update by reading it back
             const verifySettings = await prisma.globalSettings.findUnique({
               where: { id: 'settings' }
             })
             console.log('🔍 Admin API: Verification read - current value:', verifySettings?.batsEnabled)

    return NextResponse.json({
      message: `Global bats setting ${batsEnabled ? 'enabled' : 'disabled'} successfully`,
      settings: updatedSettings
    })

  } catch (error) {
    console.error('Error updating global settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
