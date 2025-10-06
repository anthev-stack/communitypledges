'use client'

import { useTheme } from '@/contexts/ThemeContext'
import FlyingBats from './FlyingBats'

export default function BatsProvider() {
  const { isHalloweenTheme } = useTheme()

  return isHalloweenTheme ? <FlyingBats enabled={true} /> : null
}
