import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Initialize Stripe with environment variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Stripe publishable key for client-side
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// Stripe Connect URLs
export const STRIPE_CONNECT_REFRESH_URL = `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`
export const STRIPE_CONNECT_RETURN_URL = `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`

// Platform fee percentage (2%)
export const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE || '0.02')

// Calculate platform fee amount
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE * 100) / 100
}

// Calculate amount after platform fee
export function calculateAmountAfterFee(amount: number): number {
  return amount - calculatePlatformFee(amount)
}

// Calculate Stripe processing fee (2.9% + $0.30)
export function calculateStripeFee(amount: number): number {
  return Math.round((amount * 0.029 + 0.30) * 100) / 100
}

// Calculate net amount to server owner
export function calculateNetAmount(amount: number): number {
  return amount - calculatePlatformFee(amount) - calculateStripeFee(amount)
}
