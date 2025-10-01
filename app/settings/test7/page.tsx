'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TestSettingsPage7() {
  const { data: session, status } = useSession()
  const [test, setTest] = useState('Loading...')
  const [stripeTest, setStripeTest] = useState('Not tested yet')

  useEffect(() => {
    setTest('Testing Stripe import without Elements...')
    
    // Test importing Stripe libraries step by step
    const testStripeImports = async () => {
      try {
        console.log('Step 1: Testing basic imports')
        
        // Test importing loadStripe
        console.log('Step 2: Importing loadStripe')
        const { loadStripe } = await import('@stripe/stripe-js')
        console.log('loadStripe imported successfully:', typeof loadStripe)
        
        // Test environment variable
        console.log('Step 3: Checking environment variable')
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        console.log('Publishable key:', publishableKey ? 'Present' : 'Missing')
        
        if (!publishableKey) {
          setStripeTest('Error: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing')
          return
        }

        // Test loadStripe function
        console.log('Step 4: Testing loadStripe function')
        const stripe = await loadStripe(publishableKey)
        console.log('Stripe loaded:', stripe)
        
        if (stripe) {
          setStripeTest('Success: Stripe loaded without Elements wrapper')
        } else {
          setStripeTest('Error: Stripe failed to load')
        }
      } catch (error) {
        console.error('Stripe import error:', error)
        setStripeTest('Error importing Stripe: ' + error)
      }
    }

    testStripeImports()
  }, [])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page 7</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Stripe Import Test</h2>
        <p className="text-gray-300">Result: {stripeTest}</p>
        <p className="text-gray-300 text-sm">Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</p>
      </div>
    </div>
  )
}
