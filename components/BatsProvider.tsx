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
        console.log('🦇 BatsProvider: Fetching bats setting...')
        const response = await fetch(`/api/public/global-settings?t=${Date.now()}`)
        if (response.ok) {
          const settings = await response.json()
          console.log('🦇 BatsProvider: Received settings:', settings)
          setBatsEnabled(settings.batsEnabled || false)
          console.log('🦇 BatsProvider: Set batsEnabled to:', settings.batsEnabled || false)
        } else {
          console.log('🦇 BatsProvider: API response not ok:', response.status)
          setBatsEnabled(false)
        }
      } catch (error) {
        console.log('🦇 BatsProvider: Error fetching settings:', error)
        setBatsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    fetchBatsSetting()

    // Poll for updates every 10 seconds to catch admin changes (increased for database replication delays)
    const interval = setInterval(fetchBatsSetting, 10000)

    return () => clearInterval(interval)
  }, [])

  // Don't render anything while loading
  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'orange', 
        color: 'white', 
        padding: '5px', 
        zIndex: 9999,
        fontSize: '12px'
      }}>
        🦇 Loading...
      </div>
    )
  }
  
  return (
    <>
      <FlyingBats enabled={batsEnabled} />
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: batsEnabled ? 'green' : 'red', 
        color: 'white', 
        padding: '5px', 
        zIndex: 9999,
        fontSize: '12px'
      }}>
        🦇 {batsEnabled ? 'ON' : 'OFF'}
      </div>
    </>
  )
}
