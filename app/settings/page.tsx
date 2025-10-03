'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  Check
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
  paypalEmail?: string
  name?: string
  email?: string
  image?: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'payment' | 'deposit'>('account')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'payment' | 'deposit'>('payment')
  const [showCardForm, setShowCardForm] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [savingProfileImage, setSavingProfileImage] = useState(false)

  const accountForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  // Fetch user settings
  const fetchUserSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/settings')
      
      if (response.ok) {
        const settings = await response.json()
        setUserSettings(settings)
        accountForm.reset({
          name: settings.name || '',
          email: settings.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        if (settings.image) {
          setProfileImagePreview(settings.image)
        }
      } else {
        setUserSettings({
          hasPaymentMethod: false,
          paypalEmail: null,
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          image: session?.user?.image || undefined
        })
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load settings',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      setUserSettings({
        hasPaymentMethod: false,
        paypalEmail: null,
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        image: session?.user?.image || undefined
      })
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error loading settings',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  // Process image file
  const processImageFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      addNotification({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please upload a PNG, JPG, or WebP image',
        duration: 4000
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Please upload an image smaller than 5MB',
        duration: 4000
      })
      return
    }

    setProfileImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
  }

  // Save profile image
  const saveProfileImage = async () => {
    if (!profileImage) return

    setSavingProfileImage(true)
    try {
      const formData = new FormData()
      formData.append('profileImage', profileImage)

      const response = await fetch('/api/user/settings/profile-image', {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        await fetchUserSettings()
        setProfileImage(null)
        addNotification({
          type: 'success',
          title: 'Profile Picture Updated',
          message: 'Your profile picture has been updated successfully!',
          duration: 4000
        })
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update profile picture',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error updating profile picture:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile picture',
        duration: 4000
      })
    } finally {
      setSavingProfileImage(false)
    }
  }

  // Handle PayPal OAuth
  const handlePayPalOAuth = () => {
    window.location.href = '/api/paypal/oauth'
  }

  // Handle PayPal update (fallback for manual email entry)
  const handlePayPalUpdate = async (email: string) => {
    try {
      const response = await fetch('/api/user/settings/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'PayPal Updated',
          message: 'Your PayPal email has been saved successfully!',
          duration: 4000
        })
        fetchUserSettings()
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorData.message || 'Failed to save PayPal email',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error updating PayPal:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to save PayPal email',
        duration: 4000
      })
    }
  }

  // Handle PayPal remove
  const handlePayPalRemove = async () => {
    try {
      const response = await fetch('/api/user/settings/paypal', {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'PayPal Removed',
          message: 'Your PayPal email has been removed.',
          duration: 4000
        })
        fetchUserSettings()
      } else {
        addNotification({
          type: 'error',
          title: 'Remove Failed',
          message: 'Failed to remove PayPal email',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error removing PayPal:', error)
      addNotification({
        type: 'error',
        title: 'Remove Failed',
        message: 'Failed to remove PayPal email',
        duration: 4000
      })
    }
  }

  // Handle card remove
  const handleCardRemove = async () => {
    try {
      const response = await fetch('/api/user/settings/payment', {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Payment Method Removed',
          message: 'Your payment method has been removed.',
          duration: 4000
        })
        fetchUserSettings()
      } else {
        addNotification({
          type: 'error',
          title: 'Remove Failed',
          message: 'Failed to remove payment method',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error removing payment method:', error)
      addNotification({
        type: 'error',
        title: 'Remove Failed',
        message: 'Failed to remove payment method',
        duration: 4000
      })
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (deleteType === 'payment') {
      await handleCardRemove()
    } else if (deleteType === 'deposit') {
      await handlePayPalRemove()
    }
    setShowDeleteModal(false)
  }

  // Handle payment success
  const handlePaymentSuccess = (paymentMethodId: string) => {
    addNotification({
      type: 'success',
      title: 'Payment Method Added',
      message: 'Your payment method has been added successfully!',
      duration: 4000
    })
    fetchUserSettings()
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    addNotification({
      type: 'error',
      title: 'Payment Failed',
      message: error,
      duration: 4000
    })
  }

  // Load settings on mount
  useEffect(() => {
    if (session) {
      fetchUserSettings()
    }
  }, [session])

  // Handle PayPal OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paypalStatus = urlParams.get('paypal')
    const paypalEmail = urlParams.get('email')

    if (paypalStatus === 'success' && paypalEmail) {
      addNotification({
        type: 'success',
        title: 'PayPal Connected',
        message: `Successfully connected PayPal account: ${paypalEmail}`,
        duration: 5000
      })
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (paypalStatus === 'error') {
      addNotification({
        type: 'error',
        title: 'PayPal Connection Failed',
        message: 'Failed to connect PayPal account. Please try again.',
        duration: 5000
      })
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Not authenticated</h2>
          <p className="text-gray-400">Please log in to access your settings.</p>
        </div>
      </div>
    )
  }

  // No user settings
  if (!userSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Loading settings...</h2>
          <p className="text-gray-400">Please wait while we load your account settings.</p>
          <button
            onClick={fetchUserSettings}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-gray-300 mt-2">Manage your payment and deposit methods</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'account'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Account
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'payment'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Payment Methods
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'deposit'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Payout Methods
        </button>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
            
            {/* Profile Picture */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={removeProfileImage}
                    className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Remove Profile Picture"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <label className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {profileImage && (
                    <button
                      onClick={saveProfileImage}
                      disabled={savingProfileImage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {savingProfileImage ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Username and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={userSettings.name || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userSettings.email || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Payment Methods</h2>
            <p className="text-gray-300 mb-6">Manage how you pay for pledges and server boosts.</p>
            
            {/* Existing Payment Methods */}
            {userSettings.hasPaymentMethod && (
              <div className="space-y-4 mb-6">
                {/* Card Payment Method */}
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-white font-medium">
                          {userSettings.cardBrand?.toUpperCase()} •••• {userSettings.cardLast4}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Expires {userSettings.cardExpMonth}/{userSettings.cardExpYear}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDeleteType('payment')
                        setShowDeleteModal(true)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PayPal Payment Method */}
            {userSettings.paypalEmail && (
              <div className="space-y-4 mb-6">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">P</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">PayPal</p>
                        <p className="text-gray-400 text-sm">
                          {userSettings.paypalEmail}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Remove PayPal payment method?')) {
                          handlePayPalRemove()
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove PayPal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Payment Methods */}
            {!userSettings.hasPaymentMethod && !userSettings.paypalEmail && (
              <div>
                <p className="text-gray-300 mb-4">No payment methods added yet. Choose how you want to pay for pledges and server boosts.</p>
                <div className="space-y-4">
                  {/* PayPal - Recommended */}
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">PayPal (Recommended)</h4>
                        <p className="text-gray-400 text-sm">Simple setup, widely accepted</p>
                      </div>
                      <button
                        onClick={handlePayPalOAuth}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        Connect PayPal
                      </button>
                    </div>
                  </div>

                  {/* Card Payment - Alternative */}
                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Credit/Debit Card</h4>
                        <p className="text-gray-400 text-sm">Visa, Mastercard, American Express</p>
                      </div>
                      <button
                        onClick={() => setShowCardForm(true)}
                        className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700"
                      >
                        Add Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout Methods Tab */}
      {activeTab === 'deposit' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Payout Methods</h2>
            <p className="text-gray-300 mb-6">Set up your PayPal account to receive monthly donations from community members. PayPal is required for all server owners.</p>
            
            {/* PayPal Method */}
            <div className="space-y-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">P</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        PayPal Email
                      </p>
                      <p className="text-gray-400 text-sm">
                        {userSettings.paypalEmail || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePayPalOAuth}
                      className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Connect PayPal Account"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {userSettings.paypalEmail && (
                      <button
                        onClick={() => {
                          if (confirm('Remove PayPal email?')) {
                            handlePayPalRemove()
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove PayPal Email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add PayPal Method */}
              {!userSettings.paypalEmail && (
                <div className="border-t border-slate-600 pt-4">
                  <h3 className="text-lg font-medium text-white mb-4">Add PayPal Account</h3>
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">PayPal Account Required</h4>
                        <p className="text-gray-400 text-sm">All server owners must have a PayPal account to receive donations</p>
                      </div>
                      <button
                        onClick={handlePayPalOAuth}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        Connect PayPal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Form Modal */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Payment Method</h3>
              <button
                onClick={() => setShowCardForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <Elements stripe={stripePromise}>
              <PaymentForm 
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isUpdating={false}
              />
            </Elements>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove this {deleteType === 'payment' ? 'payment method' : 'PayPal account'}? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Payment Form Component
function PaymentForm({ onSuccess, onError, isUpdating }: { onSuccess: (paymentMethodId: string) => void, onError: (error: string) => void, isUpdating: boolean }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) {
        onError(error.message || 'Payment method creation failed')
      } else if (paymentMethod) {
        const response = await fetch('/api/user/settings/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id
          })
        })

        if (response.ok) {
          onSuccess(paymentMethod.id)
        } else {
          const errorData = await response.json()
          onError(errorData.message || 'Failed to save payment method')
        }
      }
    } catch (error) {
      onError('An unexpected error occurred')
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
        {loading ? 'Processing...' : (isUpdating ? 'Add New Payment Method' : 'Add Payment Method')}
      </button>
    </form>
  )
}