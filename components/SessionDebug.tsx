'use client'

import { useSession } from 'next-auth/react'

export default function SessionDebug() {
  const { data: session, status } = useSession()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div className="space-y-1">
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Session exists:</strong> {session ? 'Yes' : 'No'}</div>
        {session && (
          <>
            <div><strong>User exists:</strong> {session.user ? 'Yes' : 'No'}</div>
            {session.user && (
              <>
                <div><strong>User ID:</strong> {session.user.id || 'Missing'}</div>
                <div><strong>User Email:</strong> {session.user.email || 'Missing'}</div>
                <div><strong>User Name:</strong> {session.user.name || 'Missing'}</div>
                <div><strong>User Role:</strong> {session.user.role || 'Missing'}</div>
              </>
            )}
          </>
        )}
        <div className="mt-2 p-2 bg-gray-800 rounded">
          <strong>Raw Session:</strong>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
