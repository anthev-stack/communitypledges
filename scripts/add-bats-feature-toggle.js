const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addBatsFeatureToggle() {
  try {
    console.log('🦇 Adding bats feature toggle to database...')
    
    // Check if the column already exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'batsEnabled'
    `
    
    if (result.length > 0) {
      console.log('✅ Bats feature toggle column already exists')
      return
    }

    // Add the batsEnabled column
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN "batsEnabled" BOOLEAN DEFAULT false
    `
    
    console.log('✅ Successfully added batsEnabled column to User table')
    
    // Set bats enabled for admin users using raw SQL to avoid type casting issues
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "batsEnabled" = true 
      WHERE role = 'admin'::UserRole
    `
    
    console.log('✅ Set bats enabled for admin users')
    
  } catch (error) {
    console.error('❌ Error adding bats feature toggle:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addBatsFeatureToggle()
  .then(() => {
    console.log('🎉 Bats feature toggle setup completed successfully!')
  })
  .catch((error) => {
    console.error('💥 Bats feature toggle setup failed:', error)
    process.exit(1)
  })
