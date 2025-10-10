/**
 * Application Constants
 */

// Pledge limits
export const MIN_PLEDGE = 2 // Minimum pledge amount in USD
export const MAX_PLEDGE = 100 // Maximum pledge amount in USD

// Platform fee (2%)
export const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE || '0.02')

// Stripe fee calculation (2.9% + $0.30)
export const STRIPE_FEE_PERCENTAGE = 0.029
export const STRIPE_FEE_FIXED = 0.30

/**
 * Calculate Stripe processing fee
 */
export function calculateStripeFee(amount: number): number {
  return Math.round((amount * STRIPE_FEE_PERCENTAGE + STRIPE_FEE_FIXED) * 100) / 100
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE * 100) / 100
}

