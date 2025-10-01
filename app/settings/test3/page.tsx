'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import StripePaymentForm from '@/components/StripePaymentForm'

export default function TestSettingsPage3() {
  const { data: session, status } = useSession()
  const [test, setTest] = useState('Loading...')

  useEffect(() => {
    setTest('Settings page with Stripe component loaded successfully!')
  }, [])

  const handleStripeSuccess = (paymentMethodId: string) => {
    console.log('Stripe success:', paymentMethodId)
  }

  const handleStripeError = (error: string) => {
    console.log('Stripe error:', error)
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page 3</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Stripe Payment Form Test</h2>
        <StripePaymentForm
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
          isUpdating={false}
        />
      </div>
    </div>
  )
}
