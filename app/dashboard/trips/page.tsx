import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Car, Clock, MapPin, Search } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'

export default async function DashboardTrips() {
 const session = await getServerSession(authOptions)
 const userId = session!.user.id

 const trips = await prisma.trip.findMany({
 where: { riderId: userId },
 orderBy: { createdAt: 'desc' }
 })

 return (
 <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-20">
 
 <div>
 <h1 className="text-2xl font-bold text-foreground mb-2">My Trips</h1>
 <p className="text-sm text-muted-foreground">View your upcoming and past rides.</p>
 </div>

 {trips.length === 0 ? (
 <div className="bg-surface-elevated border border-border rounded-xl p-10 text-center">
 <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
 <Car className="w-7 h-7 text-primary" />
 </div>
 <h3 className="text-lg font-bold text-foreground mb-2">No trips yet</h3>
 <p className="text-sm text-muted-foreground mb-6">You haven't booked any rides yet.</p>
 <Link 
 href="/book" 
 className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 transition-all"
 >
 Book your first ride
 </Link>
 </div>
 ) : (
 <div className="grid gap-4">
 {trips.map(trip => (
 <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
 <div className="bg-card border border-border rounded-xl p-5 hover:bg-surface-elevated transition-colors cursor-pointer">
 <div className="flex justify-between items-start mb-4">
 <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
 <Clock className="w-4 h-4" />
 {trip.date} at {trip.time}
 </p>
 <span className="text-xs font-bold px-2 py-1 rounded border border-border text-foreground">
 {trip.status}
 </span>
 </div>
 
 <div className="space-y-3">
 <div className="flex items-start gap-3">
 <MapPin className="w-4 h-4 text-primary mt-0.5" />
 <div>
 <p className="text-[10px] font-semibold text-muted-foreground">Pickup</p>
 <p className="text-sm font-medium text-foreground">{trip.pickup}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-[10px] font-semibold text-muted-foreground">Destination</p>
 <p className="text-sm font-medium text-foreground">{trip.destination}</p>
 </div>
 </div>
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 )
}
