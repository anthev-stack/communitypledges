import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🦇 Testing bats configuration...')
    
    // Check if GlobalSettings table exists
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'GlobalSettings'
    ` as Array<{ table_name: string }>
    
    console.log('📊 GlobalSettings table exists:', tableExists.length > 0)
    
    if (tableExists.length === 0) {
      return NextResponse.json({
        error: 'GlobalSettings table does not exist',
        batsEnabled: false,
        tableExists: false
      })
    }
    
    // Get global settings
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'settings' }
    })
    
    console.log('📊 Global settings found:', settings)
    
    return NextResponse.json({
      success: true,
      batsEnabled: settings?.batsEnabled || false,
      settings: settings,
      tableExists: true
    })
    
  } catch (error) {
    console.error('❌ Error testing bats:', error)
    return NextResponse.json({
      error: error.message,
      batsEnabled: false,
      success: false
    }, { status: 500 })
  }
}
