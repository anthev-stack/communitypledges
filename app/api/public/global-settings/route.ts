import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch global settings (public access)
export async function GET() {
  try {
    // Get global settings (public endpoint - no auth required)
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    })

    // If no settings exist, return default
    if (!settings) {
      return NextResponse.json({
        batsEnabled: false
      })
    }

    // Only return the batsEnabled setting (public information)
    return NextResponse.json({
      batsEnabled: settings.batsEnabled
    })

  } catch (error) {
    console.error('Error fetching global settings:', error)
    return NextResponse.json(
      { batsEnabled: false }, // Default to disabled on error
      { status: 200 } // Return 200 to avoid breaking the UI
    )
  }
}
