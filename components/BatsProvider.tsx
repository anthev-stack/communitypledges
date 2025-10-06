'use client'

import { useState, useEffect } from 'react'
import FlyingBats from './FlyingBats'

export default function BatsProvider() {
  const [batsEnabled, setBatsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch global bats setting
    const fetchBatsSetting = async () => {
      try {
        console.log('🦇 Fetching global bats setting...')
        const response = await fetch('/api/public/global-settings')
        if (response.ok) {
          const settings = await response.json()
          console.log('🦇 Global bats setting:', settings)
          setBatsEnabled(settings.batsEnabled || false)
        } else {
          console.error('🦇 Failed to fetch bats setting:', response.status)
          setBatsEnabled(false)
        }
      } catch (error) {
        console.error('🦇 Error fetching bats setting:', error)
        setBatsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    fetchBatsSetting()
  }, [])

  // Don't render anything while loading
  if (loading) {
    return null
  }
  
  return <FlyingBats enabled={batsEnabled} />
}
