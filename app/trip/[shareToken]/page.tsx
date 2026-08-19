import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { Car, Star, MapPin, Calendar, Clock, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Ensure this page is never indexed by search engines
export const metadata: Metadata = {
  title: 'TOVEDROP Safety Share',
  robots: { index: false, follow: false }
}

export default async function TripSharePage({ params }: { params: { shareToken: string } }) {
  const { shareToken } = params

  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: {
      rider: { select: { name: true } },
      driver: { select: { name: true } },
    }
  })

  // We need to fetch driverProfile separately since Prisma relation goes from User -> DriverProfile, 
  // and we only included driver (User) above. Let's do it in a safe way.
  let driverProfile = null
  if (trip?.driverId) {
    driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: trip.driverId }
    })
  }

  const isInactive = () => {
    if (!trip) return true
    if (trip.status === 'CANCELLED') return true
    if (trip.status === 'COMPLETED') {
      const scheduledAt = new Date(`${trip.date} ${trip.time}`).getTime()
      const now = Date.now()
      // Expire 24 hours after scheduled time
      if (now - scheduledAt > 24 * 60 * 60 * 1000) return true
    }
    return false
  }

  if (isInactive()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid var(--border)' }}>
            <ShieldCheck className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Link Inactive</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            This trip link is no longer active. It may have been cancelled, or the trip was completed over 24 hours ago.
          </p>
        </div>
      </div>
    )
  }

  // At this point trip exists and is active (either CONFIRMED or COMPLETED within 24h)
  const riderFirstName = trip?.rider?.name ? trip.rider.name.split(' ')[0] : 'A rider'
  const driverInitials = trip?.driver?.name ? trip.driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  
  const rating = driverProfile && driverProfile.rating > 0 
    ? driverProfile.rating.toFixed(1)
    : 'New'

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <ShieldCheck className="w-6 h-6" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            {riderFirstName} is on a ride
          </h1>
          <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
            Trip {trip?.status === 'COMPLETED' ? 'Completed' : 'Confirmed'}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          
          {/* Driver Info */}
          <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>Driver & Vehicle Details</p>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 shrink-0 border" style={{ borderColor: 'var(--border-default)' }}>
                <AvatarFallback className="text-sm font-bold" style={{ background: '#111', color: 'var(--foreground)' }}>
                  {driverInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-bold truncate" style={{ color: 'var(--foreground)' }}>
                    {trip?.driver?.name || 'Unknown Driver'}
                  </h2>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(217,119,6,0.1)' }}>
                    <Star className="w-3 h-3" style={{ color: 'var(--orange-brand)' }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--orange-brand)' }}>{rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                  Verified Driver
                </div>
              </div>
            </div>
            
            {/* Vehicle Details */}
            {driverProfile && (
              <div className="mt-5 rounded-lg p-3.5 flex items-center gap-3" style={{ background: 'var(--background)', border: '1px solid #1e1e1e' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <Car className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                      {driverProfile.vehicleColor} {driverProfile.vehicleMake} {driverProfile.vehicleModel}
                    </p>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 rounded-md" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
                    <p className="text-xs font-mono font-bold tracking-widest uppercase" style={{ color: 'var(--foreground)' }}>
                      {driverProfile.vehiclePlate}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route Info */}
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>Route & Time</p>
            <div className="relative pl-6 space-y-4">
              {/* Vertical line connecting dots */}
              <div className="absolute top-2.5 bottom-2.5 left-2.5 w-[2px] rounded-full" style={{ background: 'var(--card)' }} />
              
              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-subtle)' }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Pickup</p>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{trip?.pickup}</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--orange-brand)' }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Destination</p>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{trip?.destination}</p>
              </div>
            </div>

            <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{trip?.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{trip?.time}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-center px-4" style={{ color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
          This is a read-only safety link shared by a TOVEDROP rider. <br/>
          TOVEDROP is a university ride connection platform for Bowen University.
        </p>

      </div>
    </div>
  )
}
