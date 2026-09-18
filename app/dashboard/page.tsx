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
  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto px-4 pt-6 pb-24">
  <TripPoller userId={user.id} />

  {/* Header */}
  <div>
   <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
   {user.university && (
    <p className="text-sm mt-1 text-muted-foreground">{user.name} &bull; {user.university}</p>
   )}
  </div>

  {/* Drops Balance Card — primary hero */}
  <div className="rounded-xl bg-card border border-border p-6 space-y-5">
   <div>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
     Drops Balance
    </p>
    <div className="flex items-baseline gap-2">
     <span className="text-5xl font-black text-foreground tabular-nums tracking-tight">{user.dropsBalance}</span>
     <span className="text-sm font-medium text-muted-foreground">available</span>
    </div>
   </div>
   {user.dropsBalance === 0 ? (
    <Link
     href="/dashboard/buy-drops"
     className="flex w-full items-center justify-center py-3 px-6 rounded-lg text-sm font-bold text-primary-foreground bg-primary transition-all active:scale-[0.98] hover:opacity-90"
    >
     Buy Drops
    </Link>
   ) : (
    <Link
     href="/dashboard/buy-drops"
     className="flex w-full items-center justify-center py-3 px-6 rounded-lg text-sm font-bold transition-all bg-primary/10 hover:bg-primary/20 text-primary"
    >
     Get More Drops
    </Link>
   )}
  </div>

  {/* Quick Stats Row */}
  <div className="grid grid-cols-2 gap-3">
   <div className="bg-card border border-border rounded-xl p-5">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Rides Taken</p>
    <p className="text-4xl font-black tabular-nums text-foreground">{tripsTaken}</p>
   </div>
   <div className="bg-card border border-border rounded-xl p-5">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Account</p>
    <div className="flex items-center gap-2 mt-1">
     <span className="w-2 h-2 rounded-full bg-primary inline-block" />
     <p className="text-base font-bold text-primary">Active</p>
    </div>
   </div>
  </div>

  {/* Next Trip Section */}
  <div className="space-y-3">
   <div className="flex items-center justify-between">
    <h2 className="text-base font-bold text-foreground">Next Upcoming Trip</h2>
    <Link href="/dashboard/trips" className="text-xs font-semibold text-primary hover:opacity-80 flex items-center gap-1 transition-opacity">
     See all <ArrowRight className="w-3.5 h-3.5" />
    </Link>
   </div>

   {nextTrip ? (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
     {isRecentlyTransferred && (
      <div className="bg-primary/10 border-b border-primary/20 px-5 py-3">
       <p className="text-sm font-bold text-primary flex items-center gap-1.5">
        <span>⚠</span> Driver Changed
       </p>
       <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        <span className="text-foreground font-medium">{recentTransfer.fromDriver.name}</span> transferred your trip to{' '}
        <span className="text-foreground font-medium">{nextTrip.driver?.name}</span> — <span className="italic">{getReasonText(recentTransfer.reason, recentTransfer.reasonNote)}</span>
       </p>
      </div>
     )}

     <div className="p-5 space-y-5">
      {/* Date + Status row */}
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-2 text-primary">
        <Clock className="w-4 h-4 shrink-0" />
        <span className="text-sm font-semibold">{nextTrip.date} &nbsp;·&nbsp; {nextTrip.time}</span>
       </div>
       <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border tracking-wider uppercase ${
        nextTrip.status === 'CONFIRMED'
         ? 'bg-primary/10 text-primary border-primary/30'
         : 'bg-surface-elevated text-muted-foreground border-border'
       }`}>
        {nextTrip.status}
       </span>
      </div>

      {/* Route */}
      <div className="space-y-0">
       <div className="flex items-start gap-3 py-3 border-t border-border">
        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
         <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Pickup</p>
         <p className="text-sm font-semibold text-foreground">{nextTrip.pickup}</p>
        </div>
       </div>
       <div className="flex items-start gap-3 py-3 border-t border-border">
        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
         <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Destination</p>
         <p className="text-sm font-semibold text-foreground">{nextTrip.destination}</p>
        </div>
       </div>
      </div>

      {/* Driver info if assigned */}
      {nextTrip.driver && (
       <div className="flex items-center gap-3 pt-1 border-t border-border">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
         <Car className="w-4 h-4 text-primary" />
        </div>
        <div>
         <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Driver</p>
         <p className="text-sm font-semibold text-foreground">{nextTrip.driver.name}</p>
        </div>
       </div>
      )}
     </div>
    </div>
   ) : (
    <div className="bg-card border border-border rounded-xl p-10 text-center">
     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
      <Car className="w-6 h-6 text-primary" />
     </div>
     <h3 className="text-base font-bold text-foreground mb-1">No upcoming rides</h3>
     <p className="text-sm text-muted-foreground mb-5">Ready to head to class or back to your hostel?</p>
     <Link
      href="/book"
      className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all active:scale-[0.98]"
     >
      Book a Ride
     </Link>
    </div>
   )}
  </div>

  </div>
  )
}
