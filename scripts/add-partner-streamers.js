const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function addPartnerStreamersTable() {
  try {
    console.log('🔄 Adding PartnerStreamer table...')
    
    // Check if the table already exists by trying to query it
    try {
      await prisma.partnerStreamer.findMany({ take: 1 })
      console.log('✅ PartnerStreamer table already exists')
      
      // Add default partner streamers if they don't exist
      console.log('🎮 Adding default partner streamers...')
      
      // Find an admin user to be the "addedBy" user
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      })
      
      if (adminUser) {
        // Check if hrry already exists
        const existingHrry = await prisma.partnerStreamer.findUnique({
          where: { username: 'hrry' }
        })
        
        if (!existingHrry) {
          // Add hrry as the first partner streamer
          await prisma.partnerStreamer.create({
            data: {
              username: 'hrry',
              displayName: 'hrry',
              priority: 100,
              isActive: true,
              addedBy: adminUser.id
            }
          })
          console.log('✅ Added hrry as partner streamer')
        } else {
          console.log('✅ hrry already exists as partner streamer')
        }
      } else {
        console.log('⚠️  No admin user found, skipping default streamers')
      }
      
    } catch (error) {
      // Table doesn't exist yet, try to create it
      console.log('📝 PartnerStreamer table does not exist - creating it...')
      
      try {
        // Read and execute the SQL migration
        const sqlPath = path.join(__dirname, 'create-partner-streamer-migration.sql')
        const sqlContent = fs.readFileSync(sqlPath, 'utf8')
        
        await prisma.$executeRawUnsafe(sqlContent)
        console.log('✅ PartnerStreamer table created successfully')
        
        // Now try to add default streamers
        console.log('🎮 Adding default partner streamers...')
        
        const adminUser = await prisma.user.findFirst({
          where: { role: 'admin' }
        })
        
        if (adminUser) {
          await prisma.partnerStreamer.create({
            data: {
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
        
      } catch (createError) {
        console.log('⚠️  Could not create PartnerStreamer table:', createError.message)
        console.log('📝 Table will be created by Prisma migration on next deployment')
      }
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
