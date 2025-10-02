const { PrismaClient } = require('@prisma/client')

async function updateDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Checking database connection...')
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Check if paypalEmail column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'paypalEmail'
    `
    
    if (result.length === 0) {
      console.log('paypalEmail column does not exist, adding it...')
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "paypalEmail" TEXT
      `
      console.log('paypalEmail column added successfully')
    } else {
      console.log('paypalEmail column already exists')
    }
    
    console.log('Database update completed')
  } catch (error) {
    console.error('Error updating database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateDatabase()
