import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🧪 Testing Discord OAuth database state...')
    
    // Check recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            createdAt: true
          }
        }
      }
    })
    
    console.log('📊 Recent users:', recentUsers)
    
    // Check recent accounts
    const recentAccounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    console.log('🔗 Recent accounts:', recentAccounts)
    
    return NextResponse.json({
      message: 'Discord OAuth database test completed',
      recentUsers,
      recentAccounts
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    )
  }
}
