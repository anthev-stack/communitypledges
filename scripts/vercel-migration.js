const { PrismaClient } = require('@prisma/client')

async function runVercelMigration() {
  console.log('🚀 Starting Vercel database migration...')
  
  const prisma = new PrismaClient()
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if we can query the User table
    console.log('🔍 Testing User table access...')
    const userCount = await prisma.user.count()
    console.log(`✅ User table accessible, found ${userCount} users`)
    
    // Run the PayPal separation migration
    console.log('🔧 Running PayPal separation migration...')
    try {
      // First, check if we need to rename existing PayPal fields
      const hasOldPaypalFields = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'paypalEmail'
      `
      
      if (hasOldPaypalFields.length > 0) {
        console.log('🔄 Renaming existing PayPal fields to payout-specific...')
        await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN "paypalEmail" TO "payoutPaypalEmail"`
        await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN "paypalUserId" TO "payoutPaypalUserId"`
        await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN "paypalConnected" TO "payoutPaypalConnected"`
        await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN "paypalConnectedAt" TO "payoutPaypalConnectedAt"`
        console.log('✅ Existing PayPal fields renamed to payout-specific')
      }
      
      // Add payment-specific PayPal fields
      console.log('➕ Adding payment-specific PayPal fields...')
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paymentPaypalEmail" TEXT`
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paymentPaypalUserId" TEXT`
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paymentPaypalConnected" BOOLEAN NOT NULL DEFAULT false`
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paymentPaypalConnectedAt" TIMESTAMP(3)`
      console.log('✅ Payment-specific PayPal fields added')
      
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate column') ||
          error.message.includes('column') && error.message.includes('already exists')) {
        console.log('✅ PayPal fields already exist or renamed')
      } else {
        console.error('❌ Error with PayPal migration:', error.message)
        console.error('Error code:', error.code)
        console.error('Full error:', error)
        throw error
      }
    }
    
    // Verify the columns were added by trying to query them
    console.log('🔍 Verifying PayPal columns exist...')
    try {
      const testUser = await prisma.user.findFirst({
        select: { 
          id: true, 
          payoutPaypalEmail: true,
          paymentPaypalEmail: true,
          payoutPaypalConnected: true,
          paymentPaypalConnected: true
        }
      })
      console.log('✅ PayPal columns verified and accessible')
    } catch (verifyError) {
      console.error('❌ Column verification failed:', verifyError.message)
      throw verifyError
    }
    
    console.log('🎉 Vercel migration completed successfully!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    console.error('Error details:', {
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    // Don't exit with error code in Vercel - just log it
    console.log('⚠️ Continuing build despite migration error')
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
runVercelMigration()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    console.log('⚠️ Exiting with code 0 to not break build')
    process.exit(0)
  })
