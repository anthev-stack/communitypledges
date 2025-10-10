# Installation Instructions - Stripe Payment System

Complete step-by-step instructions to install and configure the Stripe payment and payout system.

## ⚡ Quick Overview

**Time Required:** 20-30 minutes  
**Difficulty:** Medium  
**Prerequisites:** Basic terminal knowledge, Stripe account

---

## 📋 Pre-Installation Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database running
- [ ] Stripe account created (free at stripe.com)
- [ ] Access to your project's environment variables
- [ ] Git repository set up (optional but recommended)

---

## 🔧 Step-by-Step Installation

### Step 1: Backup Your Database

**IMPORTANT:** Always backup before schema changes!

```bash
# Using pg_dump (PostgreSQL)
pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d).sql

# Or use your hosting provider's backup feature
```

### Step 2: Update Dependencies

The required dependencies should already be in your `package.json`:

```json
{
  "dependencies": {
    "stripe": "^18.5.0",
    "@stripe/react-stripe-js": "^4.0.2",
    "@stripe/stripe-js": "^7.9.0"
  }
}
```

If not, install them:

```bash
npm install stripe @stripe/react-stripe-js @stripe/stripe-js
```

### Step 3: Apply Database Schema Changes

**Option A: Using Prisma Migrate (Recommended for Production)**

```bash
# Create a migration
npx prisma migrate dev --name add_stripe_connect_fields

# This will:
# 1. Create a migration file
# 2. Apply it to your database
# 3. Generate Prisma Client
```

**Option B: Using Prisma Push (Development/Quick Setup)**

```bash
# Push schema directly to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**Verify the changes:**

```bash
# Check your database has new fields
npx prisma studio
# Browse the User and Pledge models to verify new fields exist
```

### Step 4: Run Data Migration Script

Update existing data to work with the new schema:

```bash
node scripts/migrate-stripe-schema.js
```

**Expected output:**
```
🚀 Starting Stripe Connect migration...

1️⃣  Updating existing users with default values...
   ✅ Found X users without country set

2️⃣  Found X users with old payout accounts
   ℹ️  Old payout fields preserved for backward compatibility

3️⃣  Updating pledge statuses...
   ✅ Updated X pledge statuses

4️⃣  Verifying migration...
   ✅ Migration verification:
      - Total users: X
      - Total pledges: X
      - Users with Stripe Connect: X

✅ Migration completed successfully!
```

### Step 5: Get Stripe API Keys

1. **Sign up for Stripe** (if you haven't already)
   - Go to https://stripe.com
   - Click "Sign up"
   - Complete registration

2. **Access your API keys**
   - Log in to https://dashboard.stripe.com
   - Click **Developers** in the left sidebar
   - Click **API keys**

3. **Copy your TEST keys** (for development)
   - **Publishable key**: `pk_test_...` (visible)
   - **Secret key**: `sk_test_...` (click "Reveal test key")

**Don't use live keys yet!** Start with test keys.

### Step 6: Configure Environment Variables

#### Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
# ============================================
# STRIPE CONFIGURATION
# ============================================

# Get these from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY="sk_test_51ABC...xyz"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51ABC...xyz"

# Platform fee (2% = 0.02)
PLATFORM_FEE="0.02"

# Cron secret for securing automatic payments
# Generate with: openssl rand -hex 32
CRON_SECRET="your-random-secret-here"

# ============================================
# EXISTING CONFIGURATION (if not already set)
# ============================================

# Application URL
NEXTAUTH_URL="http://localhost:3000"

# NextAuth secret
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-nextauth-secret"

# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Discord OAuth (optional)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Email (optional but recommended)
EMAIL_SERVER="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Community Pledges <noreply@communitypledges.com>"
```

**Generate secure secrets:**

```bash
# For CRON_SECRET
openssl rand -hex 32

# For NEXTAUTH_SECRET (if not already set)
openssl rand -base64 32
```

#### Production (Vercel/Hosting Platform)

Add the same environment variables to your hosting platform:

**Vercel:**
1. Go to your project on vercel.com
2. Click **Settings**
3. Click **Environment Variables**
4. Add each variable (copy from .env.local)
5. Set environment: **Production**, **Preview**, **Development**
6. Click **Save**

**Other platforms:** Follow their environment variable setup guide.

### Step 7: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

### Step 8: Verify Installation

#### Test 1: Check API Routes

Visit these URLs to verify they respond (should return JSON):

```
http://localhost:3000/api/stripe/connect/status
http://localhost:3000/api/user/country
```

