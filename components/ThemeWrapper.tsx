'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface ThemeWrapperProps {
  children: React.ReactNode
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { isHalloweenTheme } = useTheme()

  return (
    <div className={`min-h-screen flex flex-col ${
      isHalloweenTheme 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900' 
        : 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900'
    }`}>
      {children}
    </div>
  )
}

