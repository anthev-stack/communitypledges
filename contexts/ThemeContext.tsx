'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isHalloweenTheme: boolean
  setHalloweenTheme: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isHalloweenTheme, setIsHalloweenTheme] = useState(false)

  useEffect(() => {
    // Fetch global bats setting to determine theme
    const fetchThemeSetting = async () => {
      try {
        const response = await fetch(`/api/public/global-settings?t=${Date.now()}`)
        if (response.ok) {
          const settings = await response.json()
          setIsHalloweenTheme(settings.batsEnabled || false)
        }
      } catch (error) {
        console.log('ThemeProvider: Error fetching theme setting:', error)
        setIsHalloweenTheme(false)
      }
    }

    fetchThemeSetting()

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchThemeSetting, 10000)
    return () => clearInterval(interval)
  }, [])

  const setHalloweenTheme = (enabled: boolean) => {
    setIsHalloweenTheme(enabled)
  }

  return (
    <ThemeContext.Provider value={{ isHalloweenTheme, setHalloweenTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

