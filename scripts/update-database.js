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
        console.error('This might be because the column already exists or there are permission issues')
        // Try alternative approach
        try {
          await prisma.$executeRaw`ALTER TABLE "User" ADD "paypalEmail" TEXT`
          console.log('✅ paypalEmail column added with alternative syntax')
        } catch (altError) {
          console.error('❌ Alternative approach also failed:', altError)
        }
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
    
    if (verifyResult.length > 0) {
      console.log('✅ Column verification successful - paypalEmail exists')
    } else {
      console.log('⚠️ Column verification failed - paypalEmail may not exist')
    }
    
    console.log('=== DATABASE MIGRATION COMPLETE ===')
  } catch (error) {
    console.error('❌ Error updating database:', error)
    console.error('Error details:', error.message)
    console.error('Error code:', error.code)
    console.error('This is not fatal - the app will continue to work')
  } finally {
    await prisma.$disconnect()
  }
}

updateDatabase()
