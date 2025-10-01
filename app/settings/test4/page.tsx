'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TestSettingsPage4() {
  const { data: session, status } = useSession()
  const [test, setTest] = useState('Loading...')

  useEffect(() => {
    setTest('Settings page WITHOUT Stripe component loaded successfully!')
  }, [])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page 4</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">No Stripe Component</h2>
        <p className="text-gray-300">This page doesn't import Stripe at all.</p>
      </div>
    </div>
  )
}
