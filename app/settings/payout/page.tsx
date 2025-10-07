'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Loader2, Trash2, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface UserSettings {
  stripePayoutAccountId: string | null
  stripePayoutConnected: boolean
  stripePayoutConnectedAt: string | null
  stripePayoutRequirements: string | null
}

export default function PayoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [stripePayoutStatus, setStripePayoutStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingStripeAccount, setIsCreatingStripeAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'payout' | null>(null)

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

  // Load Stripe payout status
  useEffect(() => {
    const loadStripePayoutStatus = async () => {
      if (userSettings?.stripePayoutAccountId) {
        try {
          const response = await fetch('/api/stripe/express/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              accountId: userSettings.stripePayoutAccountId
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            setStripePayoutStatus(data)
          }
        } catch (error) {
          console.error('Error loading Stripe payout status:', error)
        }
      }
    }

    loadStripePayoutStatus()
  }, [userSettings?.stripePayoutAccountId])

  // Handle Stripe Express account creation
  const handleCreateStripeAccount = async () => {
    setIsCreatingStripeAccount(true)
    try {
      const response = await fetch('/api/stripe/express/create', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Reload user settings
        await fetchUserSettings()
      } else {
        alert(data.error || 'Failed to create Stripe Express account')
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error)
      alert('Failed to create Stripe Express account')
    } finally {
      setIsCreatingStripeAccount(false)
    }
  }

  // Handle Stripe Express onboarding
  const handleStripeOnboarding = async () => {
    if (!userSettings?.stripePayoutAccountId) {
      alert('Please create a Stripe Express account first')
      return
    }

    try {
      const response = await fetch('/api/stripe/express/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: userSettings.stripePayoutAccountId
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.url) {
        // Open Stripe onboarding in new window
        window.open(data.url, '_blank')
      } else {
        alert(data.error || 'Failed to start Stripe onboarding')
      }
    } catch (error) {
      console.error('Error starting Stripe onboarding:', error)
      alert('Failed to start Stripe onboarding')
    }
  }

  // Handle Stripe payout removal
  const handleStripePayoutRemove = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stripePayoutAccountId: null,
          stripePayoutConnected: false,
          stripePayoutConnectedAt: null,
          stripePayoutRequirements: null
        })
      })

      if (response.ok) {
        setUserSettings(prev => prev ? {
          ...prev,
          stripePayoutAccountId: null,
          stripePayoutConnected: false,
          stripePayoutConnectedAt: null,
          stripePayoutRequirements: null
        } : null)
        setShowDeleteModal(false)
        setDeleteType(null)
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to remove Stripe payout account')
      }
    } catch (error) {
      console.error('Error removing Stripe payout:', error)
      alert('Failed to remove Stripe payout account')
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
          <h1 className="text-3xl font-bold text-white">Payout Settings</h1>
          <p className="text-gray-400 mt-2">
            Set up your payout account to receive donations from server pledges
          </p>
        </div>

        {/* Stripe Payout Method */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">Stripe Express Payout</h2>
            </div>
            <div className="flex items-center space-x-2">
              {userSettings?.stripePayoutAccountId ? (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stripePayoutStatus?.connected ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {stripePayoutStatus?.connected ? 'Connected' : 'Setup Required'}
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500">
                  Not Set Up
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {userSettings?.stripePayoutAccountId ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Account ID: {userSettings.stripePayoutAccountId.slice(0, 20)}...
                      </p>
                      {stripePayoutStatus && (
                        <p className="text-gray-400 text-sm">
                          Status: {stripePayoutStatus.connected ? 'Active' : 'Pending Setup'}
                        </p>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      stripePayoutStatus?.connected ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!stripePayoutStatus?.connected && (
                    <button
                      onClick={handleStripeOnboarding}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Complete Setup
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDeleteType('payout')
                      setShowDeleteModal(true)
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                    title="Remove Payout Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">No payout account configured</p>
                <button
                  onClick={handleCreateStripeAccount}
                  disabled={isCreatingStripeAccount}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingStripeAccount ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stripe Express Benefits */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-400 mb-4">Why Stripe Express?</h3>
          <ul className="text-blue-300 text-sm space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              Simple setup for individuals (no business requirements)
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              Direct bank account transfers
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              Lower fees than traditional business accounts
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              Secure and reliable payment processing
            </li>
          </ul>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Remove Payout Account
              </h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to remove this payout account? You won't be able to receive donations until you set up a new one.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleStripePayoutRemove}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteType(null)
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
