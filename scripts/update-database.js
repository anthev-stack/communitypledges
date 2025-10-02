const { PrismaClient } = require('@prisma/client')

async function updateDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== DATABASE MIGRATION START ===')
    console.log('Checking database connection...')
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Check if paypalEmail column exists
    console.log('Checking if paypalEmail column exists...')
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'paypalEmail'
    `
    
    console.log('Column check result:', result)
    
    if (result.length === 0) {
      console.log('paypalEmail column does not exist, adding it...')
      try {
        await prisma.$executeRaw`
          ALTER TABLE "User" ADD COLUMN "paypalEmail" TEXT
        `
        console.log('✅ paypalEmail column added successfully')
      } catch (alterError) {
        console.error('❌ Error adding paypalEmail column:', alterError)
        // Don't exit, just log the error
      }
    } else {
      console.log('✅ paypalEmail column already exists')
    }
    
    // Verify the column was added
    console.log('Verifying column exists...')
    const verifyResult = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'paypalEmail'
    `
    console.log('Verification result:', verifyResult)
    
    console.log('=== DATABASE MIGRATION COMPLETE ===')
  } catch (error) {
    console.error('❌ Error updating database:', error)
    console.error('Error details:', error.message)
    console.error('Error code:', error.code)
    // Don't exit on error, just log it
  } finally {
    await prisma.$disconnect()
  }
}

updateDatabase()
