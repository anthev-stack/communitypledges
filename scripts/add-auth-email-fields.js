const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addAuthEmailFields() {
  try {
    console.log('🚀 Adding auth email fields...')
    
    // Test database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if columns already exist
    console.log('🔍 Checking if auth email fields exist...')
    
    try {
      // Try to query the new fields to see if they exist (emailVerified already exists)
      await prisma.user.findFirst({
        select: {
          emailVerificationToken: true,
          emailVerificationExpires: true,
          passwordResetToken: true,
          passwordResetExpires: true
        }
      })
      console.log('✅ Auth email fields already exist')
    } catch (error) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('🔧 Adding auth email fields...')
        
        // Add the new columns (emailVerified already exists)
        await prisma.$executeRaw`
          ALTER TABLE "User" 
          ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
          ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
          ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);
        `
        
        console.log('✅ Auth email fields added successfully')
      } else {
        throw error
      }
    }
    
    // Verify the columns exist and are accessible
    console.log('🔍 Verifying fields are accessible...')
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        emailVerified: true, // This already exists
        emailVerificationToken: true,
        emailVerificationExpires: true,
        passwordResetToken: true,
        passwordResetExpires: true
      }
    })
    
    if (testUser) {
      console.log('✅ Auth email fields verified and accessible')
    } else {
      console.log('⚠️ No users found, but fields are accessible')
    }
    
    console.log('🎉 Auth email fields setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error adding auth email fields:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
addAuthEmailFields()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
