import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import Link from 'next/link'
import { ArrowLeft, MapPin, Navigation, Calendar, Clock } from 'lucide-react'

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/api/auth/signin')

  const tripId = params.id
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: { select: { id: true, name: true, phone: true } },
      driver: { select: { id: true, name: true, phone: true } },
      messages: {
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!trip) redirect('/dashboard')

  const isRider = trip.riderId === session.user.id
  const isDriver = trip.driverId === session.user.id

  if (!isRider && !isDriver) redirect('/dashboard')

  const otherUser = isRider ? trip.driver : trip.rider

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trip Details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Trip Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pickup</p>
                    <p className="text-sm font-medium">{trip.pickup}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Destination</p>
                    <p className="text-sm font-medium">{trip.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</p>
                    <p className="text-sm font-medium">{trip.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time</p>
                    <p className="text-sm font-medium">{trip.time}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                {isRider ? 'Driver Info' : 'Rider Info'}
              </h2>
              {otherUser ? (
                <div>
                  <p className="font-semibold text-foreground">{otherUser.name}</p>
                  {/* Phone should only be visible when trip is confirmed, which it usually is if chat is open */}
                  {(trip.status === 'CONFIRMED' || trip.status === 'COMPLETED') && otherUser.phone && (
                    <p className="text-sm text-muted-foreground mt-1">{otherUser.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Searching for driver...</p>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-2">
            {(trip.status === 'CONFIRMED' || trip.status === 'COMPLETED' || trip.status === 'PENDING') && otherUser ? (
              <ChatInterface 
                tripId={trip.id}
                currentUserId={session.user.id}
                initialMessages={trip.messages as any}
                driverArrivedAt={trip.driverArrivedAt}
                isDriver={isDriver}
              />
            ) : (
              <div className="h-[500px] border border-border rounded-xl bg-surface-card flex flex-col items-center justify-center p-6 text-center">
                <p className="font-semibold text-lg text-foreground mb-2">Chat not available</p>
                <p className="text-sm text-muted-foreground">
                  You can chat with the other party once the trip is confirmed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
