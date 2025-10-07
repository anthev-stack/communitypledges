'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const paymentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type PaymentForm = z.infer<typeof paymentSchema>

interface UserSettings {
  hasPaymentMethod: boolean
  cardLast4: string | null
  cardBrand: string | null
  cardExpMonth: number | null
  cardExpYear: number | null
  stripePaymentMethodId: string | null
  stripeCustomerId: string | null
}

function PaymentForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema)
  })

  const onSubmit = async (data: PaymentForm) => {
    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: data.name,
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Save payment method to backend
      const response = await fetch('/api/user/settings/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save payment method')
      }

      setSuccess('Payment method added successfully!')
      setTimeout(() => {
        window.location.href = '/settings'
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cardholder Name
        </label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter cardholder name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Details
        </label>
        <div className="p-3 bg-gray-700 border border-gray-600 rounded-md">
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
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Adding Payment Method...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Add Payment Method</span>
          </>
        )}
      </button>
    </form>
  )
}

export default function PaymentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchUserSettings()
  }, [session, router])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setUserSettings(data)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/settings"
            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-white">Payment Methods</h1>
          <p className="text-gray-400 mt-2">
            Manage your payment methods for pledges and server boosts
          </p>
        </div>

        {/* Current Payment Method */}
        {userSettings?.hasPaymentMethod && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Current Payment Method</h2>
            <div className="flex items-center space-x-4">
              <CreditCard className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-white font-medium">
                  {userSettings.cardBrand?.toUpperCase()} •••• {userSettings.cardLast4}
                </p>
                <p className="text-gray-400 text-sm">
                  Expires {userSettings.cardExpMonth?.toString().padStart(2, '0')}/{userSettings.cardExpYear}
                </p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add New Payment Method */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {userSettings?.hasPaymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
          </h2>
          <p className="text-gray-400 mb-6">
            {userSettings?.hasPaymentMethod 
              ? 'Add a new card to replace your current payment method'
              : 'Add a card to make pledges and boost servers'
            }
          </p>

          <Elements stripe={stripePromise}>
            <PaymentForm />
          </Elements>
        </div>
      </div>
    </div>
  )
}
