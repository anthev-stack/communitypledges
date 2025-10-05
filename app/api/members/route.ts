import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[Members API] Starting request...')

    // Get all users with basic stats only
    const members = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        servers: {
          where: {
            isActive: true
          },
          select: {
            id: true
          }
        },
        _count: {
          select: {
            pledges: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[Members API] Found ${members.length} total users in database`)
    console.log('[Members API] Users found:', members.map(m => ({ id: m.id, name: m.name, role: m.role, createdAt: m.createdAt })))
    
    // Debug: Check for recent users (last 24 hours)
    const recentUsers = members.filter(m => {
      const createdAt = new Date(m.createdAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return createdAt > oneDayAgo
    })
    console.log(`[Members API] Found ${recentUsers.length} users created in last 24 hours:`, recentUsers.map(m => ({ id: m.id, name: m.name, role: m.role, createdAt: m.createdAt })))

    // Transform the data to include basic stats only
    const membersWithStats = members.map(member => ({
      id: member.id,
      name: member.name,
      image: member.image,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      serverCount: member.servers.length,
      pledgeCount: member._count.pledges
    }));

    console.log('[Members API] Transformed members:', membersWithStats.map(m => ({ id: m.id, name: m.name, role: m.role })))

    return NextResponse.json({
      success: true,
      members: membersWithStats
    });

  } catch (error) {
    console.error('[Members API] Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
