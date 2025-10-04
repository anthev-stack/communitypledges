const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addUsernameTracking() {
  try {
    console.log('🚀 Adding username change tracking field...')
    
    // Test database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if column already exists
    console.log('🔍 Checking if username tracking field exists...')
    
    try {
      // Try to query the new field to see if it exists
      await prisma.user.findFirst({
        select: {
          lastUsernameChange: true
        }
      })
      console.log('✅ Username tracking field already exists')
    } catch (error) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('🔧 Adding username tracking field...')
        
        // Add the new column
        await prisma.$executeRaw`
          ALTER TABLE "User" 
          ADD COLUMN IF NOT EXISTS "lastUsernameChange" TIMESTAMP(3);
        `
        
        console.log('✅ Username tracking field added successfully')
      } else {
        throw error
      }
    }
    
    // Verify the column exists and is accessible
    console.log('🔍 Verifying field is accessible...')
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        lastUsernameChange: true
      }
    })
    
    if (testUser) {
      console.log('✅ Username tracking field verified and accessible')
    } else {
      console.log('⚠️ No users found, but field is accessible')
    }
    
    console.log('🎉 Username tracking setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error adding username tracking field:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
addUsernameTracking()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
