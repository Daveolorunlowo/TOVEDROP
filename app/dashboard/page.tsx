import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Car, Clock, MapPin, ArrowRight } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { TripPoller } from '@/components/trip-poller'

export const dynamic = 'force-dynamic'

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  // Fetch stats and the next upcoming trip
  const [tripsTaken, nextTrip] = await Promise.all([
    prisma.trip.count({
      where: { riderId: userId, status: 'COMPLETED' }
    }),
    prisma.trip.findFirst({
      where: { 
        riderId: userId, 
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: { 
        driver: { include: { driverProfile: true } },
        tripTransfers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { fromDriver: { select: { name: true } } }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })
  ])

  const recentTransfer = nextTrip?.tripTransfers?.[0]
  const isRecentlyTransferred = recentTransfer?.status === 'ACCEPTED'

  function getReasonText(reason: string, note?: string | null) {
    const map: any = {
      VEHICLE_BREAKDOWN: "Vehicle breakdown",
      FAMILY_EMERGENCY: "Family emergency",
      MEDICAL_EMERGENCY: "Medical emergency",
      FUEL_ISSUE: "Fuel shortage",
      STUCK_IN_TRAFFIC: "Unavoidably delayed",
      PERSONAL_EMERGENCY: "Personal emergency",
      OTHER: note || "Unforeseen circumstances"
    }
    return map[reason] || "Unforeseen circumstances"
  }
  
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 max-w-5xl mx-auto pb-20">
      <TripPoller userId={user.id} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <h1 className="text-2xl font-bold break-words text-foreground" style={{ letterSpacing: '-0.01em' }}>
            Welcome back, {user.name}
          </h1>
          {user.university && (
            <p className="text-xs mt-1 text-muted-foreground">{user.university}</p>
          )}
        </div>
      </div>

      {/* Persistent Drops Balance Card */}
      <div className="rounded-2xl bg-surface-elevated border border-border px-6 py-6 shadow-sm">
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
                Buy more Drops
              </Link>
            ) : (
              <Link 
                href="/dashboard/buy-drops" 
                className="flex w-full sm:w-auto items-center justify-center py-2.5 px-5 rounded-lg text-sm font-bold transition-all bg-primary/10 hover:bg-primary/20 text-primary"
              >
                Get More Drops
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-elevated border border-border rounded-xl p-5 flex flex-col justify-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total Rides Taken</p>
          <p className="text-3xl font-bold text-foreground">{tripsTaken}</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-xl p-5 flex flex-col justify-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Account Status</p>
          <p className="text-lg font-bold text-green-500">Active</p>
        </div>
      </div>

      {/* Next Trip Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Next Upcoming Trip</h2>
          <Link href="/dashboard/trips" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {nextTrip ? (
          <div className="bg-card border border-border rounded-xl p-0 shadow-sm overflow-hidden">
            {isRecentlyTransferred && (
              <div className="bg-orange-brand/10 border-b border-orange-brand/20 p-4">
                <p className="text-sm font-bold text-orange-brand mb-1 flex items-center gap-1.5">
                  <span className="text-lg">⚠</span> Driver Changed
                </p>
                <p className="text-xs text-foreground mt-2 leading-relaxed">
                  <strong>{recentTransfer.fromDriver.name}</strong> transferred your trip to <strong>{nextTrip.driver?.name}</strong> due to: <span className="italic">{getReasonText(recentTransfer.reason, recentTransfer.reasonNote)}</span>
                </p>
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {nextTrip.date} at {nextTrip.time}
                  </p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-elevated border border-border">
                    {nextTrip.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Pickup</p>
                    <p className="text-base font-medium text-foreground">{nextTrip.pickup}</p>
                  </div>
                </div>
                <div className="w-0.5 h-6 bg-border ml-2.5" />
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Destination</p>
                    <p className="text-base font-medium text-foreground">{nextTrip.destination}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-border rounded-xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
               <Car className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No upcoming rides</h3>
            <p className="text-sm text-muted-foreground mb-6">Ready to head to class or back to your hostel?</p>
            <Link 
              href="/book" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 transition-all"
            >
              Book your next ride
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
