import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: 'Valid email required' }, { status: 400 })
    }

    // Update user with PayPal email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { payoutPaypalEmail: email, payoutPaypalConnected: true }
    })
    
    console.log('PayPal email saved for user:', session.user.id, 'email:', email)

    return NextResponse.json({ 
      message: 'PayPal email saved successfully',
      payoutPaypalEmail: email
    })
  } catch (error) {
    console.error('Error saving PayPal email:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Remove PayPal email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { payoutPaypalEmail: null, payoutPaypalConnected: false }
    })
    
    console.log('PayPal email removed for user:', session.user.id)

    return NextResponse.json({ 
      message: 'PayPal email removed successfully'
    })
  } catch (error) {
    console.error('Error removing PayPal email:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
