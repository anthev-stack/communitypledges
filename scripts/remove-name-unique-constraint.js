const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function removeNameUniqueConstraint() {
  try {
    console.log('🔧 Removing unique constraint from name field...')
    
    // Execute the SQL commands separately
    await prisma.$executeRawUnsafe('ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_name_key";')
    
    console.log('✅ Successfully removed unique constraint from name field')
    
  } catch (error) {
    console.error('❌ Error removing unique constraint:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
removeNameUniqueConstraint()
  .then(() => {
    console.log('🎉 Name unique constraint removal completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Name unique constraint removal failed:', error)
    process.exit(1)
  })
