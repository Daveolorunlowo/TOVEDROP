import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Car, Clock, MapPin, ArrowRight } from 'lucide-react'

export async function OverviewTab({ userId }: { userId: string }) {
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

  // Mocking "Drops used" for now since we don't track drop expenditure explicitly by month easily without a transaction model
  // If we want exact, we'd need to query DropTransaction or just use tripsTaken. Let's use tripsTaken as drops used for simplicity, 
  // or just omit it and show trips taken.

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
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-elevated border border-border rounded-xl p-4 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Rides</p>
          <p className="text-2xl font-bold text-foreground">{tripsTaken}</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-xl p-4 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p>
          <p className="text-sm font-medium text-green-500">Active Rider</p>
        </div>
      </div>

      {/* Next Trip Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Next Upcoming Trip</h2>
          <Link href="?tab=trips" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            See all upcoming <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {nextTrip ? (
          <div id="guide-upcoming-trip" className="bg-card border border-border rounded-xl p-0 shadow-sm relative overflow-hidden">
            {isRecentlyTransferred && (
              <div className="bg-orange-brand/10 border-b border-orange-brand/20 p-4">
                <p className="text-sm font-bold text-orange-brand mb-1 flex items-center gap-1.5">
                  <span className="text-lg">⚠</span> Your driver for {nextTrip.time} has been changed
                </p>
                <p className="text-xs text-foreground mt-2 leading-relaxed">
                  <strong>{recentTransfer.fromDriver.name}</strong> transferred your trip to <strong>{nextTrip.driver?.name}</strong> due to: <span className="italic">{getReasonText(recentTransfer.reason, recentTransfer.reasonNote)}</span>
                </p>
                <div className="mt-3 pt-3 border-t border-orange-brand/10 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-xs font-semibold">New driver: {nextTrip.driver?.name}</span>
                  <span className="text-xs text-muted-foreground">{nextTrip.driver?.driverProfile?.vehicleMake} {nextTrip.driver?.driverProfile?.vehicleModel}</span>
                </div>
              </div>
            )}
            <div className="p-5">
            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {nextTrip.date} at {nextTrip.time}
                </p>
                <p id="guide-trip-status" className="text-sm font-medium text-muted-foreground w-max px-2 py-0.5 rounded-full bg-surface-elevated border border-border">
                  Status: <span className="text-foreground">{nextTrip.status}</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pickup</p>
                  <p className="text-sm font-medium text-foreground">{nextTrip.pickup}</p>
                </div>
              </div>
              <div className="w-0.5 h-4 bg-border ml-2" />
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-secondary mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Destination</p>
                  <p className="text-sm font-medium text-foreground">{nextTrip.destination}</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary/10 to-background border border-primary/20 rounded-xl p-6 text-center shadow-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No upcoming rides</h3>
            <p className="text-sm text-muted-foreground mb-5">Ready to head to class or back to your hostel?</p>
            <Link 
              id="guide-book-ride-btn"
              href="/book" 
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 transition-all"
            >
              Book your next ride
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
