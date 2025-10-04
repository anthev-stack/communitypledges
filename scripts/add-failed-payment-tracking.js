const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addFailedPaymentTracking() {
  try {
    console.log('🚀 Adding failed payment tracking fields...')
    
    // Test database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if columns already exist
    console.log('🔍 Checking if failed payment tracking columns exist...')
    
    try {
      // Try to query the new fields to see if they exist
      await prisma.user.findFirst({
        select: {
          failedPaymentCount: true,
          lastFailedPaymentAt: true,
          isSuspended: true,
          suspendedAt: true
        }
      })
      console.log('✅ Failed payment tracking columns already exist')
    } catch (error) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('🔧 Adding failed payment tracking columns...')
        
        // Add the new columns
        await prisma.$executeRaw`
          ALTER TABLE "User" 
          ADD COLUMN IF NOT EXISTS "failedPaymentCount" INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "lastFailedPaymentAt" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
        `
        
        console.log('✅ Failed payment tracking columns added successfully')
      } else {
        throw error
      }
    }
    
    // Verify the columns exist and are accessible
    console.log('🔍 Verifying columns are accessible...')
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        failedPaymentCount: true,
        lastFailedPaymentAt: true,
        isSuspended: true,
        suspendedAt: true
      }
    })
    
    if (testUser) {
      console.log('✅ Failed payment tracking columns verified and accessible')
      console.log(`📊 Found ${testUser.failedPaymentCount} failed payments for test user`)
    } else {
      console.log('⚠️ No users found, but columns are accessible')
    }
    
    console.log('🎉 Failed payment tracking setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error adding failed payment tracking:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
addFailedPaymentTracking()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
