import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isTokenExpired, hashPassword } from '@/lib/auth-utils'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date() // Token not expired
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (user.passwordResetExpires && isTokenExpired(user.passwordResetExpires)) {
      return NextResponse.json(
        { message: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })

    // Log the password reset
    await prisma.activityLog.create({
      data: {
        type: 'password_reset_completed',
        message: 'Password reset completed successfully',
        userId: user.id
      }
    })

    return NextResponse.json({ 
      message: 'Password reset successfully! You can now log in with your new password.' 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify token validity
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      )
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date() // Token not expired
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      valid: true,
      user: {
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
