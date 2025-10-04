# Email Setup Guide for Community Pledges

## Option 1: Google Workspace (Recommended)

### Setup Steps:
1. **Sign up for Google Workspace** (starts at $6/user/month)
2. **Verify your domain** `communitypledges.com`
3. **Create email addresses** like `noreply@communitypledges.com`

### Environment Variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@communitypledges.com
SMTP_PASS=your-app-password
```

### Benefits:
- ✅ Professional email addresses
- ✅ Same reliable Gmail infrastructure
- ✅ Easy setup and management
- ✅ Good deliverability

---

## Option 2: SendGrid (Developer-Friendly)

### Setup Steps:
1. **Sign up for SendGrid** (free tier: 100 emails/day)
2. **Verify your domain** `communitypledges.com`
3. **Create API key** for SMTP

### Environment Variables:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Benefits:
- ✅ Free tier available
- ✅ Excellent for transactional emails
- ✅ Great deliverability
- ✅ Detailed analytics

---

## Option 3: Mailgun (Developer-Focused)

### Setup Steps:
1. **Sign up for Mailgun** (free tier: 5,000 emails/month)
2. **Add your domain** `communitypledges.com`
3. **Get SMTP credentials**

### Environment Variables:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mg.communitypledges.com
SMTP_PASS=your-mailgun-password
```

### Benefits:
- ✅ Generous free tier
- ✅ Developer-friendly API
- ✅ Good deliverability
- ✅ Easy domain setup

---

## Option 4: Amazon SES (Cost-Effective)

### Setup Steps:
1. **Sign up for AWS SES** (free tier: 62,000 emails/month)
2. **Verify your domain** `communitypledges.com`
3. **Get SMTP credentials**

### Environment Variables:
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### Benefits:
- ✅ Very cost-effective
- ✅ High volume capacity
- ✅ AWS integration
- ✅ Good deliverability

---

## Quick Setup Recommendation

For **Community Pledges**, I recommend **SendGrid** because:

1. **Free tier** (100 emails/day) is perfect for starting
2. **Easy domain verification**
3. **Excellent deliverability** for transactional emails
4. **Simple SMTP setup**
5. **Professional email addresses** like `noreply@communitypledges.com`

### SendGrid Quick Setup:

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Go to Settings → Sender Authentication
4. Add your domain `communitypledges.com`
5. Follow DNS verification steps
6. Create API key in Settings → API Keys
7. Use these environment variables:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Email Addresses You Can Create:
- `noreply@communitypledges.com` - For system emails
- `support@communitypledges.com` - For support emails
- `admin@communitypledges.com` - For admin notifications

---

## Testing Your Setup

Once you've configured your email provider, you can test it by:

1. **Creating a new account** - Should receive confirmation email
2. **Requesting password reset** - Should receive reset email
3. **Making a pledge** - Should receive payment confirmation email

The email system will automatically use your configured SMTP settings and send emails from your domain!
