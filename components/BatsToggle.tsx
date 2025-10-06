'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Moon, Sun } from 'lucide-react'

export default function BatsToggle() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  
  const isBatsEnabled = session?.user?.batsEnabled || false

  const toggleBats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/toggle-bats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Update the session to reflect the change
        await update()
        console.log('Bats toggled successfully:', data.batsEnabled)
      } else {
        const error = await response.json()
        console.error('Failed to toggle bats:', error.message)
      }
    } catch (error) {
      console.error('Error toggling bats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <div className="flex items-center space-x-3">
          {isBatsEnabled ? (
            <Moon className="w-5 h-5 text-emerald-400" />
          ) : (
            <Sun className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h4 className="text-white font-medium">Flying Bats Animation</h4>
            <p className="text-sm text-gray-400">
              {isBatsEnabled 
                ? 'Halloween bats are flying in the background' 
                : 'Enable flying bats animation for a spooky atmosphere'
              }
            </p>
          </div>
        </div>
        <button
          onClick={toggleBats}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
            isBatsEnabled ? 'bg-emerald-600' : 'bg-gray-600'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isBatsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      <div className="text-sm text-gray-400 bg-slate-700/20 rounded-lg p-3">
        <p>
          <strong>Note:</strong> This feature adds animated flying bats to the background of the website. 
          The bats will appear behind all content and won't interfere with user interactions. 
          This setting only affects your personal view of the website.
        </p>
      </div>
    </div>
  )
}
