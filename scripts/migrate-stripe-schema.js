/**
 * Migration script to update database schema for Stripe Connect
 * Run this AFTER updating your Prisma schema
 * 
 * Usage: node scripts/migrate-stripe-schema.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  console.log('🚀 Starting Stripe Connect migration...\n')

  try {
    // First, generate and push the Prisma schema
    console.log('📝 Make sure you have run: npx prisma generate && npx prisma db push')
    console.log('   This will apply the schema changes to your database.\n')

    // Update existing users with default values for new fields
    console.log('1️⃣  Updating existing users with default values...')
    
    // Note: These updates will be handled by Prisma defaults, but we can
    // verify that old data is preserved
    
    const usersWithoutCountry = await prisma.user.count({
      where: { country: null }
    })
    
    console.log(`   ✅ Found ${usersWithoutCountry} users without country set`)
    console.log('   ℹ️  Users will select their country when connecting Stripe\n')

    // Check for users with old stripePayoutAccountId
    const usersWithOldPayout = await prisma.user.count({
      where: {
        stripePayoutAccountId: { not: null }
      }
    })

    if (usersWithOldPayout > 0) {
      console.log(`2️⃣  Found ${usersWithOldPayout} users with old payout accounts`)
      console.log('   ℹ️  Old payout fields preserved for backward compatibility\n')
    }

    // Update pledge statuses
    console.log('3️⃣  Updating pledge statuses...')
    
    // Convert old status strings to new enum format
    const pledgeUpdates = await prisma.$executeRaw`
      UPDATE "Pledge"
      SET status = CASE
        WHEN status = 'pending' THEN 'ACTIVE'
        WHEN status = 'completed' THEN 'ACTIVE'
        WHEN status = 'failed' THEN 'SUSPENDED'
        WHEN status = 'cancelled' THEN 'CANCELLED'
        ELSE 'ACTIVE'
      END
      WHERE status NOT IN ('ACTIVE', 'CANCELLED', 'SUSPENDED')
    `
    
    console.log(`   ✅ Updated ${pledgeUpdates} pledge statuses\n`)

    // Verify everything is working
    console.log('4️⃣  Verifying migration...')
    
    const totalUsers = await prisma.user.count()
    const totalPledges = await prisma.pledge.count()
    const usersWithStripeConnect = await prisma.user.count({
      where: { stripeAccountId: { not: null } }
    })
    
    console.log('   ✅ Migration verification:')
    console.log(`      - Total users: ${totalUsers}`)
    console.log(`      - Total pledges: ${totalPledges}`)
    console.log(`      - Users with Stripe Connect: ${usersWithStripeConnect}`)
    console.log()

    console.log('✅ Migration completed successfully!\n')
    console.log('📋 Next steps:')
    console.log('   1. Deploy the updated code to your server')
    console.log('   2. Test Stripe Connect onboarding')
    console.log('   3. Test payment method setup')
    console.log('   4. Verify the optimization algorithm works\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrate()
  .catch((error) => {
    console.error('Migration error:', error)
    process.exit(1)
  })

