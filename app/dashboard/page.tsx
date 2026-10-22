import Link from 'next/link'
import { MapPin, Calendar, Clock, Star, Car, Plus, X, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TripList } from '@/components/dashboard/TripList'

// ─── Design tokens ─────────────────────────────────────
// bg:       var(--background)
// surface:  var(--surface-card)
// border:   1px solid var(--border-default)
// divider:  var(--border)
// label:    11px / uppercase / tracking-[0.05em] / #555
// text:     var(--foreground) (primary) / #888 (secondary) / #555 (muted)
// accent:   var(--orange-brand) (amber — CTA + Drops only)
// radius:   8px cards / 4px badges
// padding:  16-20px cards
// ──────────────────────────────────────────────────────

// UI components moved to TripList.tsx

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  const userId = session.user.id || (session.user.email ? (await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  }))?.id : null)

  if (!userId) redirect('/auth')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/auth')

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
    <div style={{ minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 md:py-8 landscape:py-3">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-5 sm:mb-7 landscape:mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1 text-white/90 drop-shadow-sm">
              Rider Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold truncate text-white drop-shadow-sm" style={{ letterSpacing: '-0.01em' }}>
              {user.name}
            </h1>
            {user.university && (
              <p className="text-xs mt-0.5 truncate text-white/85 font-medium drop-shadow-sm">{user.university}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
          </div>
        </div>

        {/* ── Stats card ── */}
        <div
          className="rounded-xl mb-6 shadow-lg backdrop-blur-md transition-all"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', padding: '16px 20px' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Account Stats
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x" style={{ borderColor: 'var(--border)' }}>
            {[
              { label: 'Trips Taken',   value: String(tripsTaken) },
              { label: 'Upcoming',      value: String(upcomingTrips.length) },
              { label: 'Avg. Rating',   value: '—' },
              { label: 'Drops Balance', value: String(user.dropsBalance ?? 0), accent: true },
            ].map((s, i) => (
              <div key={s.label} className={`${i > 0 ? 'pl-6' : ''} ${i < 3 ? 'pr-6' : ''}`}>
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--muted-foreground)' }}>
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
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: (user.dropsBalance ?? 0) === 0 ? '14px' : '10px' }}>
            {(user.dropsBalance ?? 0) === 0 ? (
              <Link
                href="/dashboard/buy-drops"
                className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-foreground shadow-lg transition-transform active:scale-[0.98] hover:brightness-110"
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
