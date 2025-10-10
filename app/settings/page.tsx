'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import Link from 'next/link'
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
import { SUPPORTED_COUNTRIES } from '@/lib/countries'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface UserSettings {
  hasPaymentMethod: boolean
  cardLast4?: string
  cardBrand?: string
  cardExpMonth?: number
  cardExpYear?: number
  stripePaymentMethodId?: string
  // Stripe Connect (for receiving payouts)
  stripeAccountId?: string | null
  stripeAccountStatus?: string | null
  stripeOnboardingComplete?: boolean
  country?: string | null
  // Legacy fields
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
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [isSavingCountry, setIsSavingCountry] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

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

  // Set selected country from user settings
  useEffect(() => {
    if (userSettings?.country) {
      setSelectedCountry(userSettings.country)
    }
  }, [userSettings?.country])

  // Load Stripe Connect status
  useEffect(() => {
    const loadStripeConnectStatus = async () => {
      if (userSettings?.stripeAccountId) {
        try {
          const response = await fetch('/api/stripe/connect/status')
          if (response.ok) {
            const data = await response.json()
            setStripePayoutStatus(data)
          }
        } catch (error) {
          console.error('Error loading Stripe Connect status:', error)
        }
      }
    }

    loadStripeConnectStatus()
  }, [userSettings?.stripeAccountId])

  // Handle country save
  const handleSaveCountry = async () => {
    if (!selectedCountry) {
      addNotification({
        type: 'error',
        title: 'Country Required',
        message: 'Please select a country'
      })
      return
    }

    setIsSavingCountry(true)
    try {
      const response = await fetch('/api/user/country', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ country: selectedCountry })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Country Saved',
          message: 'Your country has been saved successfully'
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
          title: 'Failed to Save',
          message: errorData.error || 'Failed to save country'
        })
      }
    } catch (error) {
      console.error('Error saving country:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save country'
      })
    } finally {
      setIsSavingCountry(false)
    }
  }

  // Handle Stripe Connect onboarding
  const handleConnectStripe = async () => {
    if (!userSettings?.country) {
      addNotification({
        type: 'error',
        title: 'Country Required',
        message: 'Please select your country first'
      })
      return
    }

    setIsCreatingStripeAccount(true)
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.url) {
        addNotification({
          type: 'success',
          title: 'Redirecting to Stripe',
          message: 'Please complete the onboarding process'
        })
        
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        addNotification({
          type: 'error',
          title: 'Failed',
          message: data.error || 'Failed to create Stripe Connect account'
        })
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to connect Stripe'
      })
    } finally {
      setIsCreatingStripeAccount(false)
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

  // Get allowed file types based on user role
  const getAllowedFileTypes = () => {
    const userRole = session?.user?.role
    const isPremiumUser = userRole === 'partner' || userRole === 'moderator' || userRole === 'admin'
    
    if (isPremiumUser) {
      return {
        accept: '.png,.jpg,.jpeg,.webp,.gif',
        types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
        description: 'PNG, JPG, WEBP, or GIF'
      }
    }
    
    return {
      accept: '.png,.jpg,.jpeg,.webp',
      types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      description: 'PNG, JPG, or WEBP'
    }
  }

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const allowed = getAllowedFileTypes()
    
    if (!allowed.types.includes(file.type)) {
      addNotification({
        type: 'error',
        title: 'Invalid File Type',
        message: `Please upload a ${allowed.description} image. ${file.type === 'image/gif' ? 'GIF images are only available for Partners, Moderators, and Admins.' : ''}`
      })
      return false
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Please upload an image smaller than 5MB'
      })
      return false
    }
    
    return true
  }

  // Handle image upload
  const handleImageUpload = async () => {
    if (!newImage) return

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append('profileImage', newImage)

    try {
      const response = await fetch('/api/user/settings/profile-image', {
        method: 'PUT',
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
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!validateFileType(file)) {
        return
      }
      
      setNewImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      
      if (!validateFileType(file)) {
        return
      }
      
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
        const response = await fetch('/api/user/settings/payment', {
          method: 'DELETE'
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
                {/* Profile Picture Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="relative group">
                      <img
                        src={userSettings?.image || '/default-avatar.png'}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowImageUpload(true)}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-lg font-medium text-white">{userSettings?.name || 'User'}</h3>
                          <p className="text-gray-400 text-sm">{userSettings?.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowImageUpload(true)}
                          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                        >
                          Change Picture
                        </button>
                        <p className="text-xs text-gray-500">
                          {session?.user?.role === 'partner' || session?.user?.role === 'moderator' || session?.user?.role === 'admin'
                            ? 'PNG, JPG, WEBP, or GIF • Max 5MB'
                            : 'PNG, JPG, or WEBP • Max 5MB'}
                        </p>
                      </div>
                    </div>
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
            <div className="space-y-6">
              {/* Country Selection */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Country/Region</h2>
                <p className="text-gray-400 text-sm mb-4">* Required for payouts</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Your Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      disabled={userSettings?.stripeOnboardingComplete}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a country</option>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    {userSettings?.stripeOnboardingComplete && (
                      <p className="mt-2 text-xs text-gray-500">
                        Country cannot be changed after connecting Stripe
                      </p>
                    )}
                  </div>
                  
                  {selectedCountry && selectedCountry !== userSettings?.country && (
                    <button
                      onClick={handleSaveCountry}
                      disabled={isSavingCountry || userSettings?.stripeOnboardingComplete}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSavingCountry ? 'Saving...' : 'Save Country'}
                    </button>
                  )}
                  
                  {userSettings?.country && (
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Country saved</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payout Method */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Payout Method</h2>
                <p className="text-gray-400 text-sm mb-4">* Required to create servers</p>
                
                {!userSettings?.stripeAccountId ? (
                  <div className="space-y-4">
                    <p className="text-gray-300">Connect your Stripe account to receive payouts from community pledges.</p>
                    <button
                      onClick={handleConnectStripe}
                      disabled={!userSettings?.country || isCreatingStripeAccount}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isCreatingStripeAccount ? 'Connecting...' : 'Connect Stripe'}
                    </button>
                    {!userSettings?.country && (
                      <p className="text-yellow-400 text-sm">⚠️ Please select your country first</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-emerald-900/20 border border-emerald-500/50 rounded-lg">
                      <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-emerald-300 font-medium">Stripe Connected</p>
                        <p className="text-emerald-400/80 text-sm mt-1">
                          Your payout method is set up and ready to receive donations!
                        </p>
                        
                        {stripePayoutStatus && (
                          <div className="mt-3 space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Status:</span>
                              <span className={stripePayoutStatus.onboardingComplete ? 'text-emerald-400' : 'text-yellow-400'}>
                                {stripePayoutStatus.onboardingComplete ? 'Active' : 'Pending'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Charges:</span>
                              <span className={stripePayoutStatus.chargesEnabled ? 'text-emerald-400' : 'text-gray-500'}>
                                {stripePayoutStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Payouts:</span>
                              <span className={stripePayoutStatus.payoutsEnabled ? 'text-emerald-400' : 'text-gray-500'}>
                                {stripePayoutStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm">
                      Powered by Stripe Connect. Stripe is a secure payment platform trusted by millions. Your financial information is safe and protected.
                    </p>
                  </div>
                )}
              </div>

              {/* Stripe Connect Benefits */}
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Why Stripe Connect?</h3>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li>• Simple setup for individuals (no business required)</li>
                  <li>• Direct bank account transfers (automatic daily payouts)</li>
                  <li>• Secure and reliable payment processing</li>
                  <li>• Trusted by millions of businesses worldwide</li>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Update Profile Picture</h3>
              <button
                onClick={() => {
                  setShowImageUpload(false)
                  setNewImage(null)
                  setImagePreview(null)
                  setIsDragging(false)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input
                  type="file"
                  id="profile-image-input"
                  accept={getAllowedFileTypes().accept}
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div className="space-y-3">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-white font-medium mb-1">
                        Drag and drop your image here
                      </p>
                      <p className="text-gray-400 text-sm mb-3">or</p>
                      <label
                        htmlFor="profile-image-input"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        Browse Files
                      </label>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Accepted formats: {getAllowedFileTypes().description}</p>
                      {session?.user?.role !== 'partner' && 
                       session?.user?.role !== 'moderator' && 
                       session?.user?.role !== 'admin' && (
                        <p className="text-yellow-400">
                          ✨ GIF images available for Partners, Moderators & Admins
                        </p>
                      )}
                      <p>Max size: 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-700"
                    />
                    <div className="space-y-1">
                      <p className="text-white font-medium">{newImage?.name}</p>
                      <p className="text-gray-400 text-sm">
                        {newImage && (newImage.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNewImage(null)
                        setImagePreview(null)
                      }}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Choose Different Image
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowImageUpload(false)
                  setNewImage(null)
                  setImagePreview(null)
                  setIsDragging(false)
                }}
                disabled={isUploadingImage}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUpload}
                disabled={!newImage || isUploadingImage}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isUploadingImage ? 'Uploading...' : 'Upload'}
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