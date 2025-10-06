'use client'

import { useSession } from 'next-auth/react'
import FlyingBats from './FlyingBats'

export default function BatsProvider() {
  const { data: session } = useSession()
  
  // Only show bats if user is logged in and has bats enabled
  const shouldShowBats = session?.user?.batsEnabled === true
  
  return <FlyingBats enabled={shouldShowBats} />
}
