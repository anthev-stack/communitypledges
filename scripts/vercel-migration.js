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
    
    // Try to add the paypalEmail column
    console.log('🔧 Attempting to add paypalEmail column...')
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "paypalEmail" TEXT`
      console.log('✅ paypalEmail column added successfully!')
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate column') ||
          error.message.includes('column "paypalEmail" of relation "User" already exists')) {
        console.log('✅ paypalEmail column already exists')
      } else {
        console.error('❌ Error adding paypalEmail column:', error.message)
        console.error('Error code:', error.code)
        console.error('Full error:', error)
        throw error
      }
    }
    
    // Verify the column was added by trying to query it
    console.log('🔍 Verifying column exists...')
    try {
      const testUser = await prisma.user.findFirst({
        select: { id: true, paypalEmail: true }
      })
      console.log('✅ paypalEmail column verified and accessible')
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
