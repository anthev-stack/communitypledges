# Stripe Setup Guide for Community Pledges

This guide will help you configure Stripe for both **payments** (from pledgers) and **payouts** (to server owners) using Stripe Connect.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Creating a Stripe Account](#creating-a-stripe-account)
3. [Getting API Keys](#getting-api-keys)
4. [Configuring Environment Variables](#configuring-environment-variables)
5. [Testing the Integration](#testing-the-integration)
6. [Going Live](#going-live)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A Stripe account (free to create)
- Access to your project's environment variables
- Basic understanding of Stripe Connect

---

## Creating a Stripe Account

### Step 1: Sign Up for Stripe

1. Go to [https://stripe.com](https://stripe.com)
2. Click **Sign Up** (top right)
3. Enter your email and create a password
4. Verify your email address

### Step 2: Complete Your Profile

1. Enter your business information (or personal if individual)
2. Provide tax information
3. Add bank account details (for receiving platform fees)

**Note**: You can start with test mode before completing full verification.

---

## Getting API Keys

### Step 1: Access API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** in the left sidebar
3. Click **API keys**

### Step 2: Get Test Keys (Development)

You'll see two types of keys:

#### Test Keys (for development)
- **Publishable key**: `pk_test_...`
- **Secret key**: `sk_test_...`

#### Live Keys (for production)
- **Publishable key**: `pk_live_...`
- **Secret key**: `sk_live_...`

**Start with TEST keys!** Never commit live keys to version control.

### Step 3: Copy Your Keys

1. Click **Reveal test key** for the secret key
2. Copy both keys
3. Keep them secure!

---

## Configuring Environment Variables

### Step 1: Create .env.local File

In your project root, create a `.env.local` file:

```bash
cp .env.example .env.local
```

### Step 2: Add Your Stripe Keys

Open `.env.local` and add your keys:

```env
# Stripe Keys (TEST MODE)
STRIPE_SECRET_KEY="sk_test_51ABC...xyz"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51ABC...xyz"

# Platform Fee (2%)
PLATFORM_FEE="0.02"

# Cron Secret (generate a random string)
CRON_SECRET="your-random-secret-here-use-openssl-rand-hex-32"
```

### Step 3: Set Other Required Variables

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Database
DATABASE_URL="your-postgres-connection-string"
```

### Step 4: Vercel Environment Variables

If deploying to Vercel:

1. Go to your project settings
2. Click **Environment Variables**
3. Add each variable:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `PLATFORM_FEE`
   - `CRON_SECRET`
   - All other required variables

**Important**: 
- Mark `STRIPE_SECRET_KEY` as **Secret**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` can be public
- Add variables for all environments (Production, Preview, Development)

---

## Testing the Integration

### Test Mode Features

When using test API keys:
- ✅ No real charges are made
- ✅ Use test card numbers
- ✅ Simulate payment scenarios
- ✅ Test Connect onboarding

### Test Card Numbers

Use these test cards to simulate payments:

#### Successful Payments
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

#### 3D Secure Authentication
- **Requires auth**: `4000 0025 0000 3155`

#### Failed Payments
- **Insufficient funds**: `4000 0000 0000 9995`
- **Card declined**: `4000 0000 0000 0002`

**For all test cards:**
- Use any future expiration date (e.g., `12/34`)
- Use any 3-digit CVC (e.g., `123`)
- Use any 5-digit ZIP (e.g., `12345`)

### Testing Stripe Connect

#### Test as a Server Owner

1. Create a test account on your platform
2. Go to Settings → Payout Settings
3. Select a country (e.g., United States)
4. Click "Connect Stripe"
5. Complete the test onboarding flow

**Stripe Test Mode Tips:**
- Fill in test data (names, addresses, etc.)
- Use test bank accounts provided by Stripe
- Skip verification steps in test mode

#### Test Onboarding Accounts

Stripe provides these test accounts for Connect:

- **Email**: Any email ending in `@example.com`
- **Phone**: Any valid format (e.g., `555-555-5555`)
- **SSN/Tax ID**: `000000000` (US) or equivalent for other countries
- **Bank**: Stripe provides test routing/account numbers

### Testing Payments

1. **Add a payment method** using test cards
2. **Create a pledge** to a test server
3. **Wait for cron job** or manually trigger `/api/cron/process-withdrawals`
4. **Check Stripe Dashboard** → Payments to see test transactions

### Verifying Everything Works

✅ **Checklist:**

- [ ] Users can save payment methods (cards)
- [ ] Server owners can connect Stripe (onboarding works)
- [ ] Payment methods are saved correctly in database
- [ ] Stripe Connect accounts are created
- [ ] Test charges succeed
- [ ] Transfers to Connect accounts work
- [ ] Webhooks are received (if configured)
- [ ] Email notifications send correctly

---

## Going Live

### Step 1: Activate Your Stripe Account

Before going live, complete these in Stripe Dashboard:

1. **Business Details**
   - Legal business name
   - Business type
   - Industry (select "Software" or "Platforms")
   - Website URL

2. **Tax Information**
   - Tax ID (EIN, SSN, or equivalent)
   - Business structure

3. **Bank Account**
   - Account for receiving platform fees
   - Verify bank account (Stripe will make micro-deposits)

### Step 2: Request Platform Approval

For Stripe Connect platforms, you need approval:

1. Go to **Settings** → **Connect** in Stripe Dashboard
2. Click **Request Platform Approval**
3. Fill out the form:
   - Platform description
   - Expected volume
   - Business model
   - How you'll use Connect

**Approval time**: Usually 1-3 business days

### Step 3: Switch to Live Keys

Once approved:

1. In Stripe Dashboard, toggle to **Live mode** (top right)
2. Go to **Developers** → **API keys**
3. Copy your **live keys**:
   - `pk_live_...`
   - `sk_live_...`

### Step 4: Update Production Environment Variables

In Vercel (or your hosting platform):

1. Go to project settings
2. Update environment variables for **Production**:
   ```env
   STRIPE_SECRET_KEY="sk_live_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   ```
3. **Redeploy** your application

### Step 5: Configure Webhooks (Optional but Recommended)

Webhooks allow you to receive real-time notifications:

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
   - `payout.paid`
5. Copy the **Signing secret** (`whsec_...`)
6. Add to environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

### Step 6: Test in Production

Before announcing:

1. Create a real account (your personal account)
2. Add a real payment method (small amount)
3. Make a real pledge
4. Connect Stripe as a server owner
5. Verify the entire flow works
6. Check that money arrives correctly

---

## Understanding Platform Fees

### How Money Flows

```
Pledger's Card
    ↓ (Payment collected)
Stripe Payment Intent ($10.00)
    ↓ (minus Stripe fee: ~$0.30 + 2.9%)
Platform receives ($9.67)
    ↓ (minus platform fee: 2%)
Transfer to Server Owner ($9.47)
    ↓ (automatic payout)
Server Owner's Bank Account
```

### Fee Breakdown Example

**$10 pledge:**
- Pledger pays: **$10.00**
- Stripe processing fee: **$0.59** (2.9% + $0.30)
- Amount after Stripe: **$9.41**
- Platform fee (2%): **$0.20**
- Server owner receives: **$9.21**

**You (platform) receive: $0.20 per $10 pledge**

### Your Costs

- **Stripe processing**: 2.9% + $0.30 per charge
- **Stripe transfers**: Free in most cases
- **Stripe Connect**: Free (included in processing fees)
- **Payouts**: Free for most bank accounts

**Net result**: On a $10 pledge, you collect $0.20, Stripe takes $0.59, server owner gets $9.21

---

## Monitoring & Analytics

### Stripe Dashboard

Monitor your platform:

1. **Home**: Overview of charges and transfers
2. **Payments**: All payment intents
3. **Connect**: Connected accounts (server owners)
4. **Transfers**: Money sent to server owners
5. **Payouts**: Your platform fees being paid out

### Key Metrics to Watch

- 💰 Total volume processed
- 📊 Success rate of payments
- 🏦 Number of connected accounts
- 💳 Failed payment rate
- 📈 Growth trends

### Alerts

Set up email alerts in Stripe:

1. Go to **Settings** → **Notifications**
2. Enable alerts for:
   - Failed payments
   - Disputed charges
   - Connect account issues
   - High-value transactions

---

## Troubleshooting

### Common Issues

#### "Invalid API Key"
- **Cause**: Wrong key or not set in environment
- **Fix**: Verify `STRIPE_SECRET_KEY` is correct in `.env.local`

#### "Publishable key not found"
- **Cause**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` not set
- **Fix**: Add to environment variables with `NEXT_PUBLIC_` prefix

#### "Account already exists"
- **Cause**: User already has Stripe account
- **Fix**: Check database for existing `stripeAccountId`

#### "Country not supported"
- **Cause**: Selected country not available for Connect
- **Fix**: Choose from supported countries list

#### "Transfer failed"
- **Cause**: Connected account not verified
- **Fix**: Server owner needs to complete onboarding

#### Payments not processing
- **Cause**: Payment method not saved with `off_session` flag
- **Fix**: Use Setup Intent (already implemented)

### Getting Help

#### Stripe Support
- 📧 Email: support@stripe.com
- 💬 Chat: Available in Dashboard
- 📚 Docs: https://stripe.com/docs

#### Community Pledges Support
- 📧 Email: support@communitypledges.com
- 💬 Discord: Join community server

---

## Security Best Practices

### Protecting API Keys

- ✅ **Never commit** keys to git
- ✅ **Use environment variables** only
- ✅ **Rotate keys** if compromised
- ✅ **Different keys** for dev/prod
- ❌ **Never share** secret keys
- ❌ **Don't hardcode** keys in code

### Webhook Security

- ✅ **Verify signatures** using webhook secret
- ✅ **Use HTTPS** only
- ✅ **Validate payload** before processing
- ❌ **Don't trust** raw payload without verification

### Database Security

- ✅ **Store tokens**, not full card details
- ✅ **Encrypt** sensitive data
- ✅ **Limit access** to Stripe customer IDs
- ❌ **Never store** raw card numbers

---

## Resources

### Official Documentation
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Setup Intents Guide](https://stripe.com/docs/payments/setup-intents)
- [Testing Guide](https://stripe.com/docs/testing)

### Useful Links
- [Stripe Dashboard](https://dashboard.stripe.com)
- [API Reference](https://stripe.com/docs/api)
- [Connect Best Practices](https://stripe.com/docs/connect/best-practices)

### Community
- [Stripe Dev Community](https://dev.to/stripe)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments)

---

**You're now ready to process payments and payouts with Stripe!** 🎉

If you encounter any issues, refer to this guide or contact support.

---

*Last updated: October 2025*

