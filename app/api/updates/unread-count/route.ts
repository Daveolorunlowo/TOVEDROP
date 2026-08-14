import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    const audiences = ['ALL']
    if (role === 'RIDER') audiences.push('RIDERS')
    if (role === 'DRIVER') audiences.push('DRIVERS')

    // Find all published updates for this role that do not have a read record for this user
    const unreadCount = await prisma.update.count({
      where: {
        publishedAt: { not: null },
        audience: { in: audiences as any },
        updateReads: {
          none: { userId }
        }
      }
    })

    return NextResponse.json({ count: unreadCount }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching unread updates count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
