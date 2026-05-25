import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

export const STRIPE_CONNECT_REFRESH_URL = `${process.env.NEXTAUTH_URL}/dashboard/stripe/refresh`
export const STRIPE_CONNECT_RETURN_URL = `${process.env.NEXTAUTH_URL}/dashboard/stripe/return`
