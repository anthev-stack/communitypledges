'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { useForm } from 'react-hook-form'
import { 
  User, 
  CreditCard, 
  Trash2, 
  Edit3, 
  Camera, 
  X,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface UserSettings {
  hasPaymentMethod: boolean
  cardLast4?: string
  cardBrand?: string
  cardExpMonth?: number
  cardExpYear?: number
  stripePaymentMethodId?: string
  // Stripe payout (for receiving money)
  stripePayoutAccountId?: string | null
  stripePayoutConnected?: boolean
  stripePayoutConnectedAt?: string | null
  stripePayoutRequirements?: string | null
  name?: string
  email?: string
  image?: string
  lastUsernameChange?: string | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState('profile')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'payment' | 'payout' | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [stripePayoutStatus, setStripePayoutStatus] = useState<any>(null)
  const [isCreatingStripeAccount, setIsCreatingStripeAccount] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm()

  // Load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/user/settings')
        if (response.ok) {
          const data = await response.json()
          setUserSettings(data)
          console.log('[Settings Page] User settings loaded:', data)
        } else {
          console.error('Failed to load user settings')
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.id) {
      loadUserSettings()
    }
  }, [session?.user?.id])

  // Load Stripe payout status
  useEffect(() => {
    const loadStripePayoutStatus = async () => {
      if (userSettings?.stripePayoutAccountId) {
        try {
          const response = await fetch('/api/stripe/express/status')
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
        addNotification({
          type: 'success',
          title: 'Stripe Account Created',
          message: 'Your Stripe Express account has been created. Please complete the onboarding process.'
        })
        
        // Reload user settings
        const settingsResponse = await fetch('/api/user/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setUserSettings(settingsData)
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Failed to Create Account',
          message: data.error || 'Failed to create Stripe Express account'
        })
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create Stripe Express account'
      })
    } finally {
      setIsCreatingStripeAccount(false)
    }
  }

  // Handle Stripe Express onboarding
  const handleStripeOnboarding = async () => {
    if (!userSettings?.stripePayoutAccountId) {
      addNotification({
        type: 'error',
        title: 'No Account Found',
        message: 'Please create a Stripe Express account first'
      })
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
      
      if (data.success) {
        window.location.href = data.url
      } else {
        addNotification({
          type: 'error',
          title: 'Failed to Start Onboarding',
          message: data.error || 'Failed to start Stripe onboarding'
        })
      }
    } catch (error) {
      console.error('Error starting Stripe onboarding:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to start Stripe onboarding'
      })
    }
  }

  // Handle Stripe payout removal
  const handleStripePayoutRemove = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
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
        addNotification({
          type: 'success',
          title: 'Stripe Payout Removed',
          message: 'Your Stripe payout account has been removed.'
        })
        
        // Reload user settings
        const settingsResponse = await fetch('/api/user/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setUserSettings(settingsData)
        }
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Failed to Remove Account',
          message: errorData.message || 'Failed to remove Stripe payout account'
        })
      }
    } catch (error) {
      console.error('Error removing Stripe payout:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove Stripe payout account'
      })
    }
  }

  // Handle profile update
  const onSubmit = async (data: any) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully!'
        })
        
        // Reload user settings
        const settingsResponse = await fetch('/api/user/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setUserSettings(settingsData)
        }
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorData.message || 'Failed to update profile'
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update profile'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async () => {
    if (!newImage) return

    const formData = new FormData()
    formData.append('image', newImage)

    try {
      const response = await fetch('/api/user/settings/image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Image Updated',
          message: 'Your profile image has been updated!'
        })
        
        // Reload user settings
        const settingsResponse = await fetch('/api/user/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setUserSettings(settingsData)
        }
        
        setShowImageUpload(false)
        setNewImage(null)
        setImagePreview(null)
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: errorData.message || 'Failed to upload image'
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to upload image'
      })
    }
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteType === 'payment') {
      // Handle payment method removal
      try {
        const response = await fetch('/api/user/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hasPaymentMethod: false,
            cardLast4: null,
            cardBrand: null,
            cardExpMonth: null,
            cardExpYear: null,
            stripePaymentMethodId: null
          })
        })

        if (response.ok) {
          addNotification({
            type: 'success',
            title: 'Payment Method Removed',
            message: 'Your payment method has been removed.'
          })
          
          // Reload user settings
          const settingsResponse = await fetch('/api/user/settings')
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            setUserSettings(settingsData)
          }
        } else {
          const errorData = await response.json()
          addNotification({
            type: 'error',
            title: 'Failed to Remove',
            message: errorData.message || 'Failed to remove payment method'
          })
        }
      } catch (error) {
        console.error('Error removing payment method:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to remove payment method'
        })
      }
    } else if (deleteType === 'payout') {
      await handleStripePayoutRemove()
    }
    
    setShowDeleteModal(false)
    setDeleteType(null)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-800 rounded-lg p-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'payment', label: 'Payment Methods', icon: CreditCard },
              { id: 'payouts', label: 'Payouts', icon: ExternalLink }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={userSettings?.image || '/default-avatar.png'}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImageUpload(true)}
                      className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{userSettings?.name || 'User'}</h3>
                    <p className="text-gray-400">{userSettings?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      defaultValue={userSettings?.name || ''}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your display name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{String(errors.name.message)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userSettings?.email || ''}
                      disabled
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Payment Methods</h2>
              <p className="text-gray-300 mb-6">Add a Stripe card to pay for pledges and server boosts.</p>

              {/* Stripe Payment Method */}
              <div className="border border-gray-600 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Stripe Card</p>
                      {userSettings?.hasPaymentMethod ? (
                        <p className="text-gray-400 text-sm">
                          {userSettings.cardBrand?.toUpperCase()} •••• {userSettings.cardLast4}
                          {userSettings.cardExpMonth && userSettings.cardExpYear && (
                            <span> • {userSettings.cardExpMonth}/{userSettings.cardExpYear}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">No payment method added</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {userSettings?.hasPaymentMethod ? (
                      <button
                        onClick={() => {
                          setDeleteType('payment')
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                        title="Remove Payment Method"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/settings/payment')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add Card
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Payout Settings</h2>
              <p className="text-gray-300 mb-6">Set up your Stripe Express account to receive payments from community pledges.</p>

              {/* Stripe Payout Method */}
              <div className="border border-gray-600 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Stripe Express Account</p>
                      {userSettings?.stripePayoutAccountId ? (
                        <div className="space-y-1">
                          <p className="text-gray-400 text-sm">
                            Account ID: {userSettings.stripePayoutAccountId.slice(0, 20)}...
                          </p>
                          {stripePayoutStatus && (
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                stripePayoutStatus.connected ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span className="text-sm text-gray-400">
                                {stripePayoutStatus.connected ? 'Connected' : 'Setup Required'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No payout account configured</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {userSettings?.stripePayoutAccountId ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        onClick={handleCreateStripeAccount}
                        disabled={isCreatingStripeAccount}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCreatingStripeAccount ? 'Creating...' : 'Create Account'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stripe Express Benefits */}
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Why Stripe Express?</h3>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li>• Simple setup for individuals (no business requirements)</li>
                  <li>• Direct bank account transfers</li>
                  <li>• Lower fees than traditional business accounts</li>
                  <li>• Secure and reliable payment processing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Update Profile Image</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              
              {imagePreview && (
                <div className="flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowImageUpload(false)
                  setNewImage(null)
                  setImagePreview(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUpload}
                disabled={!newImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Confirm Removal</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove this {deleteType === 'payment' ? 'payment method' : 'payout account'}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteType(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}