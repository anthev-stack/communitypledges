# Quick Start Guide - Stripe Implementation

Get your Stripe payment and payout system running in 15 minutes!

## Prerequisites

- Node.js installed
- PostgreSQL database
- Stripe account (free to create)

---

## Step 1: Update Database Schema (2 minutes)

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push

# Run migration script to update existing data
node scripts/migrate-stripe-schema.js
```

---

## Step 2: Get Stripe API Keys (3 minutes)

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up or log in
3. Click **Developers** → **API keys**
4. Copy your **Test keys**:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

---

## Step 3: Configure Environment Variables (2 minutes)

Create or update `.env.local`:

```env
# Stripe Keys (TEST MODE - get from dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"

# Platform Fee (2%)
PLATFORM_FEE="0.02"

# Cron Secret (generate random string)
CRON_SECRET="your-random-secret-here"

# NextAuth (if not already set)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Database (if not already set)
DATABASE_URL="postgresql://..."
```

**Generate secrets:**
```bash
# For CRON_SECRET
openssl rand -hex 32

# For NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Step 4: Test Locally (5 minutes)

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

### Test as a Pledger (User)

1. Open http://localhost:3000
2. Create an account or log in
3. Go to **Settings**
4. Click **Add Payment Method**
5. Use test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
6. Click **Save Payment Method**
7. ✅ You should see "Payment method added successfully"

### Test as a Server Owner

1. Go to **Settings** → **Payout Settings**
2. Select your country (e.g., United States)
3. Click **Save Country**
4. Click **Connect Stripe**
5. Complete Stripe onboarding with test data:
   - Name: Any name
   - DOB: Any past date
   - Address: Any address
   - Phone: `555-555-5555`
   - SSN: `000000000` (US) or equivalent
6. Add test bank account (Stripe provides test numbers)
7. Submit and return
8. ✅ You should see "Stripe Connected Successfully"

---

## Step 5: Test Payment Flow (3 minutes)

1. Create a test server (as server owner)
2. Set server cost (e.g., $50/month)
3. Set withdrawal day (e.g., 15th)
4. Log in as different user
5. Add payment method (test card)
6. Pledge to the server (e.g., $10)
7. ✅ Pledge created successfully

### Test Optimization Algorithm

Create multiple pledges from different users to test optimization:
- If total pledges < server cost: Everyone pays full amount
- If total pledges > server cost: Everyone pays proportionally less!

---

## Step 6: Test Withdrawal Processing (Manual)

Trigger the cron job manually:

```bash
# Visit this URL in your browser or use curl
curl http://localhost:3000/api/cron/process-withdrawals
```

This will:
1. Calculate optimized amounts
2. Charge pledgers (in test mode)
3. Transfer to server owners (in test mode)
4. Update database

Check your Stripe Dashboard to see test payments and transfers!

---

## Verification Checklist

Before deploying, verify these work:

- [ ] Users can add payment methods
- [ ] Server owners can connect Stripe
- [ ] Pledges are created successfully
- [ ] Optimization algorithm calculates correctly
- [ ] Manual withdrawal processing works
- [ ] Check Stripe Dashboard shows test payments
- [ ] Check database for payment records
- [ ] Email notifications send (if configured)

---

## Deploy to Production

### 1. Get Live Stripe Keys

1. Complete your Stripe profile verification
2. Request Connect platform approval
3. Switch to **Live mode** in Stripe Dashboard
4. Copy your **Live keys**

### 2. Update Production Environment Variables

In Vercel (or your hosting platform):

```env
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_KEY"
PLATFORM_FEE="0.02"
CRON_SECRET="production-secret-different-from-dev"
```

### 3. Deploy

```bash
git add .
git commit -m "Add Stripe payment and payout system"
git push
```

Vercel will automatically:
- Deploy your changes
- Set up the cron job
- Use production environment variables

### 4. Test in Production

⚠️ **Test with small amounts first!**

1. Create real account
2. Add real payment method
3. Make small pledge ($2)
4. Wait for withdrawal day
5. Verify money flows correctly

---

## Monitoring

### Stripe Dashboard

Monitor in real-time:
- **Payments**: All pledger charges
- **Connect**: Server owner accounts
- **Transfers**: Money sent to owners
- **Logs**: API calls and errors

### Your Database

Monitor these tables:
- `User`: Payment methods and Connect accounts
- `Pledge`: Active pledges and optimized amounts
- `Withdrawal`: Scheduled and completed withdrawals
- `ActivityLog`: Payment history

---

## Common Issues

### "Stripe key not found"
- **Fix**: Check `.env.local` has `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### "Cannot save payment method"
- **Fix**: Verify publishable key starts with `pk_test_` or `pk_live_`

### "Country not selected"
- **Fix**: Select country in Settings before connecting Stripe

### "Payment declined"
- **Fix**: Use test card `4242 4242 4242 4242` in test mode

### Cron job not running
- **Fix**: Check `vercel.json` has cron configuration
- **Fix**: Verify `CRON_SECRET` matches in environment variables

---

## Need Help?

### Documentation
- **For Users**: See `PAYMENT_SETUP_GUIDE.md`
- **For Server Owners**: See `PAYOUT_SETUP_GUIDE.md`
- **For Admins**: See `STRIPE_SETUP.md`
- **Implementation Details**: See `STRIPE_IMPLEMENTATION_SUMMARY.md`

### Support
- 📧 Email: support@communitypledges.com
- 📚 Stripe Docs: https://stripe.com/docs
- 🎫 Open a ticket in your platform

---

## What's Next?

Your payment system is now live! Consider these enhancements:

1. **Webhooks** - Real-time event handling from Stripe
2. **Email Templates** - Customize payment notifications
3. **Analytics** - Track payment success rates
4. **Refund System** - Handle special cases
5. **Multiple Currencies** - Support international users

---

## Success! 🎉

Your Stripe payment and payout system is now configured and ready to use!

**Key Features:**
- ✅ Secure payment method storage
- ✅ Stripe Connect for payouts
- ✅ Smart optimization algorithm
- ✅ Automatic monthly processing
- ✅ 45+ countries supported
- ✅ Individual accounts (no business needed)

**For detailed documentation on each component, see the other guide files.**

---

*Setup time: ~15 minutes*
*Complexity: Medium*
*Stripe experience required: Beginner*

