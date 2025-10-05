const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addPartnerStreamersTable() {
  try {
    console.log('🔄 Adding PartnerStreamer table...')
    
    // Check if the table already exists by trying to query it
    try {
      await prisma.partnerStreamer.findMany({ take: 1 })
      console.log('✅ PartnerStreamer table already exists')
      return
    } catch (error) {
      // Table doesn't exist, continue with creation
      console.log('📝 Creating PartnerStreamer table...')
    }

    // The table will be created by Prisma when we run the migration
    console.log('✅ PartnerStreamer table will be created by Prisma migration')
    
    // Add some default partner streamers
    console.log('🎮 Adding default partner streamers...')
    
    // Find an admin user to be the "addedBy" user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    })
    
    if (adminUser) {
      // Add hrry as the first partner streamer
      await prisma.partnerStreamer.upsert({
        where: { username: 'hrry' },
        update: {},
        create: {
          username: 'hrry',
          displayName: 'hrry',
          priority: 100,
          isActive: true,
          addedBy: adminUser.id
        }
      })
      console.log('✅ Added hrry as partner streamer')
    } else {
      console.log('⚠️  No admin user found, skipping default streamers')
    }
    
    console.log('🎉 PartnerStreamer setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up PartnerStreamer:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
addPartnerStreamersTable()
  .then(() => {
    console.log('✅ PartnerStreamer setup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ PartnerStreamer setup failed:', error)
    process.exit(1)
  })
