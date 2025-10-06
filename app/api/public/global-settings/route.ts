import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

         // GET - Fetch global settings (public access)
         export async function GET() {
           try {
             console.log('🦇 Public API: Fetching global settings...')
             const fetchStart = Date.now()

             // Disable Prisma caching and get fresh data with connection refresh
             const disconnectStart = Date.now()
             await prisma.$disconnect()
             await prisma.$connect()
             const disconnectEnd = Date.now()
             console.log('⏱️ Public API: Connection refresh took', disconnectEnd - disconnectStart, 'ms')
             
             const queryStart = Date.now()
             const settings = await prisma.$queryRaw`
               SELECT * FROM "GlobalSettings" WHERE id = 'settings'
             ` as Array<{id: string, batsEnabled: boolean, createdAt: Date, updatedAt: Date}>
             const queryEnd = Date.now()
             console.log('⏱️ Public API: Database query took', queryEnd - queryStart, 'ms')

             const settingsRecord = settings[0] || null

             console.log('🦇 Public API: Database settings:', settingsRecord)

             // If no settings exist, return default
             if (!settingsRecord) {
               console.log('🦇 Public API: No settings found, returning default false')
               return NextResponse.json({
                 batsEnabled: false
               })
             }

             console.log('🦇 Public API: Returning batsEnabled:', settingsRecord.batsEnabled, 'Type:', typeof settingsRecord.batsEnabled)

             // Only return the batsEnabled setting (public information)
             const response = NextResponse.json({
               batsEnabled: settingsRecord.batsEnabled,
               timestamp: new Date().toISOString(),
               updatedAt: settingsRecord.updatedAt
             })
             
             // Add cache-busting headers
             response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
             response.headers.set('Pragma', 'no-cache')
             response.headers.set('Expires', '0')
             
             return response

  } catch (error) {
    console.error('Error fetching global settings:', error)
    return NextResponse.json(
      { batsEnabled: false }, // Default to disabled on error
      { status: 200 } // Return 200 to avoid breaking the UI
    )
  }
}
