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
      const redirectUri = `https://communitypledges.vercel.app/api/paypal/oauth`
      
      if (!clientId) {
        return NextResponse.json({ message: 'PayPal not configured' }, { status: 500 })
      }

      const stateParam = session.user.id // Use user ID as state for security
      const paypalAuthUrl = `https://www.sandbox.paypal.com/signin/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}`

      return NextResponse.redirect(paypalAuthUrl)
    }

    // Handle OAuth callback
    if (state !== session.user.id) {
      return NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
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
        redirect_uri: `https://communitypledges.vercel.app/api/paypal/oauth`
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
    const accessToken = tokenData.access_token

    // Get user info from PayPal
    const userInfoResponse = await fetch('https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('PayPal user info failed:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        error: errorText
      })
      throw new Error(`Failed to get user info from PayPal: ${userInfoResponse.status} ${errorText}`)
    }

    const userInfo = await userInfoResponse.json()
    const paypalEmail = userInfo.email

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
    return NextResponse.redirect(`https://communitypledges.vercel.app/settings?paypal=error`)
  }
}
