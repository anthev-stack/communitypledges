const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function convertBatsToGlobal() {
  try {
    console.log('🦇 Converting bats setting from per-user to global...')
    
    // Check if the global setting table exists
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'GlobalSettings'
    `
    
    if (result.length === 0) {
      // Create GlobalSettings table
      console.log('📝 Creating GlobalSettings table...')
      await prisma.$executeRaw`
        CREATE TABLE "GlobalSettings" (
          id TEXT PRIMARY KEY DEFAULT 'settings',
          "batsEnabled" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('✅ GlobalSettings table created')
    } else {
      console.log('✅ GlobalSettings table already exists')
    }
    
    // Check if batsEnabled column exists in GlobalSettings
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GlobalSettings' 
      AND column_name = 'batsEnabled'
    `
    
    if (columnCheck.length === 0) {
      // Add batsEnabled column to GlobalSettings
      console.log('📝 Adding batsEnabled column to GlobalSettings...')
      await prisma.$executeRaw`
        ALTER TABLE "GlobalSettings" 
        ADD COLUMN "batsEnabled" BOOLEAN DEFAULT false
      `
      console.log('✅ batsEnabled column added to GlobalSettings')
    } else {
      console.log('✅ batsEnabled column already exists in GlobalSettings')
    }
    
    // Initialize global setting
    console.log('📝 Initializing global bats setting...')
    await prisma.$executeRaw`
      INSERT INTO "GlobalSettings" (id, "batsEnabled", "createdAt", "updatedAt")
      VALUES ('settings', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `
    
    console.log('✅ Global bats setting initialized')
    
    // Remove batsEnabled column from User table since we're making it global
    console.log('📝 Removing batsEnabled column from User table...')
    await prisma.$executeRaw`
      ALTER TABLE "User" DROP COLUMN IF EXISTS "batsEnabled"
    `
    
    console.log('✅ batsEnabled column removed from User table')
    
  } catch (error) {
    console.error('❌ Error converting bats to global setting:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

convertBatsToGlobal()
  .then(() => {
    console.log('🎉 Bats conversion to global setting completed successfully!')
  })
  .catch((error) => {
    console.error('💥 Bats conversion failed:', error)
    process.exit(1)
  })
