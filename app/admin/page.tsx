import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth')
  }

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const [
    totalUsers, totalDrivers, totalTrips, completedTrips,
    platformRevenueThisMonth, recentTripsRaw, recentDropsRaw
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'RIDER' } }),
    prisma.user.count({ where: { role: 'DRIVER' } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { status: 'COMPLETED' } }),
    prisma.platformRevenue.aggregate({
      where: { createdAt: { gte: firstDayOfMonth } },
      _sum: { amount: true }
    }),
    prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, createdAt: true, status: true, rider: { select: { name: true } } }
    }),
    prisma.dropTransaction.findMany({
      where: { type: 'PURCHASE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, createdAt: true, amount: true, user: { select: { name: true } } }
    })
  ])

  const recentActivity = [
    ...recentTripsRaw.map(t => ({
      id: `trip-${t.id}`,
      type: 'TRIP',
      title: `Ride ${t.status.toLowerCase()}`,
      desc: t.rider ? `${t.rider.name} requested a ride` : 'Ride requested',
      time: t.createdAt
    })),
    ...recentDropsRaw.map(d => ({
      id: `drop-${d.id}`,
      type: 'DROP_PURCHASE',
      title: 'Drops Purchased',
      desc: d.user ? `${d.user.name} bought ${d.amount} drops` : `User bought drops`,
      time: d.createdAt
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10)

  const overviewStats = {
    stats: {
      totalUsers, totalDrivers, totalTrips, completedTrips,
      platformRevenue: platformRevenueThisMonth._sum.amount || 0
    },
    recentActivity
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-5 py-10 relative">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Admin Portal</h1>
      <p className="text-muted mb-8">Platform overview and recent activity.</p>

      <AdminOverviewTab stats={overviewStats.stats} recentActivity={overviewStats.recentActivity} />
    </main>
  )
}
