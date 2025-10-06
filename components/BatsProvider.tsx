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
        const response = await fetch(`/api/public/global-settings?t=${Date.now()}`)
        if (response.ok) {
          const settings = await response.json()
          setBatsEnabled(settings.batsEnabled || false)
        } else {
          setBatsEnabled(false)
        }
      } catch (error) {
        setBatsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    fetchBatsSetting()
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
