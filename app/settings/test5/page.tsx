'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'

export default function TestSettingsPage5() {
  const { data: session, status } = useSession()
  const [test, setTest] = useState('Loading...')
  const [stripeTest, setStripeTest] = useState('Not tested yet')

  useEffect(() => {
    setTest('Settings page with direct Stripe load test loaded successfully!')
    
    // Test direct Stripe loading
    try {
      console.log('Testing direct Stripe load...')
      const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      console.log('Stripe loaded:', stripe)
      setStripeTest('Stripe loaded successfully!')
    } catch (error) {
      console.error('Stripe load error:', error)
      setStripeTest('Stripe load failed: ' + error)
    }
  }, [])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page 5</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Direct Stripe Test</h2>
        <p className="text-gray-300">Stripe Test: {stripeTest}</p>
        <p className="text-gray-300 text-sm">Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</p>
      </div>
    </div>
  )
}
