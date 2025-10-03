const { PrismaClient } = require('@prisma/client')

async function addPayPalColumn() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== ADDING PAYPAL COLUMN ===')
    console.log('Connecting to database...')
    await prisma.$connect()
    console.log('Database connected successfully')
    
    console.log('Attempting to add paypalEmail column...')
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "paypalEmail" TEXT`
      console.log('✅ paypalEmail column added successfully')
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
        console.log('✅ paypalEmail column already exists')
      } else {
        console.error('❌ Error adding paypalEmail column:', error.message)
        throw error
      }
    }
    
    console.log('=== COLUMN ADDITION COMPLETE ===')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('This might be a database connection or permission issue')
  } finally {
    await prisma.$disconnect()
  }
}

addPayPalColumn()
