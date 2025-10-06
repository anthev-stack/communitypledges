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
      const redirectUri = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/paypal/oauth` : `https://communitypledges.com/api/paypal/oauth`
      
      if (!clientId) {
        return NextResponse.json({ message: 'PayPal not configured' }, { status: 500 })
      }

      // Get the type parameter from the request
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') || 'payment'
      
      // Create state parameter that includes both user ID and type
      const stateData = {
        userId: session.user.id,
        type: type
      }
      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64')
      
      const paypalAuthUrl = `https://www.paypal.com/signin/authorize?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}`

      // Debug logging
      console.log('PayPal OAuth Debug Info:')
      console.log('- Client ID:', clientId)
      console.log('- Redirect URI:', redirectUri)
      console.log('- Type:', type)
      console.log('- State Data:', stateData)
      console.log('- State Param:', stateParam)
      console.log('- Scopes: openid')
      console.log('- Full URL:', paypalAuthUrl)

      return NextResponse.redirect(paypalAuthUrl)
    }

    // Handle OAuth callback
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (error) {
      console.error('Failed to decode state parameter:', error)
      return NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 })
    }
    
    if (stateData.userId !== session.user.id) {
      return NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 })
    }
    
    const type = stateData.type || 'payment'
    console.log('PayPal OAuth - decoded state:', stateData, 'type:', type)

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
        redirect_uri: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/paypal/oauth` : `https://communitypledges.com/api/paypal/oauth`
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
    let paypalUserId = null
    let userInfo = null
    
    console.log('Token data received:', {
      hasAccessToken: !!accessToken,
      hasIdToken: !!idToken,
      scopes: tokenData.scope,
      tokenType: tokenData.token_type
    })
    
    // Approach 1: Try OpenID Connect userinfo endpoint
    try {
      console.log('Trying OpenID Connect userinfo endpoint...')
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
        paypalEmail = userInfo.email || userInfo.email_verified
        paypalUserId = userInfo.sub || userInfo.user_id
        if (paypalEmail) {
          console.log('✅ Got email from userinfo:', paypalEmail)
        }
        if (paypalUserId) {
          console.log('✅ Got user ID from userinfo:', paypalUserId)
        }
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
        const parts = idToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          console.log('ID token payload:', payload)
          paypalEmail = payload.email || payload.email_verified
          paypalUserId = payload.sub || payload.user_id
          if (paypalEmail) {
            console.log('✅ Got email from ID token:', paypalEmail)
          }
          if (paypalUserId) {
            console.log('✅ Got user ID from ID token:', paypalUserId)
          }
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
          paypalUserId = identityData.sub || identityData.user_id
          if (paypalEmail) {
            console.log('✅ Got email from Identity API:', paypalEmail)
          }
          if (paypalUserId) {
            console.log('✅ Got user ID from Identity API:', paypalUserId)
          }
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
    
    // Save PayPal information to database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      // Determine if this is for payment or payout based on decoded state
      const isPayout = type === 'payout'
      console.log('PayPal OAuth - type from state:', type, 'isPayout:', isPayout)
      
      // Prepare data to save based on context
      const updateData: any = {}
      
      if (isPayout) {
        // Payout PayPal (for receiving money)
        updateData.payoutPaypalConnected = true
        updateData.payoutPaypalConnectedAt = new Date()
        
        if (paypalEmail) {
          updateData.payoutPaypalEmail = paypalEmail
          console.log('✅ Will save payout PayPal email:', paypalEmail)
        }
        
        if (paypalUserId) {
          updateData.payoutPaypalUserId = paypalUserId
          console.log('✅ Will save payout PayPal user ID:', paypalUserId)
        }
      } else {
        // Payment PayPal (for paying pledges)
        updateData.paymentPaypalConnected = true
        updateData.paymentPaypalConnectedAt = new Date()
        
        if (paypalEmail) {
          updateData.paymentPaypalEmail = paypalEmail
          console.log('✅ Will save payment PayPal email:', paypalEmail)
        }
        
        if (paypalUserId) {
          updateData.paymentPaypalUserId = paypalUserId
          console.log('✅ Will save payment PayPal user ID:', paypalUserId)
        }
      }
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData
      })
      
      console.log('✅ PayPal information saved successfully:', updateData)
      
      // Redirect based on what we got
      if (paypalEmail) {
        return NextResponse.redirect(`https://communitypledges.com/settings?paypal=success&email=${encodeURIComponent(paypalEmail)}`)
      } else if (paypalUserId) {
        return NextResponse.redirect(`https://communitypledges.com/settings?paypal=success&id=${encodeURIComponent(paypalUserId)}`)
      } else {
        // If we got neither email nor user ID, still redirect to success
        // The user can add their email manually in settings if needed
        console.log('⚠️ No email or user ID retrieved, but PayPal is connected')
        return NextResponse.redirect(`https://communitypledges.com/settings?paypal=success&connected=true`)
      }
      
    } catch (dbError) {
      console.error('❌ Failed to save PayPal information to database:', dbError)
      // Continue anyway - the OAuth was successful
      return NextResponse.redirect(`https://communitypledges.com/settings?paypal=success&manual=true`)
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('PayPal OAuth error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.redirect(`https://communitypledges.com/settings?paypal=error`)
  }
}
