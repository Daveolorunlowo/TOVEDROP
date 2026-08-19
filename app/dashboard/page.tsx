import Link from 'next/link'
import { MapPin, Calendar, Clock, Star, Car, Plus, X, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SignOutButton } from '@/components/sign-out-button'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'
import { TripPoller } from '@/components/trip-poller'
import { TripList } from '@/components/dashboard/TripList'

// ─── Design tokens ─────────────────────────────────────
// bg:       #111111
// surface:  #171717
// border:   1px solid #222
// divider:  #1e1e1e
// label:    11px / uppercase / tracking-[0.05em] / #555
// text:     #f5f5f5 (primary) / #888 (secondary) / #555 (muted)
// accent:   var(--orange-brand) (amber — CTA + Drops only)
// radius:   8px cards / 4px badges
// padding:  16-20px cards
// ──────────────────────────────────────────────────────

// UI components moved to TripList.tsx

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  if (session.user.role !== 'RIDER') {
    redirect(getRoleRedirectPath(session.user.role as string, session.user.driverStatus as string | null))
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/auth/login')

  const trips = await prisma.trip.findMany({
    where: { riderId: user.id },
    include: { driver: true, review: true },
    orderBy: { createdAt: 'desc' },
  })

  const upcomingTrips = trips.filter(t => t.status === 'PENDING' || t.status === 'CONFIRMED')
  const pastTrips     = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')
  const pendingIds    = upcomingTrips.filter(t => t.status === 'PENDING').map(t => t.id)
  const tripsTaken    = pastTrips.filter(t => t.status === 'COMPLETED').length

  const initials = (name: string) =>
    name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <div className="bg-background min-h-screen">
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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/referrals"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-foreground border border-border bg-card hover:bg-muted transition-colors"
            >
              Refer Friends
            </Link>
          </div>
        </div>

        {/* ── Active Trips ── */}
        <div
          className="rounded-lg mb-6 bg-card border border-border px-5 py-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4 text-muted-foreground">
            Account Stats
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-border">
            {[
              { label: 'Trips Taken',   value: String(tripsTaken) },
              { label: 'Upcoming',      value: String(upcomingTrips.length) },
              { label: 'Avg. Rating',   value: '—' },
              { label: 'Drops Balance', value: String(user.dropsBalance), accent: true },
            ].map((s, i) => (
              <div key={s.label} className={`${i > 0 ? 'pl-6' : ''} ${i < 3 ? 'pr-6' : ''}`}>
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] mb-1 text-muted-foreground">
                  {s.label}
                </p>
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: s.accent ? 'var(--orange-brand)' : 'var(--foreground)', letterSpacing: '-0.02em' }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3.5" style={{ paddingTop: user.dropsBalance === 0 ? '14px' : '10px' }}>
            {user.dropsBalance === 0 ? (
              <Link
                href="/dashboard/buy-drops"
                className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] hover:brightness-110"
                style={{ background: 'linear-gradient(to right, var(--purple-brand), var(--purple-light))' }}
              >
                You're out of Drops — Buy more to book a ride
              </Link>
            ) : (
              <Link href="/dashboard/buy-drops" className="text-[11px] font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--orange-brand)' }}>
                Buy more Drops →
              </Link>
            )}
          </div>
        </div>

        {/* ── Main grid ── */}
        <TripList initialUpcoming={upcomingTrips} initialPast={pastTrips} userId={user.id} />
      </div>
    </div>
  )
}