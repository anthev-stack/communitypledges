import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch global settings (public access)
export async function GET() {
  try {
    console.log('🦇 Public API: Fetching global settings...')
    
    // Get global settings (public endpoint - no auth required)
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    })

    console.log('🦇 Public API: Database settings:', settings)

    // If no settings exist, return default
    if (!settings) {
      console.log('🦇 Public API: No settings found, returning default false')
      return NextResponse.json({
        batsEnabled: false
      })
    }

    console.log('🦇 Public API: Returning batsEnabled:', settings.batsEnabled)

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
