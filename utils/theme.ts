import { useTheme } from '@/contexts/ThemeContext'

export const useThemeColors = () => {
  const { isHalloweenTheme } = useTheme()
  
  return {
    primary: isHalloweenTheme ? 'orange' : 'emerald',
    primaryBg: isHalloweenTheme ? 'bg-orange-600' : 'bg-emerald-600',
    primaryBgHover: isHalloweenTheme ? 'hover:bg-orange-700' : 'hover:bg-emerald-700',
    primaryText: isHalloweenTheme ? 'text-orange-400' : 'text-emerald-400',
    primaryBgOpacity: isHalloweenTheme ? 'bg-orange-500/20' : 'bg-emerald-500/20',
    primaryRing: isHalloweenTheme ? 'focus:ring-orange-500' : 'focus:ring-emerald-500',
    primaryBorder: isHalloweenTheme ? 'border-orange-500' : 'border-emerald-500',
    success: isHalloweenTheme ? 'text-orange-400' : 'text-green-400',
    successBg: isHalloweenTheme ? 'bg-orange-500/20' : 'bg-green-500/20',
    successHover: isHalloweenTheme ? 'hover:text-orange-300' : 'hover:text-green-300',
  }
}

// Static version for use outside of React components
export const getThemeColors = (isHalloweenTheme: boolean) => {
  return {
    primary: isHalloweenTheme ? 'orange' : 'emerald',
    primaryBg: isHalloweenTheme ? 'bg-orange-600' : 'bg-emerald-600',
    primaryBgHover: isHalloweenTheme ? 'hover:bg-orange-700' : 'hover:bg-emerald-700',
    primaryText: isHalloweenTheme ? 'text-orange-400' : 'text-emerald-400',
    primaryBgOpacity: isHalloweenTheme ? 'bg-orange-500/20' : 'bg-emerald-500/20',
    primaryRing: isHalloweenTheme ? 'focus:ring-orange-500' : 'focus:ring-emerald-500',
    primaryBorder: isHalloweenTheme ? 'border-orange-500' : 'border-emerald-500',
    success: isHalloweenTheme ? 'text-orange-400' : 'text-green-400',
    successBg: isHalloweenTheme ? 'bg-orange-500/20' : 'bg-green-500/20',
    successHover: isHalloweenTheme ? 'hover:text-orange-300' : 'hover:text-green-300',
  }
}

