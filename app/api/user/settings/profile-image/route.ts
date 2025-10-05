import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const profileImage = formData.get('profileImage') as File | null

    if (!profileImage || profileImage.size === 0) {
      return NextResponse.json(
        { message: 'No image provided' },
        { status: 400 }
      )
    }

    // Get user role to determine allowed file types
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Validate file type based on user role
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const premiumTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    
    const allowedTypes = (user?.role === 'PARTNER' || user?.role === 'MODERATOR' || user?.role === 'ADMIN') 
      ? premiumTypes 
      : validTypes
    
    if (!allowedTypes.includes(profileImage.type)) {
      const allowedFormats = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')
      return NextResponse.json(
        { message: `Invalid file type. Please upload a ${allowedFormats} image.` },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (profileImage.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'File too large. Please upload an image smaller than 5MB.' },
        { status: 400 }
      )
    }

    // Convert image to base64 data URL
    const bytes = await profileImage.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${profileImage.type};base64,${base64}`

    // Update user's profile image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: dataUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile image:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



