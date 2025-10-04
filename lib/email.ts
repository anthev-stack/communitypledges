import nodemailer from 'nodemailer'

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Email addresses for different purposes
const EMAIL_ADDRESSES = {
  noreply: process.env.EMAIL_NOREPLY || process.env.SMTP_USER || 'noreply@communitypledges.com',
  support: process.env.EMAIL_SUPPORT || 'support@communitypledges.com',
  admin: process.env.EMAIL_ADMIN || 'admin@communitypledges.com',
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface PledgePaymentEmailData {
  userName: string
  userEmail: string
  serverName: string
  pledgeAmount: number
  actualAmount: number
  totalPledgers: number
  currency: string
}

export interface FailedPaymentEmailData {
  userName: string
  userEmail: string
  serverName: string
  pledgeAmount: number
  attemptNumber: number
  currency: string
  supportUrl: string
}

export interface SuspensionEmailData {
  userName: string
  userEmail: string
  supportUrl: string
}

export interface AccountConfirmationEmailData {
  userName: string
  userEmail: string
  confirmationUrl: string
}

export interface PasswordResetEmailData {
  userName: string
  userEmail: string
  resetUrl: string
}

// Email templates
export function createPledgePaymentTemplate(data: PledgePaymentEmailData): EmailTemplate {
  const { userName, serverName, pledgeAmount, actualAmount, totalPledgers, currency } = data
  
  const subject = `Your pledge payment for ${serverName} - ${currency}${actualAmount.toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pledge Payment Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 24px; font-weight: bold; color: #10b981; }
        .server-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Pledge Payment Successful!</h1>
        <p>Thank you for supporting your community server</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <p>Your pledge commitment towards <strong>${serverName}</strong> was <span class="amount">${currency}${actualAmount.toFixed(2)}</span> this month!</p>
        
        <div class="server-info">
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Server:</strong> ${serverName}</li>
            <li><strong>Your Pledge:</strong> ${currency}${pledgeAmount.toFixed(2)}</li>
            <li><strong>Amount Charged:</strong> ${currency}${actualAmount.toFixed(2)}</li>
            <li><strong>Total Pledgers:</strong> ${totalPledgers} people</li>
            ${actualAmount < pledgeAmount ? `<li><strong>Savings:</strong> ${currency}${(pledgeAmount - actualAmount).toFixed(2)} (cost optimization!)</li>` : ''}
          </ul>
        </div>
        
        <p>With ${totalPledgers} other pledgers, you're helping keep this community server alive and affordable for everyone!</p>
        
        <p>You can view your payment history and manage your pledges in your <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Dashboard</a></p>
        
        <div class="footer">
          <p>Thank you for being part of the Community Pledges community!</p>
          <p>If you have any questions, please contact us through our <a href="${process.env.NEXTAUTH_URL}/tickets">Support System</a></p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Pledge Payment Confirmation
    
    Hello ${userName}!
    
    Your pledge commitment towards ${serverName} was ${currency}${actualAmount.toFixed(2)} this month!
    
    Payment Details:
    - Server: ${serverName}
    - Your Pledge: ${currency}${pledgeAmount.toFixed(2)}
    - Amount Charged: ${currency}${actualAmount.toFixed(2)}
    - Total Pledgers: ${totalPledgers} people
    ${actualAmount < pledgeAmount ? `- Savings: ${currency}${(pledgeAmount - actualAmount).toFixed(2)} (cost optimization!)` : ''}
    
    With ${totalPledgers} other pledgers, you're helping keep this community server alive and affordable for everyone!
    
    View your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
    Support: ${process.env.NEXTAUTH_URL}/tickets
  `
  
  return { subject, html, text }
}

export function createFailedPaymentTemplate(data: FailedPaymentEmailData): EmailTemplate {
  const { userName, serverName, pledgeAmount, attemptNumber, currency, supportUrl } = data
  
  const subject = `Payment Failed - ${serverName} Pledge (Attempt ${attemptNumber}/3)`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .attempt { font-size: 18px; font-weight: bold; color: #ef4444; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Payment Failed</h1>
        <p>Attempt ${attemptNumber} of 3</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <p>We were unable to process your pledge payment for <strong>${serverName}</strong>.</p>
        
        <div class="warning">
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Server:</strong> ${serverName}</li>
            <li><strong>Amount:</strong> ${currency}${pledgeAmount.toFixed(2)}</li>
            <li><strong>Attempt:</strong> <span class="attempt">${attemptNumber} of 3</span></li>
          </ul>
        </div>
        
        ${attemptNumber < 3 ? `
          <p><strong>What happens next?</strong></p>
          <p>We'll automatically retry your payment. Please ensure your payment method has sufficient funds and is up to date.</p>
          <p>If this continues, your account may be suspended after 3 failed attempts.</p>
        ` : `
          <p><strong>Account Suspension Notice</strong></p>
          <p>This was your 3rd failed payment attempt. Your account has been suspended to prevent further failed charges.</p>
          <p>To reactivate your account, please contact our support team to update your payment information.</p>
        `}
        
        <p>You can update your payment method in your <a href="${process.env.NEXTAUTH_URL}/settings" class="button">Settings</a></p>
        
        <p>If you need assistance, please contact us through our <a href="${supportUrl}" class="button">Support System</a></p>
        
        <div class="footer">
          <p>Thank you for being part of the Community Pledges community!</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Payment Failed - Attempt ${attemptNumber} of 3
    
    Hello ${userName}!
    
    We were unable to process your pledge payment for ${serverName}.
    
    Payment Details:
    - Server: ${serverName}
    - Amount: ${currency}${pledgeAmount.toFixed(2)}
    - Attempt: ${attemptNumber} of 3
    
    ${attemptNumber < 3 ? 
      `What happens next?
      We'll automatically retry your payment. Please ensure your payment method has sufficient funds and is up to date.
      If this continues, your account may be suspended after 3 failed attempts.` :
      `Account Suspension Notice
      This was your 3rd failed payment attempt. Your account has been suspended to prevent further failed charges.
      To reactivate your account, please contact our support team to update your payment information.`
    }
    
    Update payment method: ${process.env.NEXTAUTH_URL}/settings
    Support: ${supportUrl}
  `
  
  return { subject, html, text }
}

export function createSuspensionTemplate(data: SuspensionEmailData): EmailTemplate {
  const { userName, supportUrl } = data
  
  const subject = 'Account Suspended - Payment Issues'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Suspended</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .suspension { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚫 Account Suspended</h1>
        <p>Payment Issues Detected</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <div class="suspension">
          <h3>Account Suspension Notice</h3>
          <p>Your account has been suspended due to multiple failed payment attempts (3 failed attempts).</p>
          <p>This suspension prevents further failed charges and protects your payment method.</p>
        </div>
        
        <p><strong>How to reactivate your account:</strong></p>
        <ol>
          <li>Contact our support team through the support ticket system</li>
          <li>Update your payment information</li>
          <li>Verify your payment method is working</li>
          <li>We'll reactivate your account once payment issues are resolved</li>
        </ol>
        
        <p>Please contact us through our <a href="${supportUrl}" class="button">Support System</a> to resolve this issue.</p>
        
        <div class="footer">
          <p>We're here to help you get back to supporting your community servers!</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Account Suspended - Payment Issues
    
    Hello ${userName}!
    
    Your account has been suspended due to multiple failed payment attempts (3 failed attempts).
    This suspension prevents further failed charges and protects your payment method.
    
    How to reactivate your account:
    1. Contact our support team through the support ticket system
    2. Update your payment information
    3. Verify your payment method is working
    4. We'll reactivate your account once payment issues are resolved
    
    Support: ${supportUrl}
    
    We're here to help you get back to supporting your community servers!
  `
  
  return { subject, html, text }
}

export function createAccountConfirmationTemplate(data: AccountConfirmationEmailData): EmailTemplate {
  const { userName, confirmationUrl } = data
  
  const subject = 'Welcome to Community Pledges - Confirm Your Account'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome { font-size: 24px; font-weight: bold; color: #10b981; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome to Community Pledges!</h1>
        <p>Let's get your account confirmed</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <div class="welcome">Welcome to Community Pledges!</div>
        
        <p>Thank you for creating an account with us. We're excited to have you join our community of server owners and pledgers!</p>
        
        <div class="info">
          <h3>What's Next?</h3>
          <p>To complete your account setup and start using Community Pledges, please confirm your email address by clicking the button below:</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${confirmationUrl}" class="button">Confirm My Account</a>
        </div>
        
        <p><strong>What you can do after confirmation:</strong></p>
        <ul>
          <li>Browse and pledge to community servers</li>
          <li>Create your own server and start receiving pledges</li>
          <li>Manage your payment methods and settings</li>
          <li>Join our Discord community for support</li>
        </ul>
        
        <p><strong>Need help?</strong> If you have any questions, feel free to contact us through our <a href="${process.env.NEXTAUTH_URL}/tickets">Support System</a>.</p>
        
        <div class="footer">
          <p>This confirmation link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Welcome to Community Pledges!
    
    Hello ${userName}!
    
    Thank you for creating an account with us. We're excited to have you join our community of server owners and pledgers!
    
    To complete your account setup and start using Community Pledges, please confirm your email address by visiting this link:
    
    ${confirmationUrl}
    
    What you can do after confirmation:
    - Browse and pledge to community servers
    - Create your own server and start receiving pledges
    - Manage your payment methods and settings
    - Join our Discord community for support
    
    Need help? If you have any questions, feel free to contact us through our Support System: ${process.env.NEXTAUTH_URL}/tickets
    
    This confirmation link will expire in 24 hours for security reasons.
    If you didn't create this account, you can safely ignore this email.
  `
  
  return { subject, html, text }
}

export function createPasswordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
  const { userName, resetUrl } = data
  
  const subject = 'Reset Your Community Pledges Password'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔒 Password Reset Request</h1>
        <p>Secure your account</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <p>We received a request to reset your password for your Community Pledges account.</p>
        
        <div class="warning">
          <h3>Security Notice</h3>
          <p>If you requested this password reset, click the button below to create a new password. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>
        
        <p><strong>Security Tips:</strong></p>
        <ul>
          <li>Use a strong, unique password</li>
          <li>Don't share your password with anyone</li>
          <li>Enable two-factor authentication if available</li>
          <li>Log out from shared devices</li>
        </ul>
        
        <p><strong>Need help?</strong> If you're having trouble or didn't request this reset, contact us through our <a href="${process.env.NEXTAUTH_URL}/tickets">Support System</a>.</p>
        
        <div class="footer">
          <p>This password reset link will expire in 1 hour for security reasons.</p>
          <p>For your security, this link can only be used once.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Password Reset Request
    
    Hello ${userName}!
    
    We received a request to reset your password for your Community Pledges account.
    
    If you requested this password reset, visit this link to create a new password:
    
    ${resetUrl}
    
    If you didn't request this, please ignore this email and your password will remain unchanged.
    
    Security Tips:
    - Use a strong, unique password
    - Don't share your password with anyone
    - Enable two-factor authentication if available
    - Log out from shared devices
    
    Need help? If you're having trouble or didn't request this reset, contact us through our Support System: ${process.env.NEXTAUTH_URL}/tickets
    
    This password reset link will expire in 1 hour for security reasons.
    For your security, this link can only be used once.
  `
  
  return { subject, html, text }
}

// Email sending functions
export async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email service not configured - skipping email send')
      return false
    }

    const mailOptions = {
      from: `"Community Pledges" <${EMAIL_ADDRESSES.noreply}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${to}:`, result.messageId)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendPledgePaymentEmail(data: PledgePaymentEmailData): Promise<boolean> {
  const template = createPledgePaymentTemplate(data)
  return await sendEmail(data.userEmail, template)
}

export async function sendFailedPaymentEmail(data: FailedPaymentEmailData): Promise<boolean> {
  const template = createFailedPaymentTemplate(data)
  return await sendEmail(data.userEmail, template)
}

export async function sendSuspensionEmail(data: SuspensionEmailData): Promise<boolean> {
  const template = createSuspensionTemplate(data)
  return await sendEmail(data.userEmail, template)
}

export async function sendAccountConfirmationEmail(data: AccountConfirmationEmailData): Promise<boolean> {
  const template = createAccountConfirmationTemplate(data)
  return await sendEmail(data.userEmail, template)
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  const template = createPasswordResetTemplate(data)
  return await sendEmail(data.userEmail, template)
}
