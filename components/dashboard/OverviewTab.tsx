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
      include: { driver: true },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })
  ])

  // Mocking "Drops used" for now since we don't track drop expenditure explicitly by month easily without a transaction model
  // If we want exact, we'd need to query DropTransaction or just use tripsTaken. Let's use tripsTaken as drops used for simplicity, 
  // or just omit it and show trips taken.
  
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
          <Link href="?tab=trips" className="text-xs font-semibold text-orange-brand hover:underline flex items-center gap-1">
            See all upcoming <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {nextTrip ? (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-brand" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-orange-brand mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {nextTrip.date} at {nextTrip.time}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
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
        ) : (
          <div className="bg-gradient-to-br from-purple-900/40 to-background border border-purple-500/30 rounded-xl p-6 text-center shadow-md">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No upcoming rides</h3>
            <p className="text-sm text-muted-foreground mb-5">Ready to head to class or back to your hostel?</p>
            <Link 
              href="/book" 
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-brand text-primary-foreground hover:brightness-110 transition-all"
            >
              Book your next ride
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
