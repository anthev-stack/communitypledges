const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateUserRoles() {
  try {
    console.log('🔄 Updating user roles to use new enum...')
    
    // First, check if we need to run this migration by checking the schema
    console.log('🔍 Checking current role values...')
    
    // Use raw SQL to get users with old role values since Prisma can't read them
    const usersWithOldRoles = await prisma.$queryRaw`
      SELECT id, role FROM "User" 
      WHERE role IN ('USER', 'MODERATOR', 'ADMIN')
    `
    
    console.log(`📊 Found ${usersWithOldRoles.length} users with old role values`)
    
    if (usersWithOldRoles.length === 0) {
      console.log('✅ No users need role migration')
      return
    }
    
    console.log(`📊 Found ${usersWithOldRoles.length} users to update`)
    
    for (const user of usersWithOldRoles) {
      let newRole
      
      switch (user.role) {
        case 'USER':
          newRole = 'user'
          break
        case 'MODERATOR':
          newRole = 'moderator'
          break
        case 'ADMIN':
          newRole = 'admin'
          break
        default:
          newRole = 'user' // Default to user for any unknown roles
          console.log(`⚠️  Unknown role "${user.role}" for user ${user.id}, defaulting to user`)
      }
      
      // Use raw SQL to update the role since Prisma might not handle the enum conversion properly
      await prisma.$executeRaw`
        UPDATE "User" 
        SET role = ${newRole} 
        WHERE id = ${user.id}
      `
      
      console.log(`✅ Updated user ${user.id}: ${user.role} → ${newRole}`)
    }
    
    console.log('🎉 User roles updated successfully!')
    
  } catch (error) {
    console.error('❌ Error updating user roles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRoles()
  .then(() => {
    console.log('✅ User role migration completed successfully')
  })
  .catch((e) => {
    console.error('❌ User role migration failed:', e)
    process.exit(1)
  })
