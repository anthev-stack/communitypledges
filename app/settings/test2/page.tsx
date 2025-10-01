'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/contexts/NotificationContext'

export default function TestSettingsPage2() {
  const { data: session, status } = useSession()
  const { addNotification } = useNotifications()
  const [test, setTest] = useState('Loading...')

  useEffect(() => {
    setTest('Settings page with notifications loaded successfully!')
    addNotification({
      type: 'success',
      title: 'Test',
      message: 'This is a test notification',
      duration: 3000
    })
  }, [addNotification])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Settings Page 2</h1>
      <p className="text-gray-300">Status: {test}</p>
      <p className="text-gray-300">User: {session.user?.email}</p>
    </div>
  )
}
