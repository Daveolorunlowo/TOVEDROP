import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'

import { DashboardTabs } from '@/components/dashboard/Tabs'
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'
import { AdminDriversTab } from '@/components/admin/AdminDriversTab'
import { AdminLegacyClient } from '@/components/admin/AdminLegacyClient'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default async function AdminPage(props: {
  searchParams: Promise<{ tab?: string, page?: string, q?: string, status?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth')
  }

  const tab = searchParams.tab || 'overview'

  // Only fetch overview stats if we're on the overview tab
  let overviewStats = null
  if (tab === 'overview') {
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

    overviewStats = {
      stats: {
        totalUsers, totalDrivers, totalTrips, completedTrips,
        platformRevenue: platformRevenueThisMonth._sum.amount || 0
      },
      recentActivity
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-deep text-primary">
      {/* ── Fixed Sidebar ── */}
      <AdminSidebar activeTab={tab} />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none z-0" />
        
        {/* ── Fixed Header ── */}
        <AdminHeader adminName={session.user.name || 'Admin'} />

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={
              <div className="py-10 flex flex-col gap-4">
                <div className="h-32 bg-muted/10 animate-pulse rounded-xl" />
                <div className="h-64 bg-muted/10 animate-pulse rounded-xl" />
              </div>
          } key={tab + (searchParams.page || '') + (searchParams.q || '') + (searchParams.status || '')}>
            
            {tab === 'overview' && overviewStats && (
              <AdminOverviewTab stats={overviewStats.stats} recentActivity={overviewStats.recentActivity} />
            )}
            
            {tab === 'users' && (
              <AdminUsersTab searchParams={searchParams} />
            )}
            
            {tab === 'drivers' && (
              <AdminDriversTab searchParams={searchParams} />
            )}

            {/* Un-migrated tabs rendered via legacy client */}
            {['finances', 'reports', 'feedback', 'security'].includes(tab) && (
              <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden shadow-lg p-0 relative">
                <div className="absolute inset-0 z-0 bg-red-500/5 opacity-50 pointer-events-none mix-blend-overlay"></div>
                <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-sm font-semibold text-red-500">
                  Legacy View: Note that the sidebar below is being phased out.
                </div>
                {/* We pass the tab down to the legacy client so it initializes on the right sub-view */}
                <div className="h-[800px] overflow-auto">
                  <AdminLegacyClient initialTab={tab === 'finances' ? 'finances' : tab} />
                </div>
              </div>
            )}
            
          </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
