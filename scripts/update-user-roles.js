const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateUserRoles() {
  try {
    console.log('🔄 Updating user roles to use new enum...')
    
    // Update existing users to use the new enum values
    const users = await prisma.user.findMany({
      select: { id: true, role: true }
    })
    
    console.log(`📊 Found ${users.length} users to update`)
    
    for (const user of users) {
      let newRole
      
      switch (user.role) {
        case 'user':
          newRole = 'USER'
          break
        case 'moderator':
          newRole = 'MODERATOR'
          break
        case 'admin':
          newRole = 'ADMIN'
          break
        default:
          newRole = 'USER' // Default to USER for any unknown roles
          console.log(`⚠️  Unknown role "${user.role}" for user ${user.id}, defaulting to USER`)
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole }
      })
      
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
