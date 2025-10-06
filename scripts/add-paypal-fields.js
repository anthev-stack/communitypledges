const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addPayPalFields() {
  try {
    console.log('Adding PayPal fields to User table...')
    
    // Add the new PayPal fields
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "paypalUserId" TEXT,
      ADD COLUMN IF NOT EXISTS "paypalConnected" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "paypalConnectedAt" TIMESTAMP(3)
    `
    
    console.log('✅ PayPal fields added successfully!')
    
    // Verify the changes
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('paypalUserId', 'paypalConnected', 'paypalConnectedAt')
      ORDER BY column_name
    `
    
    console.log('New PayPal fields in database:', result)
    
  } catch (error) {
    console.error('❌ Error adding PayPal fields:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addPayPalFields()
  .then(() => {
    console.log('PayPal fields migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('PayPal fields migration failed:', error)
    process.exit(1)
  })
