# Stripe Payment & Payout System

Complete Stripe integration for Community Pledges with smart optimization, Connect Express payouts, and automatic processing.

## 🎯 Overview

This implementation provides:

- 💳 **Payment Collection** - Users save cards and pledge to servers
- 🏦 **Automatic Payouts** - Server owners receive funds via Stripe Connect
- 🧮 **Smart Optimization** - Reduces payments when servers are overfunded
- 🌍 **45+ Countries** - Global support through Stripe Connect Express
- 🔄 **Automated Processing** - Monthly cron job handles everything
- 🔒 **Secure & Compliant** - PCI-DSS compliance through Stripe

## 📚 Documentation

This system includes comprehensive documentation:

| Guide | Audience | Purpose |
|-------|----------|---------|
| `QUICK_START_STRIPE.md` | Developers | Get up and running in 15 minutes |
| `PAYMENT_SETUP_GUIDE.md` | Users/Pledgers | How to add payment methods and pledge |
| `PAYOUT_SETUP_GUIDE.md` | Server Owners | How to connect Stripe and receive payouts |
| `STRIPE_SETUP.md` | Administrators | Complete setup, testing, and going live |
| `STRIPE_IMPLEMENTATION_SUMMARY.md` | Developers | Technical implementation details |

## 🚀 Quick Start

```bash
# 1. Update database
npx prisma generate
npx prisma db push
node scripts/migrate-stripe-schema.js

# 2. Configure environment variables
cp .env.example .env.local
# Add your Stripe keys to .env.local

# 3. Start development
npm run dev

# 4. Test the system
# - Add payment method as user
# - Connect Stripe as server owner
# - Create and process pledges
```

See `QUICK_START_STRIPE.md` for detailed steps.

## 🏗️ Architecture

### Payment Flow (Pledgers)

```
User → Setup Intent → Save Card → Pledge → Monthly Charge → Server Owner
```

1. User creates Setup Intent to save card
2. Card saved with `off_session` capability
3. User pledges amount to server
4. On withdrawal day, automatic charge
5. Smart optimization may reduce amount
6. Funds transferred to server owner

### Payout Flow (Server Owners)

```
Select Country → Connect Stripe → Complete Onboarding → Receive Transfers → Bank Payout
```

1. Owner selects country (immutable)
2. Creates Stripe Connect Express account
3. Completes ID verification and bank setup
4. Receives transfers from platform
5. Automatic daily payouts to bank

### Smart Optimization Algorithm

When total pledges exceed server cost:

```
If pledges total $100 but server costs $50:
→ Everyone pays 50% of their pledge
→ Server owner receives exactly $50
→ Pledgers save money! 💰
```

## 📂 File Structure

### New Files

```
lib/
  ├── optimization.ts        # Smart pledge optimization algorithm
  ├── countries.ts           # Stripe Connect supported countries
  └── constants.ts           # Platform constants and fee calculations

app/api/
  ├── stripe/
  │   ├── setup-intent/      # Create Setup Intent for payment methods
  │   ├── update-payment-method/  # Save payment method after Setup
  │   └── connect/
  │       ├── onboard/       # Stripe Connect onboarding (updated)
  │       └── status/        # Check Connect status (updated)
  └── user/
      └── country/           # Select/update country for Connect

scripts/
  └── migrate-stripe-schema.js  # Database migration helper

Documentation:
  ├── PAYMENT_SETUP_GUIDE.md
  ├── PAYOUT_SETUP_GUIDE.md
  ├── STRIPE_SETUP.md
  ├── STRIPE_IMPLEMENTATION_SUMMARY.md
  ├── QUICK_START_STRIPE.md
  └── README_STRIPE.md (this file)
```

### Updated Files

```
prisma/schema.prisma          # Added Stripe Connect fields, pledge status enum
lib/stripe.ts                 # Added Connect URLs, updated fee percentage
lib/withdrawal.ts             # Integrated optimization, updated for Connect
app/api/user/settings/payment/ # Updated to use Setup Intent
vercel.json                   # Added cron job configuration
```

## 🔑 Key Features

### 1. Off-Session Payments

**Critical for automatic monthly charges:**

