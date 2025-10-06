'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
// Using custom toggle instead of @headlessui/react
import { useNotifications } from '@/contexts/NotificationContext'
import { Moon, Sun } from 'lucide-react'

const BatsToggle: React.FC = () => {
  const { data: session } = useSession()
  const { addNotification } = useNotifications()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    // Fetch current global bats setting
    const fetchBatsSetting = async () => {
      try {
        const response = await fetch('/api/admin/global-settings')
        if (response.ok) {
          const settings = await response.json()
          setEnabled(settings.batsEnabled || false)
        }
      } catch (error) {
        console.error('Error fetching bats setting:', error)
        setEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      fetchBatsSetting()
    }
  }, [isAdmin])

  const handleToggle = async (checked: boolean) => {
    console.log('🦇 BatsToggle: handleToggle called with checked:', checked)
    
    if (!isAdmin) {
      console.log('🦇 BatsToggle: User is not admin')
      addNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only administrators can toggle this feature.',
      })
      return
    }

    console.log('🦇 BatsToggle: User is admin, proceeding with toggle')
    setToggling(true)
    setEnabled(checked)
    
    try {
      console.log('🦇 BatsToggle: Calling admin API with batsEnabled:', checked)
      const response = await fetch('/api/admin/global-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batsEnabled: checked }),
      })

      console.log('🦇 BatsToggle: API response status:', response.status)
      console.log('🦇 BatsToggle: API response ok:', response.ok)

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Global Bats Setting Updated',
          message: `Flying bats animation is now ${checked ? 'enabled globally' : 'disabled globally'} for all users.`,
        })
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorData.message || 'Failed to update global bats setting.',
        })
        // Revert UI if API call fails
        setEnabled(!checked)
      }
    } catch (error) {
      console.error('Error toggling global bats setting:', error)
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to the server to update global bats setting.',
      })
      // Revert UI if network error
      setEnabled(!checked)
    } finally {
      setToggling(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-gray-500 text-sm">
        You do not have permission to manage this feature.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <span className="text-white font-medium">Loading global bats setting...</span>
        <div className="w-11 h-6 bg-gray-600 rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <div className="flex items-center space-x-3">
          {enabled ? (
            <Moon className="w-5 h-5 text-emerald-400" />
          ) : (
            <Sun className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h4 className="text-white font-medium">Global Flying Bats Animation</h4>
            <p className="text-sm text-gray-400">
              {enabled 
                ? 'Bats are visible to all users globally' 
                : 'Enable flying bats animation for all users'
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => handleToggle(!enabled)}
          disabled={toggling}
          className={`${
            enabled ? 'bg-emerald-600' : 'bg-gray-600'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
            toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span className="sr-only">Enable global bats</span>
          <span
            className={`${
              enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>
      
      <div className="text-sm text-gray-400 bg-slate-700/20 rounded-lg p-3">
        <p>
          <strong>Admin Control:</strong> This toggle controls the global bats animation for all users. 
          When enabled, every user will see the flying bats animation in the background. 
          When disabled, no users will see the bats animation.
        </p>
      </div>
    </div>
  )
}

export default BatsToggle