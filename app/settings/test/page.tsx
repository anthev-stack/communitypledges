'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TestSettingsPage() {
  const { data: session, status } = useSession()
  const [test, setTest] = useState('Loading...')

  useEffect(() => {
    setTest('Settings page loaded successfully!')
  }, [])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
    </div>
  )
}
