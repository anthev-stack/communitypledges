import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTokenWithExpiration } from '@/lib/auth-utils'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true
      }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json({ 
        message: 'Please verify your email address before requesting a password reset.' 
      }, { status: 400 })
    }

    // Generate password reset token
    const { token, expires } = generateTokenWithExpiration(1) // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires
      }
    })

    // Send password reset email
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
      await sendPasswordResetEmail({
        userName: user.name || 'User',
        userEmail: user.email,
        resetUrl
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json({ 
        message: 'Failed to send password reset email. Please try again.' 
      }, { status: 500 })
    }

    // Log the password reset request
    await prisma.activityLog.create({
      data: {
        type: 'password_reset_requested',
        message: 'Password reset requested',
        userId: user.id
      }
    })

    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
