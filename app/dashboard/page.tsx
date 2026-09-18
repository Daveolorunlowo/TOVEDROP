import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Car, Clock, MapPin, ArrowRight, Zap, CheckCircle2, ChevronRight } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { TripPoller } from '@/components/trip-poller'
import { CountUp } from '@/components/dashboard/CountUp'

export const dynamic = 'force-dynamic'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(name: string) {
  return name?.split(' ')[0] ?? name
}

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  const [tripsTaken, nextTrip] = await Promise.all([
    prisma.trip.count({ where: { riderId: userId, status: 'COMPLETED' } }),
    prisma.trip.findFirst({
      where: { riderId: userId, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: {
        driver: { include: { driverProfile: true } },
        tripTransfers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { fromDriver: { select: { name: true } } }
        }
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    })
  ])

  const recentTransfer = nextTrip?.tripTransfers?.[0]
  const isRecentlyTransferred = recentTransfer?.status === 'ACCEPTED'

  const reasonMap: Record<string, string> = {
    VEHICLE_BREAKDOWN: 'Vehicle breakdown',
    FAMILY_EMERGENCY: 'Family emergency',
    MEDICAL_EMERGENCY: 'Medical emergency',
    FUEL_ISSUE: 'Fuel shortage',
    STUCK_IN_TRAFFIC: 'Unavoidably delayed',
    PERSONAL_EMERGENCY: 'Personal emergency',
    OTHER: recentTransfer?.reasonNote || 'Unforeseen circumstances',
  }

  return (
    <div className="min-h-screen bg-background">
      <TripPoller userId={user.id} />

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Subtle radial purple glow behind hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, var(--brand-primary) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-6">
          {/* Greeting */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
              {getFirstName(user.name)}
            </h1>
            {user.university && (
              <p className="text-sm text-muted-foreground mt-1">{user.university}</p>
            )}
          </div>

          {/* ── DROPS HERO CARD ─────────────────────────────────── */}
          <div
            className="relative rounded-2xl overflow-hidden border border-border bg-card p-6 mb-4"
            style={{ boxShadow: '0 0 0 1px rgba(168,85,247,0.08), 0 4px 24px rgba(0,0,0,0.3)' }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
              style={{ background: 'linear-gradient(to right, transparent, var(--brand-primary), transparent)' }}
            />

            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Drops Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
                    <CountUp target={user.dropsBalance} />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">drops</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
            </div>

            {user.dropsBalance === 0 ? (
              <Link
                href="/dashboard/buy-drops"
                className="flex w-full items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-primary transition-all active:scale-[0.98] hover:opacity-90"
              >
                Buy Drops <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard/buy-drops"
                className="flex w-full items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold transition-all bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20"
              >
                Get More Drops <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* ── STAT PAIR ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {/* Rides stat — wide feel */}
            <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute bottom-0 right-0 w-16 h-16 rounded-full opacity-[0.04]"
                style={{ background: 'var(--brand-primary)', transform: 'translate(25%, 25%)' }}
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Rides Taken
              </p>
              <p className="text-4xl font-black tabular-nums text-foreground leading-none">
                <CountUp target={tripsTaken} />
              </p>
            </div>

            {/* Account status */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Account
              </p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-base font-bold text-primary">Active</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Verified rider</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEXT TRIP SECTION ──────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pb-28">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Next Trip
          </h2>
          <Link
            href="/dashboard/trips"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
          >
            All trips <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {nextTrip ? (
          <div
            className="rounded-2xl bg-card border border-border overflow-hidden"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}
          >
            {/* Transfer warning */}
            {isRecentlyTransferred && (
              <div className="bg-primary/8 border-b border-primary/15 px-5 py-3.5">
                <p className="text-xs font-bold text-primary flex items-center gap-2 mb-0.5">
                  <span>⚠</span> Driver Changed
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">{recentTransfer?.fromDriver.name}</span>
                  {' '}transferred your trip to{' '}
                  <span className="text-foreground font-semibold">{nextTrip.driver?.name}</span>
                  {' '}— <span className="italic">{reasonMap[recentTransfer?.reason ?? 'OTHER']}</span>
                </p>
              </div>
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-sm font-semibold">{nextTrip.date} · {nextTrip.time}</span>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase ${
                nextTrip.status === 'CONFIRMED'
                  ? 'bg-primary/12 text-primary'
                  : 'bg-surface-elevated text-muted-foreground'
              }`}>
                {nextTrip.status}
              </span>
            </div>

            {/* Route */}
            <div className="px-5 py-1">
              <div className="flex items-start gap-4 py-4 border-b border-border">
                <div className="flex flex-col items-center pt-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-px flex-1 bg-border mt-1 mb-1 h-8" />
                  <div className="w-2 h-2 rounded-full border-2 border-muted-foreground" />
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Pickup</p>
                    <p className="text-sm font-bold text-foreground">{nextTrip.pickup}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Destination</p>
                    <p className="text-sm font-bold text-foreground">{nextTrip.destination}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver row */}
            {nextTrip.driver ? (
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Driver</p>
                    <p className="text-sm font-bold text-foreground">{nextTrip.driver.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-primary">On the way</span>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                <span className="text-xs font-medium">Waiting for a driver to accept…</span>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-2xl bg-card border border-border p-10 text-center">
            <div
              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
            >
              <Car className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No rides coming up</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[200px] mx-auto leading-relaxed">
              Ready to head to class or back to your hostel?
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Book a Ride <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
