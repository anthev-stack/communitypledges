import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Test Database: Checking GlobalSettings table...')
    
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'GlobalSettings'
    ` as Array<{ table_name: string }>

    console.log('🔍 Test Database: Table exists:', tableExists.length > 0)

    if (tableExists.length === 0) {
      return NextResponse.json({
        error: 'GlobalSettings table does not exist',
        tableExists: false
      })
    }

    // Get all records in GlobalSettings
    const allSettings = await prisma.globalSettings.findMany()
    console.log('🔍 Test Database: All GlobalSettings records:', allSettings)

    // Get specific settings record
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    })
    console.log('🔍 Test Database: Settings record:', settings)

    return NextResponse.json({
      tableExists: true,
      allSettings,
      settings,
      settingsBatsEnabled: settings?.batsEnabled,
      settingsBatsEnabledType: typeof settings?.batsEnabled
    })

  } catch (error) {
    console.error('🔍 Test Database: Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
