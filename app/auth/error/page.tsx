'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, MessageCircle, UserPlus } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Error',
          message: 'There is a problem with the server configuration.',
          suggestion: 'Please try again later or contact support if the problem persists.'
        }
      case 'AccessDenied':
        return {
          title: 'Account Not Found',
          message: 'This Discord account is not registered with CommunityPledges.',
          suggestion: 'Would you like to create a new account?'
        }
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'The verification token has expired or is invalid.',
          suggestion: 'Please try signing in again.'
        }
      case 'Default':
      default:
        return {
          title: 'Sign In Error',
          message: 'Something went wrong during sign in.',
          suggestion: 'Please try again or contact support if the problem persists.'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-300 hover:text-emerald-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {errorInfo.title}
            </h2>
            <p className="text-gray-300 mb-6">
              {errorInfo.message}
            </p>
            <p className="text-sm text-gray-400 mb-8">
              {errorInfo.suggestion}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {error === 'AccessDenied' && (
            <>
              <Link
                href="/auth/signup"
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create New Account
              </Link>
              
              <Link
                href="/auth/login"
                className="w-full flex justify-center items-center px-4 py-3 border border-slate-600 rounded-lg shadow-sm bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Try Discord Sign In Again
              </Link>
            </>
          )}
          
          {error !== 'AccessDenied' && (
            <>
              <Link
                href="/auth/login"
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                Try Sign In Again
              </Link>
              
              <Link
                href="/auth/signup"
                className="w-full flex justify-center items-center px-4 py-3 border border-slate-600 rounded-lg shadow-sm bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                Create New Account
              </Link>
            </>
          )}
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help?{' '}
            <Link
              href="/contact"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