```typescript
// Setup Intent (when saving card)
const setupIntent = await stripe.setupIntents.create({
  customer: customerId,
  payment_method_types: ['card'],
  usage: 'off_session',  // ← This is critical!
})

// Payment Intent (when charging)
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: 'usd',
  customer: customerId,
  payment_method: paymentMethodId,
  off_session: true,  // ← This allows charging without user present
  confirm: true,
})
```

### 2. Stripe Connect Express

**Individual accounts, no business required:**

```typescript
const account = await stripe.accounts.create({
  type: "express",
  country: user.country,
  business_type: "individual",  // ← No business needed!
  business_profile: {
    mcc: "8398",  // Charitable organizations
    product_description: "Receiving donations for game server hosting",
  },
  settings: {
    payouts: {
      schedule: { interval: "daily" },  // ← Automatic daily payouts
    },
  },
})
```

### 3. Smart Optimization

**Saves money for pledgers:**

```typescript
export function calculateOptimizedCosts(
  pledgeAmounts: number[],
  serverCost: number
): OptimizationResult {
  const totalPledged = pledgeAmounts.reduce((sum, amount) => sum + amount, 0)
  
  if (totalPledged >= serverCost) {
    // Overfunded! Reduce payments proportionally
    const ratio = serverCost / totalPledged
    return {
      optimizedAmounts: pledgeAmounts.map(amount => amount * ratio),
      savings: totalPledged - serverCost,
      isAcceptingPledges: false,
    }
  }
  
  // Underfunded, everyone pays full amount
  return {
    optimizedAmounts: pledgeAmounts,
    savings: 0,
    isAcceptingPledges: true,
  }
}
```

### 4. Automatic Processing

**Monthly cron job:**

```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-withdrawals",
    "schedule": "0 12 * * *"  // Daily at noon UTC
  }]
}
```

The cron job:
1. Finds servers with withdrawal day matching today
2. Calculates optimized amounts for each pledge
3. Charges pledgers' saved payment methods
4. Transfers to server owners' Connect accounts
5. Handles failures and suspensions
6. Sends email notifications

## 💰 Fee Structure

### Platform Fee: 2%

```
$10 pledge:
  ├─ Stripe processing: ~$0.59 (2.9% + $0.30)
  ├─ Platform fee: $0.20 (2% of net)
  └─ Server owner receives: ~$9.21

The platform receives $0.20 per $10 pledge.
```

### Configuration

Change platform fee in `.env`:

```env
PLATFORM_FEE="0.02"  # 2% (or any decimal, e.g., 0.03 for 3%)
```

## 🧪 Testing

### Test Cards (Stripe Test Mode)

| Card Number | Type | Result |
|-------------|------|--------|
| 4242 4242 4242 4242 | Visa | Success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 4000 0025 0000 3155 | Visa | Requires 3D Secure |
| 4000 0000 0000 9995 | Visa | Insufficient funds |
| 4000 0000 0000 0002 | Visa | Declined |

**For all cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Test Stripe Connect

Use test data:
- Email: `test@example.com`
- Phone: `555-555-5555`
- SSN (US): `000000000`
- Bank: Use Stripe's test account numbers

## 🌍 Supported Countries

45+ countries supported including:

- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇨🇦 Canada
- 🇦🇺 Australia
- 🇪🇺 27 EU countries
- 🇯🇵 Japan
- 🇸🇬 Singapore
- 🇮🇳 India
- And more...

See `lib/countries.ts` for full list.

## 📊 Database Schema

### Key Fields Added

**User model:**
```prisma
model User {
  // Stripe Connect (receiving payouts)
  stripeAccountId          String?  @unique
  stripeAccountStatus      String?  // 'pending', 'active', 'restricted'
  stripeOnboardingComplete Boolean  @default(false)
  country                  String?  // ISO country code
  
  // Stripe Customer (making payments)
  stripeCustomerId      String?  @unique
  stripePaymentMethodId String?
  hasPaymentMethod      Boolean  @default(false)
  
  // Payment failures
  failedPayments       Int      @default(0)
  lastFailedPayment    DateTime?
}
```

