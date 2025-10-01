'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

export default function TestSettingsPage6() {
  const { data: session, status } = useSession()
  const [test, setTest] = useState('Loading...')
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)

  useEffect(() => {
    setTest('Testing Stripe Elements initialization...')
    
    // Test Stripe loading step by step
    const testStripe = async () => {
      try {
        console.log('Step 1: Testing environment variable access')
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        console.log('Publishable key:', publishableKey ? 'Present' : 'Missing')
        
        if (!publishableKey) {
          setStripeError('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing')
          return
        }

        console.log('Step 2: Testing loadStripe function')
        const stripe = await loadStripe(publishableKey)
        console.log('Stripe loaded:', stripe)
        
        if (stripe) {
          setStripeLoaded(true)
          setTest('Stripe loaded successfully!')
        } else {
          setStripeError('Stripe failed to load')
        }
      } catch (error) {
        console.error('Stripe loading error:', error)
        setStripeError('Error loading Stripe: ' + error)
      }
    }

    testStripe()
  }, [])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page 6</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Stripe Debug Info</h2>
        <p className="text-gray-300">Stripe Loaded: {stripeLoaded ? 'Yes' : 'No'}</p>
        {stripeError && <p className="text-red-300">Error: {stripeError}</p>}
        <p className="text-gray-300 text-sm">Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</p>
      </div>

      {stripeLoaded && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Testing Elements Wrapper</h3>
          <Elements stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)}>
            <StripeTestForm />
          </Elements>
        </div>
      )}
    </div>
  )
}

function StripeTestForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    console.log('Form submitted')
    
    if (!stripe || !elements) {
      console.log('Stripe or elements not ready')
      return
    }

    setLoading(true)
    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      console.log('Creating payment method...')
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) {
        console.error('Payment method error:', error)
        alert('Error: ' + error.message)
      } else if (paymentMethod) {
        console.log('Payment method created:', paymentMethod.id)
        alert('Success! Payment method: ' + paymentMethod.id)
      }
    } catch (error) {
      console.error('Form error:', error)
      alert('Error: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Test Payment Method'}
      </button>
    </form>
  )
}
