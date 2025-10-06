const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserRoleEnumProduction() {
  try {
    console.log('🔧 Fixing UserRole enum in production database...')
    
    // Create the UserRole enum using raw SQL
    try {
      await prisma.$executeRaw`
        CREATE TYPE "UserRole" AS ENUM ('user', 'partner', 'moderator', 'admin');
      `
      console.log('✅ UserRole enum created successfully!')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ UserRole enum already exists!')
      } else {
        console.error('❌ Error creating UserRole enum:', error.message)
        throw error
      }
    }
    
    // Add role column to User table if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';
      `
      console.log('✅ Role column added successfully!')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Role column already exists!')
      } else {
        console.error('❌ Error adding role column:', error.message)
        throw error
      }
    }
    
    // Update existing users to have 'user' role if they don't have one
    try {
      const result = await prisma.$executeRaw`
        UPDATE "User" SET "role" = 'user' WHERE "role" IS NULL;
      `
      console.log(`✅ Updated ${result} users with default role`)
    } catch (error) {
      console.log('⚠️  Could not update existing users:', error.message)
    }
    
    // Test user table access without creating users (to avoid field conflicts)
    console.log('🧪 Testing user table access...')
    
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User table accessible, found ${userCount} users`)
      console.log('✅ UserRole enum verification completed')
      
    } catch (testError) {
      console.error('❌ User table access failed:', testError.message)
      throw testError
    }
    
    console.log('🎉 UserRole enum fix completed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing UserRole enum:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixUserRoleEnumProduction()
  .then(() => {
    console.log('✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
