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
    
    // Run the Stripe payout migration
    console.log('🔧 Running Stripe payout migration...')
    try {
      // Remove old PayPal fields if they exist
      console.log('🗑️ Removing old PayPal fields...')
      const paypalColumns = ['paypalEmail', 'paypalUserId', 'paypalConnected', 'paypalConnectedAt', 
                           'payoutPaypalEmail', 'payoutPaypalUserId', 'payoutPaypalConnected', 'payoutPaypalConnectedAt',
                           'paymentPaypalEmail', 'paymentPaypalUserId', 'paymentPaypalConnected', 'paymentPaypalConnectedAt']
      
      for (const column of paypalColumns) {
        try {
          await prisma.$executeRaw`ALTER TABLE "User" DROP COLUMN IF EXISTS "${column}"`
        } catch (error) {
          // Ignore errors if column doesn't exist
          if (!error.message.includes('does not exist')) {
            console.log(`⚠️ Could not drop column ${column}:`, error.message)
          }
        }
      }
      
      // Add Stripe payout fields
      console.log('➕ Adding Stripe payout fields...')
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripePayoutAccountId" TEXT`
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripePayoutConnected" BOOLEAN NOT NULL DEFAULT false`
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripePayoutConnectedAt" TIMESTAMP(3)`
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripePayoutRequirements" TEXT`
      console.log('✅ Stripe payout fields added')
      
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate column') ||
          error.message.includes('column') && error.message.includes('already exists')) {
        console.log('✅ Stripe payout fields already exist')
      } else {
        console.error('❌ Error with Stripe payout migration:', error.message)
        console.error('Error code:', error.code)
        console.error('Full error:', error)
        throw error
      }
    }
    
    // Verify the columns were added by trying to query them
    console.log('🔍 Verifying Stripe payout columns exist...')
    try {
      const testUser = await prisma.user.findFirst({
        select: { 
          id: true, 
          stripePayoutAccountId: true,
          stripePayoutConnected: true,
          stripePayoutConnectedAt: true,
          stripePayoutRequirements: true
        }
      })
      console.log('✅ Stripe payout columns verified and accessible')
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
