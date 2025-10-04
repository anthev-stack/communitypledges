import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@/lib/auth-utils'
import { signIn } from 'next-auth/react'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=Invalid confirmation link`)
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date() // Token not expired
        }
      }
    })

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=Invalid or expired confirmation link`)
    }

    // Check if token is expired
    if (user.emailVerificationExpires && isTokenExpired(user.emailVerificationExpires)) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=Confirmation link has expired`)
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?message=Email already confirmed`)
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    })

    // Log the confirmation
    await prisma.activityLog.create({
      data: {
        type: 'email_verified',
        message: 'Email address confirmed successfully',
        userId: user.id
      }
    })

    // Redirect to login with success message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?message=Email confirmed successfully! You can now log in.`)

  } catch (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=An error occurred during confirmation`)
  }
}