**Pledge model:**
```prisma
model Pledge {
  amount          Float         // User's pledge
  optimizedAmount Float?        // Actual payment after optimization
  status          PledgeStatus  @default(ACTIVE)
}

enum PledgeStatus {
  ACTIVE
  CANCELLED
  SUSPENDED
}
```

## 🔒 Security

### Best Practices Implemented

- ✅ Setup Intent for secure card saving
- ✅ Off-session charging capability
- ✅ Stripe tokens only (never raw card numbers)
- ✅ Environment variables for API keys
- ✅ HTTPS required for webhooks
- ✅ Cron job authentication with secret
- ✅ Country validation before Connect
- ✅ Onboarding verification before transfers

## 📈 Monitoring

### Stripe Dashboard

Monitor these sections:

1. **Payments** - All payment intents from pledgers
2. **Connect** - Connected accounts (server owners)
3. **Transfers** - Money sent to owners
4. **Payouts** - Platform fees being paid out
5. **Logs** - API calls and errors

### Database Queries

```sql
-- Active pledges
SELECT COUNT(*) FROM "Pledge" WHERE status = 'ACTIVE';

-- Users with failed payments
SELECT * FROM "User" WHERE "failedPayments" > 0;

-- Recent withdrawals
SELECT * FROM "Withdrawal" ORDER BY "createdAt" DESC LIMIT 10;

-- Incomplete onboarding
SELECT * FROM "User" 
WHERE "stripeAccountId" IS NOT NULL 
AND "stripeOnboardingComplete" = false;
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check `STRIPE_SECRET_KEY` in environment |
| "Cannot charge payment method" | Ensure card saved with Setup Intent |
| "Country not supported" | Select from supported countries list |
| "Transfer failed" | Server owner must complete onboarding |
| Cron not running | Verify `vercel.json` and `CRON_SECRET` |

See individual guide files for detailed troubleshooting.

## 🚀 Deployment

### Production Checklist

- [ ] Complete Stripe profile verification
- [ ] Request Connect platform approval (1-3 days)
- [ ] Switch to live Stripe keys
- [ ] Update production environment variables
- [ ] Test with small real payments
- [ ] Monitor Stripe Dashboard
- [ ] Set up email notifications
- [ ] Configure webhook endpoints (optional)

See `STRIPE_SETUP.md` for detailed deployment steps.

## 📞 Support

### For Users
- 📖 Read: `PAYMENT_SETUP_GUIDE.md`
- 📧 Email: support@communitypledges.com

### For Server Owners
- 📖 Read: `PAYOUT_SETUP_GUIDE.md`
- 📧 Email: support@communitypledges.com

### For Developers
- 📖 Read: `STRIPE_IMPLEMENTATION_SUMMARY.md`
- 🌐 Stripe Docs: https://stripe.com/docs
- 💬 Stripe Support: support@stripe.com

## 🎯 Next Steps

### Optional Enhancements

1. **Webhooks** - Real-time event handling
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`

2. **Analytics Dashboard**
   - Payment success rates
   - Revenue charts
   - Top servers
   - User growth

3. **Refund System**
   - Manual refunds for special cases
   - Partial refunds
   - Dispute handling

4. **Multi-Currency**
   - Accept payments in local currencies
   - Automatic conversion
   - Display in user's currency

5. **Email Templates**
   - Customize payment confirmations
   - Payout notifications
   - Failure alerts

## ✅ Implementation Status

**Status: ✅ COMPLETE**

All core functionality has been implemented and tested:

- ✅ Payment method storage via Setup Intent
- ✅ Stripe Connect onboarding for server owners
- ✅ Smart optimization algorithm
- ✅ Automatic monthly processing
- ✅ Country selection and validation
- ✅ Transfer to Connect accounts
- ✅ Comprehensive documentation
- ✅ Migration scripts
- ✅ Error handling and logging

**Ready for production deployment!**

## 📝 License

This implementation is part of Community Pledges.

## 🙏 Credits

- **Stripe** - Payment processing and Connect platform
- **Prisma** - Database ORM
- **Next.js** - Application framework
- **Vercel** - Hosting and cron jobs

---

**Questions? Issues? Feedback?**

Contact: support@communitypledges.com

---

*Last updated: October 2025*
*Implementation complete and production-ready*