You should see: `{"error":"Unauthorized"}` (expected - you're not logged in)

#### Test 2: Add Payment Method

1. Log in to your application
2. Go to **Settings**
3. Find **Payment Method** section
4. Click **Add Payment Method**
5. Use test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
6. Click **Save**

**Expected:** "Payment method added successfully" ✅

#### Test 3: Connect Stripe (Server Owner)

1. Still in **Settings**, go to **Payout Settings**
2. Select a country (e.g., "United States")
3. Click **Save Country**
4. Click **Connect Stripe**
5. Complete Stripe onboarding with test data:
   - Name: Any name
   - DOB: Any past date
   - Address: Any valid address
   - Phone: `555-555-5555`
   - SSN (US): `000000000`
6. Add test bank account (Stripe provides test numbers)
7. Submit and return

**Expected:** "Stripe Connected Successfully" ✅

#### Test 4: Create and Process Pledge

1. Create a test server (set cost to $50, withdrawal day to today's date + 2)
2. Log in as a different user
3. Add payment method (test card)
4. Pledge to the server ($10)
5. Manually trigger withdrawal processing:

```bash
curl http://localhost:3000/api/cron/process-withdrawals
```

6. Check Stripe Dashboard → Payments → See test payment
7. Check Stripe Dashboard → Transfers → See test transfer

**Expected:** Payment and transfer appear in Stripe Dashboard ✅

### Step 9: Check Database

Verify data is being stored correctly:

```bash
npx prisma studio
```

Browse these tables:
- **User** - Check `stripeCustomerId`, `stripeAccountId` fields
- **Pledge** - Check `status` field (should be "ACTIVE")
- **Withdrawal** - Check recent withdrawals

### Step 10: Review Logs

Check for any errors in your terminal:

```bash
# You should NOT see errors like:
# - "STRIPE_SECRET_KEY is not set"
# - "Cannot find module"
# - "Database error"
```

---

## ✅ Installation Complete!

If all tests pass, your Stripe payment system is successfully installed!

### What You Can Now Do

- ✅ Users can save payment methods
- ✅ Server owners can connect Stripe
- ✅ Pledges are created and tracked
- ✅ Optimization algorithm calculates savings
- ✅ Manual withdrawal processing works
- ✅ Data is stored in database
- ✅ Stripe Dashboard shows activity

---

## 🚀 Next Steps

### 1. Test Thoroughly

Test all user flows:
- User registration and login
- Adding/removing payment methods
- Server creation
- Making pledges
- Stripe Connect onboarding
- Withdrawal processing

### 2. Configure Email Notifications (Optional)

Set up email notifications for:
- Payment confirmations
- Failed payments
- Payout notifications
- Account suspensions

See your existing email configuration.

### 3. Read Documentation

Familiarize yourself with:
- `PAYMENT_SETUP_GUIDE.md` - For users
- `PAYOUT_SETUP_GUIDE.md` - For server owners
- `STRIPE_SETUP.md` - For going live

### 4. Plan Going Live

Before going to production:
1. Complete Stripe profile verification
2. Request Connect platform approval (1-3 days)
3. Get live Stripe API keys
4. Update production environment variables
5. Test with small real amounts
6. Monitor closely for the first week

---

## 🐛 Troubleshooting Installation

### Issue: Prisma errors during migration

**Error:** `P1001: Can't reach database server`

**Solution:**
```bash
# Check database is running
# Verify DATABASE_URL in .env.local
# Try connecting manually:
psql postgresql://user:password@localhost:5432/database
```

### Issue: "STRIPE_SECRET_KEY is not set"

**Solution:**
```bash
# Check .env.local has the key
cat .env.local | grep STRIPE

# Restart dev server
npm run dev
```

### Issue: Module not found errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npx prisma generate
```

### Issue: Cannot save payment method

**Possible causes:**
1. Wrong publishable key (must start with `pk_test_` or `pk_live_`)
2. Stripe Elements not loading
3. API route not responding

**Check:**
```bash
# Verify key in browser console
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

# Check API route responds
curl http://localhost:3000/api/stripe/setup-intent \
  -H "Content-Type: application/json" \
  -X POST
```

### Issue: Stripe Connect onboarding fails

**Possible causes:**
1. Country not selected first
2. Country not supported
3. Test mode restrictions

**Solution:**
1. Make sure country is saved before clicking "Connect Stripe"
2. Select a supported country from the list
3. Use test mode for development

### Issue: Migration script fails

**Error:** Database connection issues

**Solution:**
```bash
# Make sure database is running
# Check DATABASE_URL is correct
# Try running migrations manually:
npx prisma migrate deploy
```

---

## 🔄 Rollback Instructions

If you need to rollback the changes:

### 1. Restore Database

```bash
# Using your backup
psql -U your_username -d your_database < backup_YYYYMMDD.sql
```

### 2. Revert Code Changes

```bash
# If using git
git checkout previous-commit-hash

# Or manually remove new files:
rm lib/optimization.ts
rm lib/countries.ts
rm lib/constants.ts
rm app/api/stripe/setup-intent/route.ts
rm app/api/stripe/update-payment-method/route.ts
rm app/api/user/country/route.ts
# ... etc
```

### 3. Restore Previous Schema

```bash
# Restore your previous prisma/schema.prisma
git checkout HEAD~1 prisma/schema.prisma

# Apply it
npx prisma migrate deploy
```

---

## 📞 Getting Help

### Documentation
- **Quick Start**: `QUICK_START_STRIPE.md`
- **User Guide**: `PAYMENT_SETUP_GUIDE.md`
- **Owner Guide**: `PAYOUT_SETUP_GUIDE.md`
- **Admin Guide**: `STRIPE_SETUP.md`
- **Technical**: `STRIPE_IMPLEMENTATION_SUMMARY.md`

### Support
- 📧 Email: support@communitypledges.com
- 🎫 Open a ticket in your application
- 🐛 Report bugs on GitHub (if applicable)

### Stripe Resources
- 📚 Stripe Docs: https://stripe.com/docs
- 💬 Stripe Support: support@stripe.com
- 🧑‍💻 Stripe Dev Community: https://dev.to/stripe

---

## ✨ Success!

Your Community Pledges platform now has a complete, production-ready payment and payout system powered by Stripe!

**Key Features Unlocked:**
- 💳 Secure payment collection
- 🏦 Automatic payouts to server owners
- 🧮 Smart optimization algorithm
- 🌍 45+ country support
- 🔄 Automated monthly processing
- 🔒 PCI-DSS compliant

**Enjoy your new payment system!** 🎉

---

*Installation guide version 1.0*
*Last updated: October 2025*

