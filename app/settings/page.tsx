"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"
import AddPaymentMethodModal from "@/components/AddPaymentMethodModal"
import { User, MapPin, CreditCard, Mail, Shield, Upload, Eye, EyeOff } from 'lucide-react'
import MarketingSettingsLayout from "@/components/marketing/MarketingSettingsLayout"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [name, setName] = useState(session?.user?.name || "")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  
  // Stripe Connect status
  const [stripeStatus, setStripeStatus] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [removingStripe, setRemovingStripe] = useState(false)
  const [showStripeSetupModal, setShowStripeSetupModal] = useState(false)
  const [hasReadGuide, setHasReadGuide] = useState(false)
  
  // Country selection
  const [country, setCountry] = useState("")
  const [userCountry, setUserCountry] = useState("")
  const [savingCountry, setSavingCountry] = useState(false)

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [deletingPaymentMethod, setDeletingPaymentMethod] = useState<string | null>(null)

  // Email preferences
  const [emailPreferences, setEmailPreferences] = useState({
    paymentReminders: true,
    accountSuspension: true,
    ticketResponses: true,
    passwordReset: true,
    declinedPayments: true,
    receivedPayments: true,
    removedPledge: true,
  })
  const [loadingEmailPreferences, setLoadingEmailPreferences] = useState(true)
  const [savingEmailPreferences, setSavingEmailPreferences] = useState(false)

  // Profile picture upload
  const [profileImage, setProfileImage] = useState<string | null>(session?.user?.image || null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Account type detection
  const [hasPassword, setHasPassword] = useState(true)
  const [isDiscordAccount, setIsDiscordAccount] = useState(false)

  // Password change
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    checkStripeStatus()
    fetchUserData()
    fetchPaymentMethods()
    fetchEmailPreferences()
    checkAccountType()
  }, [])

  const checkAccountType = async () => {
    try {
      if (!session?.user?.email) return
      
      const response = await fetch("/api/auth/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const isDiscord = data.accountType === 'discord'
        setIsDiscordAccount(isDiscord)
        setHasPassword(!isDiscord)
      }
    } catch (error) {
      console.error("Error checking account type:", error)
    }
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/me")
      const data = await response.json()
      if (data.country) {
        setUserCountry(data.country)
        setCountry(data.country)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/stripe/payment-methods")
      const data = await response.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return
    }

    setDeletingPaymentMethod(paymentMethodId)

    try {
      const response = await fetch(`/api/stripe/payment-methods?id=${paymentMethodId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
        setMessage("Payment method removed successfully")
      } else {
        setError("Failed to remove payment method")
      }
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setDeletingPaymentMethod(null)
    }
  }

  const handlePaymentMethodAdded = () => {
    setMessage("Payment method added successfully!")
    fetchPaymentMethods()
  }

  const fetchEmailPreferences = async () => {
    try {
      const response = await fetch("/api/user/email-preferences")
      if (response.ok) {
        const data = await response.json()
        setEmailPreferences(data)
      }
    } catch (error) {
      console.error("Error fetching email preferences:", error)
    } finally {
      setLoadingEmailPreferences(false)
    }
  }

  const handleSaveEmailPreferences = async () => {
    setSavingEmailPreferences(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/user/email-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPreferences),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save email preferences")
        return
      }

      setMessage("Email preferences saved successfully!")
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setSavingEmailPreferences(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordMessage("")

    // Validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("All password fields are required")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError("New password must be different from old password")
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || "Failed to change password")
        return
      }

      setPasswordMessage("Password changed successfully!")
      setOldPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (error) {
      setPasswordError("Something went wrong. Please try again.")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleProfileImageUpload = async (file: File) => {
    if (!file) return

    // Check file type
    const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setError("Only WebP, PNG, and JPG files are allowed")
      return
    }

    // Check if user is staff for GIF support
    const userResponse = await fetch("/api/user/me")
    const userData = await userResponse.json()
    const isStaff = userData.role === "ADMIN" || userData.role === "MODERATOR"
    
    if (file.type === 'image/gif' && !isStaff) {
      setError("Only partners, moderators, and admins can upload GIF profile pictures")
      return
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    setUploadingImage(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfileImage(data.imageUrl)
        setMessage("Profile picture updated successfully!")
        // Update the session to reflect the new image
        update({ image: data.imageUrl })
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to upload image")
      }
    } catch (error) {
      setError("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleProfileImageUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleProfileImageUpload(files[0])
    }
  }

  const checkStripeStatus = async () => {
    try {
      const response = await fetch("/api/stripe/connect")
      const data = await response.json()
      setStripeStatus(data)
    } catch (error) {
      console.error("Error checking Stripe status:", error)
    } finally {
      setStripeLoading(false)
    }
  }

  const handleSaveCountry = async () => {
    if (!country) {
      setError("Please select a country")
      return
    }

    setSavingCountry(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/user/country", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save country")
        return
      }

      setUserCountry(country)
      setMessage("Country saved! You can now connect Stripe.")
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setSavingCountry(false)
    }
  }

  const handleConnectStripeClick = () => {
    if (!userCountry) {
      setError("Please select and save your country first")
      return
    }
    // Show the modal first
    setShowStripeSetupModal(true)
  }

  const handleConnectStripe = async () => {
    if (!userCountry) {
      setError("Please select and save your country first")
      return
    }

    setConnectingStripe(true)
    setError("")
    setShowStripeSetupModal(false) // Close modal

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      })
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Failed to connect Stripe")
        return
      }

      if (data.url) {
        if (typeof window !== 'undefined') {
          window.location.href = data.url
        }
      } else {
        setError("Failed to get onboarding URL")
      }
    } catch (error) {
      setError("Failed to connect Stripe")
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleRemoveStripe = async () => {
    if (!confirm("Are you sure you want to remove your payout method? You will need to set it up again to receive donations and create servers.")) {
      return
    }

    setRemovingStripe(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/stripe/reset", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to remove payout method")
        return
      }

      setMessage("Payout method removed successfully. You can now set it up again.")
      // Refresh the stripe status
      checkStripeStatus()
    } catch (error) {
      setError("Something went wrong while removing payout method")
    } finally {
      setRemovingStripe(false)
    }
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Something went wrong")
        return
      }

      setMessage("Profile updated successfully!")
      await update()
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingSettingsLayout>
            {/* Success/Error Messages */}
            {message && (
              <div className="mb-6 settings-alert--success px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-6 settings-alert--error px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="listing-card p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <section>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-indigo-400" />
                    Profile Picture
                  </h2>
                  
                  <div className="flex flex-col items-center">
                    {/* Current Profile Picture */}
                    <div className="mb-4">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt={session?.user?.name || "User"}
                          width={100}
                          height={100}
                          className="rounded-full object-cover border-4 border-slate-700"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold border-4 border-slate-700">
                          {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>

                    {/* Upload Area */}
                    <div className="w-full">
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                          dragActive
                            ? "border-indigo-500 bg-indigo-900/20"
                            : "border-slate-600 hover:border-slate-500"
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        {uploadingImage ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
                            <p className="text-sm text-gray-400">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <div className="text-sm text-gray-300 mb-1">
                              <span className="font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer">
                                Click to upload
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              WebP, PNG, JPG up to 5MB
                            </p>
                          </>
                        )}
                        
                        <input
                          type="file"
                          accept=".webp,.png,.jpg,.jpeg,.gif"
                          onChange={handleFileInput}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingImage}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-indigo-400" />
                    Account Information
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                        Username
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
                        placeholder="Enter your username"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={session.user?.email || ""}
                        disabled
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-indigo-400" />
                    Country/Region
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">* Required for payouts</p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                        Select Your Country
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={!!userCountry && !!stripeStatus?.connected}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white disabled:bg-slate-900 disabled:cursor-not-allowed"
                      >
                        <option value="">Select your country</option>
                        {SUPPORTED_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                      {userCountry && stripeStatus?.connected ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Country cannot be changed after connecting Stripe
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Choose the country where you&apos;ll receive payouts
                        </p>
                      )}
                    </div>

                    {!userCountry || country !== userCountry ? (
                      <button
                        onClick={handleSaveCountry}
                        disabled={savingCountry || !country}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingCountry ? "Saving..." : "Save Country"}
                      </button>
                    ) : (
                      <div className="flex items-center text-sm text-green-400">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Country saved
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-indigo-400" />
                    Account Details
                  </h2>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-400">Account ID</dt>
                      <dd className="text-sm text-gray-300 mt-1 font-mono">{session.user?.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-400">Authentication Method</dt>
                      <dd className="text-sm text-gray-300 mt-1">
                        {isDiscordAccount ? (
                          <div>
                            <span className="font-semibold text-indigo-400">Discord OAuth</span>
                            <p className="text-xs text-gray-500 mt-1">
                              Your account is linked to Discord
                            </p>
                          </div>
                        ) : (
                          <span className="font-semibold text-green-400">Email & Password</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>

            <section className="settings-panel-divider">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-indigo-400" />
                Payment Method
              </h2>

              {loadingPaymentMethods ? (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  <span className="text-sm">Loading payment method...</span>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">No payment method saved.</strong> Add a card for quick donations and monthly pledges to servers.
                  </p>
                  <p className="text-xs text-gray-500">
                    Card details are stored securely by Stripe — we never see or store your card information.
                  </p>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition inline-flex items-center"
                  >
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Saved for quick donations and monthly pledges. Stored securely by Stripe.
                  </p>
                  <div className="divide-y divide-white/10 rounded-lg border border-white/10">
                    {paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white capitalize truncate">
                            {pm.brand} •••• {pm.last4}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expires {pm.expMonth}/{pm.expYear}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          disabled={deletingPaymentMethod === pm.id}
                          className="text-red-400 hover:text-red-300 text-xs font-medium shrink-0 disabled:opacity-50"
                        >
                          {deletingPaymentMethod === pm.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    + Add another card
                  </button>
                </div>
              )}
            </section>

            <section className="settings-panel-divider">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-indigo-400" />
                    <h2 className="text-lg font-semibold text-white">Payout Method</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <span className="text-xs text-gray-400">* Required to create servers</span>
                    <Link
                      href="/help/stripe-setup"
                      target="_blank"
                      className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center transition"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Setup Guide (Read First!)
                    </Link>
                  </div>
                </div>

                {stripeLoading ? (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    <span className="text-sm">Checking Stripe status...</span>
                  </div>
                ) : stripeStatus?.onboardingComplete ? (
                  <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-green-300">Stripe Connected</h3>
                        <div className="mt-2 text-sm text-green-400">
                          <p>Your payout method is set up and ready to receive donations!</p>
                          <p className="mt-2 text-gray-300">
                            <strong>Status:</strong> Active<br />
                            <strong>Charges:</strong> {stripeStatus.chargesEnabled ? "Enabled" : "Disabled"}<br />
                            <strong>Payouts:</strong> {stripeStatus.payoutsEnabled ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveStripe}
                          disabled={removingStripe}
                          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingStripe ? "Removing..." : "Remove Payout Method"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : stripeStatus?.connected && !stripeStatus?.onboardingComplete ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Payout Setup Incomplete</h3>
                    <div className="text-sm text-gray-400 space-y-2">
                      <p>
                        Your Stripe account is connected but the setup is not complete. This might happen if you didn&apos;t follow the setup guide correctly or closed the setup window early.
                      </p>
                      <p className="text-xs">
                        You can either continue the setup or remove this connection and start fresh.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleConnectStripeClick}
                        disabled={connectingStripe || removingStripe}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {connectingStripe ? "Loading..." : "Continue Setup"}
                      </button>
                      <button
                        onClick={handleRemoveStripe}
                        disabled={removingStripe || connectingStripe}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingStripe ? "Removing..." : "Remove & Start Over"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">
                      <strong className="text-white">Payout method required.</strong> Connect Stripe before you can create a server and receive donations.
                    </p>
                    <p className="text-xs text-gray-500">
                      You&apos;ll need bank account details, ID verification, and tax info.{" "}
                      <strong className="text-gray-400">No business account required</strong> — individuals can use Stripe Connect Express.
                    </p>
                    <button
                      onClick={handleConnectStripeClick}
                      disabled={connectingStripe}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                    >
                      {connectingStripe ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                          </svg>
                          Connect Stripe Account
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-400">
                  <p>
                    <strong>Powered by Stripe Connect.</strong> Stripe is a secure payment platform trusted by millions. Your financial information is safe and protected.
                  </p>
                </div>
            </section>

            <section className="settings-panel-divider">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-indigo-400" />
                Email Notifications
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Choose which emails you want to receive. You can change these settings at any time.
              </p>

              {loadingEmailPreferences ? (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  <span className="text-sm">Loading email preferences...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'paymentReminders',
                        label: 'Payment Reminders',
                        description: 'Get notified when payments are due or overdue'
                      },
                      {
                        key: 'accountSuspension',
                        label: 'Account Suspension',
                        description: 'Important notifications about account status changes'
                      },
                      {
                        key: 'ticketResponses',
                        label: 'Support Ticket Responses',
                        description: 'Get notified when staff responds to your support tickets'
                      },
                      {
                        key: 'passwordReset',
                        label: 'Password Reset',
                        description: 'Security emails for password resets and account recovery'
                      },
                      {
                        key: 'declinedPayments',
                        label: 'Declined Payments',
                        description: 'Notifications when payments fail or are declined'
                      },
                      {
                        key: 'receivedPayments',
                        label: 'Payment Confirmations',
                        description: 'Confirmations when payments are successfully processed'
                      },
                      {
                        key: 'removedPledge',
                        label: 'Pledge Updates',
                        description: 'Notifications when pledges are removed or modified'
                      }
                    ].map((preference) => (
                      <div key={preference.key} className="flex items-start space-x-3 p-3 border border-slate-700 rounded-lg hover:bg-slate-800/30 transition">
                        <div className="flex items-center h-5">
                          <input
                            id={preference.key}
                            type="checkbox"
                            checked={emailPreferences[preference.key as keyof typeof emailPreferences]}
                            onChange={(e) => setEmailPreferences(prev => ({
                              ...prev,
                              [preference.key]: e.target.checked
                            }))}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-800"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label htmlFor={preference.key} className="text-sm font-medium text-white cursor-pointer">
                            {preference.label}
                          </label>
                          <p className="text-sm text-gray-400 mt-1">
                            {preference.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveEmailPreferences}
                      disabled={savingEmailPreferences}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingEmailPreferences ? "Saving..." : "Save Email Preferences"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {hasPassword && !isDiscordAccount && (
              <section className="settings-panel-divider">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-400" />
                  Change Password
                </h2>
                
                {passwordMessage && (
                  <div className="mb-4 bg-green-900/30 border border-green-700/50 text-green-300 px-4 py-3 rounded-lg">
                    {passwordMessage}
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      Current Password
                    </label>
                    <input
                      id="oldPassword"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
                      placeholder="Enter your current password"
                      disabled={changingPassword}
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
                      placeholder="Enter your new password"
                      disabled={changingPassword}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
                      placeholder="Confirm your new password"
                      disabled={changingPassword}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      Forgot your current password?
                    </Link>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onSuccess={handlePaymentMethodAdded}
      />

      {/* Stripe Setup Confirmation Modal */}
      {showStripeSetupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Important: Read the Setup Guide First!
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Setting up your Stripe payout account correctly the first time is crucial. Many users make mistakes during setup because they don&apos;t understand the requirements.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Before you continue, make sure you understand:
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>How to fill out the form <strong>as an individual</strong> (not a business)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>What information you&apos;ll need (ID, bank details, tax info)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>Country-specific requirements for your location</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>Which fields to leave blank (business registration, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>How payouts and fees work</span>
                  </li>
                </ul>
              </div>

              <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-orange-300 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Common Mistakes to Avoid:
                </h4>
                <ul className="space-y-1 text-sm text-orange-200">
                  <li className="flex items-start">
                    <span className="text-orange-400 mr-2">✗</span>
                    <span>Entering a business name instead of your personal name</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-400 mr-2">✗</span>
                    <span>Selecting the wrong country</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-400 mr-2">✗</span>
                    <span>Providing incorrect bank details</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-400 mr-2">✗</span>
                    <span>Uploading unclear ID photos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-400 mr-2">✗</span>
                    <span>Not completing all required fields</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <Link
                  href="/help/stripe-setup"
                  target="_blank"
                  className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Open Setup Guide in New Tab
                </Link>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Read the guide, then come back here to continue
                </p>
              </div>

              <div className="border-t border-slate-700 pt-4 mb-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasReadGuide}
                    onChange={(e) => setHasReadGuide(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-800"
                  />
                  <span className="ml-3 text-sm text-gray-300">
                    I have read and understand the setup guide. I&apos;m ready to set up my Stripe account correctly with the right information.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStripeSetupModal(false)
                    setHasReadGuide(false)
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectStripe}
                  disabled={!hasReadGuide || connectingStripe}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingStripe ? "Connecting..." : "I'm Ready - Connect Stripe"}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                💡 If you make a mistake, you can always use the &quot;Remove Payout Method&quot; button to start over
              </p>
            </div>
          </div>
        </div>
      )}
    </MarketingSettingsLayout>
  )
}

