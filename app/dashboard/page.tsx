import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'
import { TripPoller } from '@/components/trip-poller'
import { DashboardTabs } from '@/components/dashboard/Tabs'
import { Suspense } from 'react'

// Tab Components (to be created)
import { OverviewTab } from '@/components/dashboard/OverviewTab'
import { MyTripsTab } from '@/components/dashboard/MyTripsTab'
import { DropsHistoryTab } from '@/components/dashboard/DropsHistoryTab'

export default async function DashboardPage(props: { searchParams: Promise<{ tab?: string, subtab?: string, page?: string, filter?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  if (session.user.role !== 'RIDER') {
    redirect(getRoleRedirectPath(session.user.role as string, session.user.driverStatus as string | null))
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/auth')

  const tab = searchParams.tab || 'overview'

  return (
    <div className="bg-background min-h-screen pb-20">
      <TripPoller userId={user.id} />

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="min-w-0 max-w-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1 text-muted-foreground">
              Rider Dashboard
            </p>
            <h1 className="text-2xl font-bold break-words text-foreground" style={{ letterSpacing: '-0.01em' }}>
              {user.name}
            </h1>
            {user.university && (
              <p className="text-xs mt-0.5 text-muted-foreground">{user.university}</p>
            )}
          </div>
        </div>

        {/* ── Persistent Drops Balance Card ── */}
        <div id="guide-drops-card" className="rounded-2xl mb-8 bg-surface-elevated border border-border px-6 py-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-2 text-muted-foreground">
                Drops Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-primary tracking-tight">{user.dropsBalance}</span>
                <span className="text-sm font-medium text-muted-foreground">Drops available</span>
              </div>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              {user.dropsBalance === 0 ? (
                <Link
                  href="/dashboard/buy-drops"
                  className="flex w-full sm:w-auto items-center justify-center py-3 px-6 rounded-xl text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] hover:brightness-110"
                  style={{ background: 'linear-gradient(to right, var(--purple-brand), var(--purple-light))' }}
                >
                  Buy more Drops to book rides
                </Link>
              ) : (
                <Link 
                  href="/dashboard/buy-drops" 
                  className="flex w-full sm:w-auto items-center justify-center py-2.5 px-5 rounded-lg text-xs font-bold transition-all hover:bg-primary/10 border border-primary/20 text-primary"
                >
                  Get More Drops
                </Link>
              )}
            </div>
          </div>
        </div>


        {/* ── Tabs Navigation ── */}
        <DashboardTabs />

        {/* ── Tab Content ── */}
        <Suspense fallback={
          <div className="py-10 flex flex-col gap-4">
            <div className="h-32 bg-muted/20 animate-pulse rounded-xl" />
            <div className="h-32 bg-muted/20 animate-pulse rounded-xl" />
          </div>
        } key={tab + (searchParams.page || '') + (searchParams.subtab || '')}>
          {tab === 'overview' && <OverviewTab userId={user.id} />}
          {tab === 'trips' && <MyTripsTab userId={user.id} searchParams={searchParams} />}
          {tab === 'history' && <DropsHistoryTab userId={user.id} searchParams={searchParams} />}
        </Suspense>

      </div>
    </div>
  )
}