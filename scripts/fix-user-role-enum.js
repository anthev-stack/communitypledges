const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserRoleEnum() {
  try {
    console.log('🔧 Fixing UserRole enum in database...')
    
    // First, check if the enum exists
    const enumExists = await prisma.$queryRaw`
      SELECT 1 FROM pg_type WHERE typname = 'UserRole';
    `
    
    if (enumExists.length === 0) {
      console.log('📝 Creating UserRole enum...')
      
      // Create the UserRole enum
      await prisma.$executeRaw`
        CREATE TYPE "UserRole" AS ENUM ('user', 'partner', 'moderator', 'admin');
      `
      
      console.log('✅ UserRole enum created successfully!')
    } else {
      console.log('✅ UserRole enum already exists!')
    }
    
    // Check if the User table exists and has the role column
    const tableExists = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'User';
    `
    
    if (tableExists.length > 0) {
      // Check if the role column exists
      const roleColumnExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'role';
      `
      
      if (roleColumnExists.length === 0) {
        console.log('📝 Adding role column to User table...')
        
        // Add the role column
        await prisma.$executeRaw`
          ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';
        `
        
        console.log('✅ Role column added successfully!')
      } else {
        console.log('✅ Role column already exists!')
      }
    } else {
      console.log('⚠️  User table does not exist. Run prisma db push or migrate first.')
    }
    
    // Test creating a user to make sure everything works
    console.log('🧪 Testing user creation...')
    
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      })
      
      console.log('✅ Test user created successfully:', testUser.id)
      
      // Clean up test user
      await prisma.user.delete({
        where: { id: testUser.id }
      })
      
      console.log('🧹 Test user cleaned up')
      
    } catch (testError) {
      console.error('❌ Test user creation failed:', testError.message)
    }
    
    console.log('🎉 UserRole enum fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing UserRole enum:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixUserRoleEnum()
  .then(() => {
    console.log('✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
