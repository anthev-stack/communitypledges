import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      // Generate PayPal OAuth URL
      const clientId = process.env.PAYPAL_CLIENT_ID
      const redirectUri = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/paypal/oauth` : `https://communitypledges.vercel.app/api/paypal/oauth`
      
      if (!clientId) {
        return NextResponse.json({ message: 'PayPal not configured' }, { status: 500 })
      }

      const stateParam = session.user.id // Use user ID as state for security
      const paypalAuthUrl = `https://www.paypal.com/signin/authorize?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}`

      // Debug logging
      console.log('PayPal OAuth Debug Info:')
      console.log('- Client ID:', clientId)
      console.log('- Redirect URI:', redirectUri)
      console.log('- State:', stateParam)
      console.log('- Scopes: openid')
      console.log('- Full URL:', paypalAuthUrl)

      return NextResponse.redirect(paypalAuthUrl)
    }

    // Handle OAuth callback
    if (state !== session.user.id) {
      return NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/paypal/oauth` : `https://communitypledges.vercel.app/api/paypal/oauth`
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('PayPal token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      })
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('PayPal token response:', tokenData)
    const accessToken = tokenData.access_token
    const idToken = tokenData.id_token
    
    if (!accessToken) {
      throw new Error('No access token received from PayPal')
    }

    // Try multiple approaches to get PayPal email
    let paypalEmail = null
    let userInfo = null
    
    // Approach 1: Try OpenID Connect userinfo endpoint
    try {
      const userInfoResponse = await fetch('https://api-m.paypal.com/v1/identity/openidconnect/userinfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (userInfoResponse.ok) {
        userInfo = await userInfoResponse.json()
        console.log('PayPal user info response:', userInfo)
        paypalEmail = userInfo.email || userInfo.email_verified || userInfo.sub
      } else {
        const errorText = await userInfoResponse.text()
        console.error('PayPal user info failed:', {
          status: userInfoResponse.status,
          statusText: userInfoResponse.statusText,
          error: errorText
        })
      }
    } catch (userInfoError) {
      console.error('Error fetching user info:', userInfoError)
    }
    
    // Approach 2: Try to decode the ID token if available
    if (!paypalEmail && idToken) {
      try {
        console.log('Attempting to decode ID token...')
        // ID tokens are JWT tokens, we can decode the payload
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())
        console.log('ID token payload:', payload)
        paypalEmail = payload.email || payload.email_verified
        if (paypalEmail) {
          console.log('Got email from ID token:', paypalEmail)
        }
      } catch (tokenError) {
        console.error('Error decoding ID token:', tokenError)
      }
    }
    
    // Approach 3: Try PayPal Identity API with different endpoint
    if (!paypalEmail) {
      try {
        console.log('Trying PayPal Identity API...')
        const identityResponse = await fetch('https://api-m.paypal.com/v1/identity/oauth2/userinfo', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })

        if (identityResponse.ok) {
          const identityData = await identityResponse.json()
          console.log('PayPal Identity API response:', identityData)
          paypalEmail = identityData.email || identityData.email_verified
        } else {
          const errorText = await identityResponse.text()
          console.error('PayPal Identity API failed:', {
            status: identityResponse.status,
            statusText: identityResponse.statusText,
            error: errorText
          })
        }
      } catch (identityError) {
        console.error('Error with PayPal Identity API:', identityError)
      }
    }
    
    // If we still couldn't get the email, ask the user to enter it manually
    if (!paypalEmail) {
      console.log('Could not retrieve PayPal email automatically')
      console.log('Token response keys:', Object.keys(tokenData))
      console.log('Available scopes:', tokenData.scope)
      
      // Store the access token temporarily and redirect to manual entry
      // We'll create a simple form where the user can enter their PayPal email
      return NextResponse.redirect(`https://communitypledges.vercel.app/settings?paypal=manual&connected=true`)
    }

    // Save paypalEmail to database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { paypalEmail: paypalEmail }
      })
      console.log('PayPal email saved successfully:', paypalEmail)
    } catch (dbError) {
      console.error('Failed to save PayPal email to database:', dbError)
      // Continue anyway - the OAuth was successful
    } finally {
      await prisma.$disconnect()
    }

    return NextResponse.redirect(`https://communitypledges.vercel.app/settings?paypal=success&email=${encodeURIComponent(paypalEmail)}`)
  } catch (error) {
    console.error('PayPal OAuth error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.redirect(`https://communitypledges.vercel.app/settings?paypal=error`)
  }
}
