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
    <div style={{ background: '#111111', minHeight: '100vh' }}>
      <TripPoller userId={user.id} />

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="min-w-0 max-w-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#555' }}>
              Rider Dashboard
            </p>
            <h1 className="text-2xl font-bold break-words" style={{ color: '#f5f5f5', letterSpacing: '-0.01em' }}>
              {user.name}
            </h1>
            {user.university && (
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>{user.university}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SignOutButton
              variant="outline"
              className="text-xs border-[#222] bg-transparent hover:bg-[#1e1e1e] rounded-md px-3 py-1.5 !text-[#555]"
            />
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-foreground hover:bg-white/5 transition-colors"
              style={{ color: '#888' }}
            >
              Settings
            </Link>
            <Link
              href="/dashboard/referrals"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-foreground border border-border"
              style={{ background: '#1e1e1e' }}
            >
              Refer Friends
            </Link>
            <Link
              href="/book"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-black"
              style={{ background: 'var(--orange-brand)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Book a Ride
            </Link>
          </div>
        </div>

        {/* ── Active Trips ── */}
        <div
          className="rounded-lg mb-6"
          style={{ background: '#171717', border: '1px solid #222', padding: '16px 20px' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: '#555' }}>
            Account Stats
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x" style={{ borderColor: '#1e1e1e' }}>
            {[
              { label: 'Trips Taken',   value: String(tripsTaken) },
              { label: 'Upcoming',      value: String(upcomingTrips.length) },
              { label: 'Avg. Rating',   value: '—' },
              { label: 'Drops Balance', value: String(user.dropsBalance), accent: true },
            ].map((s, i) => (
              <div key={s.label} className={`${i > 0 ? 'pl-6' : ''} ${i < 3 ? 'pr-6' : ''}`}>
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] mb-1" style={{ color: '#555' }}>
                  {s.label}
                </p>
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: s.accent ? 'var(--orange-brand)' : '#f5f5f5', letterSpacing: '-0.02em' }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e1e1e', marginTop: '14px', paddingTop: user.dropsBalance === 0 ? '14px' : '10px' }}>
            {user.dropsBalance === 0 ? (
              <Link
                href="/dashboard/buy-drops"
                className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-white shadow-lg transition-transform active:scale-[0.98] hover:brightness-110"
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
        <TripList initialUpcoming={upcomingTrips} initialPast={pastTrips} />
      </div>
    </div>
  )
}