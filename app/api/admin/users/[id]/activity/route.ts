import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await context.params
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // Fetch the user to get their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch Trips (as rider or driver)
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { riderId: userId },
          { driverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        rider: { select: { name: true, email: true } },
        driver: { select: { name: true, email: true } }
      }
    })

    // Fetch Drop Transactions
    const drops = await prisma.dropTransaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Fetch Feedbacks
    const feedbacks = await prisma.feedback.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Fetch Login Audits (if there is a table for normal user logins... wait, is there?)
    // Let's check schema. We have `AdminLoginLog`, but not `UserLoginLog`. We'll skip that.

    return NextResponse.json({ trips, drops, feedbacks }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
