import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[Test Session API] Starting request...')
    
    // Get the session
    const session = await getServerSession(authOptions)
    console.log('[Test Session API] Raw session:', JSON.stringify(session, null, 2))
    
    // Check if session exists
    if (!session) {
      console.log('[Test Session API] No session found')
      return NextResponse.json(
        { 
          message: 'No session found',
          session: null,
          user: null,
          debug: 'Session is null'
        },
        { status: 401 }
      )
    }
    
    // Check if user exists in session
    if (!session.user) {
      console.log('[Test Session API] Session exists but no user')
      return NextResponse.json(
        { 
          message: 'Session exists but no user',
          session: session,
          user: null,
          debug: 'Session.user is null'
        },
        { status: 401 }
      )
    }
    
    // Check if user ID exists
    if (!session.user.id) {
      console.log('[Test Session API] User exists but no ID')
      return NextResponse.json(
        { 
          message: 'User exists but no ID',
          session: session,
          user: session.user,
          debug: 'Session.user.id is null'
        },
        { status: 401 }
      )
    }
    
    console.log('[Test Session API] Session is valid:', {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role
    })
    
    return NextResponse.json({
      message: 'Session is valid',
      session: session,
      user: session.user,
      debug: 'All checks passed'
    })
    
  } catch (error) {
    console.error('[Test Session API] Error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: 'Exception caught'
      },
      { status: 500 }
    )
  }
}
