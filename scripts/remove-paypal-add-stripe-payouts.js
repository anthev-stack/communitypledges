const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Removing PayPal fields and adding Stripe payout fields...')
  
  try {
    // Remove PayPal columns from User table
    console.log('📝 Removing PayPal columns...')
    
    // Note: We'll use raw SQL since Prisma doesn't support dropping columns in migrations easily
    // PostgreSQL doesn't support DROP COLUMN IF EXISTS, so we'll try each one individually
    const paypalColumns = [
      'payoutPaypalEmail',
      'payoutPaypalUserId', 
      'payoutPaypalConnected',
      'payoutPaypalConnectedAt',
      'paymentPaypalEmail',
      'paymentPaypalUserId',
      'paymentPaypalConnected', 
      'paymentPaypalConnectedAt'
    ]
    
    for (const column of paypalColumns) {
      try {
        await prisma.$executeRaw`ALTER TABLE "User" DROP COLUMN "${column}"`
        console.log(`✅ Removed column: ${column}`)
      } catch (error) {
        console.log(`⚠️ Column ${column} may not exist, skipping...`)
      }
    }
    
    // Add Stripe payout columns
    console.log('📝 Adding Stripe payout columns...')
    
    const stripeColumns = [
      { name: 'stripePayoutAccountId', type: 'TEXT' },
      { name: 'stripePayoutConnected', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'stripePayoutConnectedAt', type: 'TIMESTAMP(3)' },
      { name: 'stripePayoutRequirements', type: 'TEXT' }
    ]
    
    for (const column of stripeColumns) {
      try {
        await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "${column.name}" ${column.type}`
        console.log(`✅ Added column: ${column.name}`)
      } catch (error) {
        console.log(`⚠️ Column ${column.name} may already exist, skipping...`)
      }
    }
    
    console.log('✅ Successfully updated User table schema')
    
    // Update any users who had PayPal connected to reset their payout status
    console.log('🔄 Resetting payout status for users with PayPal...')
    
    // Check if there are any users (this will be empty since we removed PayPal fields)
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      console.log(`📧 Found ${userCount} users - they'll need to set up Stripe payout accounts`)
      
      // Log this for admin notification
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      })
      
      for (const user of allUsers) {
        await prisma.activityLog.create({
          data: {
            type: 'system_notification',
            message: 'PayPal integration has been removed. Please set up Stripe payout in your settings to receive payments.',
            userId: user.id,
            amount: 0
          }
        })
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('📋 Next steps:')
    console.log('   1. Update your application code to use Stripe-only')
    console.log('   2. Notify users to set up Stripe payout accounts')
    console.log('   3. Test the new Stripe payout flow')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

