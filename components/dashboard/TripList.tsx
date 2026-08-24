'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Star, Car, TrendingUp, Share, Copy, Check, MessageSquare, MapPin, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { useBookRideNavigation } from '@/hooks/useBookRideNavigation'
import { ChatModal } from '@/components/chat-modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { SpotifyPlayer } from '@/components/trip/SpotifyPlayer'
import { pusherClient } from '@/lib/pusher-client'

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'var(--orange-brand)',
    CONFIRMED: '#22c55e',
    COMPLETED: '#555',
    CANCELLED: '#ef4444',
  }
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: colors[status] ?? '#555' }}
    />
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'Pending',   color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.1)' },
    CONFIRMED: { label: 'Confirmed', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    COMPLETED: { label: 'Completed', color: 'var(--muted-foreground)',    bg: '#1e1e1e' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  }
  const s = map[status] ?? { label: status, color: 'var(--muted-foreground)', bg: '#1e1e1e' }
  return (
    <span
      className="inline-block text-[10px] font-medium px-1.5 py-0.5"
      style={{ background: s.bg, color: s.color, borderRadius: '4px' }}
    >
      {s.label}
    </span>
  )
}

const initials = (name: string) =>
  name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?'

export function TripList({
  initialUpcoming,
  initialPast,
  userId
}: {
  initialUpcoming: any[],
  initialPast: any[],
  userId: string
}) {
  const [upcomingTrips, setUpcomingTrips] = useState(initialUpcoming)
  const [pastTrips, setPastTrips] = useState(initialPast)
  const [processing, setProcessing] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState<string | null>(null) // holds trip.shareToken
  const [activeChatTrip, setActiveChatTrip] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)
  const handleBookRideClick = useBookRideNavigation()
  const [activeDrivers, setActiveDrivers] = useState<any[]>([])
  const [tripToCancel, setTripToCancel] = useState<string | null>(null)

  // Subscribe to driver locations if we have a pending trip
  useEffect(() => {
    const hasPending = upcomingTrips.some(t => t.status === 'PENDING');
    if (!hasPending) return;

    if (!pusherClient) return;
    const channel = pusherClient.subscribe('global-driver-locations')
    
    channel.bind('location-update', (data: any) => {
      // Only track online drivers who are not already on a trip
      if (data.status === 'ON_TRIP') return;
      
      setActiveDrivers(prev => {
        const existing = prev.filter(d => d.driverId !== data.driverId);
        return [...existing, { ...data, timestamp: Date.now() }];
      })
    })

    return () => {
      channel.unbind('location-update')
      pusherClient?.unsubscribe('global-driver-locations')
    }
  }, [upcomingTrips])

  // Cleanup stale drivers
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDrivers(prev => prev.filter(d => Date.now() - d.timestamp < 60000));
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Custom styled Toast/Alert fallback if we don't have a toast library available
  // In a real app we'd use sonner or similar.
  const showToast = (msg: string) => {
    alert(msg) // Placeholder for toast, you can replace with a real toast
  }

  const handleCancel = async (tripId: string) => {
    setTripToCancel(null)
    
    // 1. Snapshot
    const prevUpcoming = [...upcomingTrips]
    const prevPast = [...pastTrips]
    
    // 2. Optimistic UI
    const targetTrip = upcomingTrips.find(t => t.id === tripId)
    if (!targetTrip) return
    
    const updatedTrip = { ...targetTrip, status: 'CANCELLED' }
    setUpcomingTrips(upcomingTrips.filter(t => t.id !== tripId))
    setPastTrips([updatedTrip, ...pastTrips])
    
    // Estimate refund
    const tripDate = new Date(`${targetTrip.date} ${targetTrip.time}`)
    const isWithin2Hours = tripDate.getTime() - Date.now() < 2 * 60 * 60 * 1000
    if (isWithin2Hours && targetTrip.status === 'CONFIRMED') {
      showToast('Trip cancelled — no refund (cancelled within 2 hours of trip time)')
    } else {
      showToast('Trip cancelled — 1 Drop refunded')
    }

    setProcessing(tripId)
    
    // 3. Network Request
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to cancel")
    } catch (err) {
      // 4. Rollback on failure
      setUpcomingTrips(prevUpcoming)
      setPastTrips(prevPast)
      showToast('Failed to cancel trip. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Upcoming Trips */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Upcoming Trips
          </p>
          {upcomingTrips.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5"
              style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
            >
              {upcomingTrips.length}
            </span>
          )}
        </div>

        {upcomingTrips.length === 0 ? (
          <div
            className="rounded-lg flex flex-col items-start"
            style={{ background: 'var(--card)', border: '1px dashed var(--border)', padding: '20px' }}
          >
            <Car className="w-4 h-4 mb-2" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No upcoming trips</p>
            <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--muted-foreground)' }}>Book your next campus ride.</p>
            <button
              onClick={handleBookRideClick}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-foreground"
              style={{ background: 'var(--orange-brand)' }}
            >
              Book a Ride
            </button>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {upcomingTrips.map((trip, i) => {
              let candidates: any[] = [];
              if (trip.status === 'PENDING' && trip.pickupLat && trip.pickupLng) {
                // Calculate distance for all active drivers
                candidates = activeDrivers.map(d => {
                  const dist = getDistance(trip.pickupLat, trip.pickupLng, d.lat, d.lng);
                  return { ...d, distance: dist };
                }).sort((a, b) => a.distance - b.distance).slice(0, 3);
              }

              return (
              <div key={trip.id} style={{ borderBottom: i < upcomingTrips.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                <div
                  className="flex items-center gap-3 px-4 py-3 transition-opacity"
                  style={{ opacity: processing === trip.id ? 0.5 : 1 }}
                >
                  <StatusDot status={trip.status} />
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}>
                      {trip.driver ? initials(trip.driver.name!) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                      {trip.driver?.name ?? 'Searching for driver…'}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {trip.pickup} → {trip.destination}
                    </p>
                  </div>
                  <div className="shrink-0 text-right hidden sm:block mr-2">
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{trip.date}</p>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{trip.time}</p>
                  </div>
                  <StatusChip status={trip.status} />
                  {trip.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setActiveChatTrip(trip)}
                      className="p-1 rounded shrink-0 transition-colors hover:bg-white/5 ml-2"
                      style={{ color: '#22c55e' }}
                      aria-label="Message Driver"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {trip.status === 'CONFIRMED' && trip.shareToken && (
                    <button
                      onClick={() => setShareModalOpen(trip.shareToken)}
                      className="p-1 rounded shrink-0 transition-colors hover:bg-white/5 ml-1"
                      style={{ color: 'var(--orange-brand)' }}
                      aria-label="Share Trip"
                    >
                      <Share className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    disabled={processing === trip.id}
                    onClick={() => setTripToCancel(trip.id)}
                    className="p-1 rounded shrink-0 transition-colors hover:bg-white/5 ml-1"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Match Dashboard / Nearby Candidates UI for PENDING trips */}
                {trip.status === 'PENDING' && !trip.isScheduled && (
                  <div className="px-4 pb-4 pt-1">
                    <div className="bg-background/40 rounded-lg border border-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold flex items-center gap-1.5 animate-pulse" style={{ color: 'var(--orange-brand)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--orange-brand)' }}></span>
                          Pinging Nearby Drivers
                        </p>
                        <p className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{candidates.length} online</p>
                      </div>
                      
                      {candidates.length > 0 ? (
                        <div className="space-y-2">
                          {candidates.map(c => (
                            <div key={c.driverId} className="flex items-center justify-between rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <div className="flex items-center gap-2">
                                <Car className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                                <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: 'var(--foreground)' }}>{c.driverName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span style={{ color: 'var(--muted-foreground)' }}>~{Math.max(1, Math.round((c.distance / 30) * 60))} min ETA</span>
                                <span className="font-semibold px-1.5 py-0.5 rounded" style={{ color: 'var(--orange-brand)', background: 'rgba(249,115,22,0.1)' }}>
                                  {c.distance.toFixed(1)} km
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Looking for available drivers on campus...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Scheduled State for PENDING trips */}
                {trip.status === 'PENDING' && trip.isScheduled && (
                  <div className="px-4 pb-4 pt-1">
                    <div className="bg-background/40 rounded-lg border border-white/5 p-3 flex flex-col items-center justify-center text-center">
                      <Clock className="w-6 h-6 text-orange-brand mb-2 opacity-80" />
                      <p className="text-xs font-medium text-foreground">Scheduled for Later</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Drivers will be notified 15 minutes before pickup.</p>
                    </div>
                  </div>
                )}
                
                {/* Spotify Jukebox */}
                {trip.status === 'CONFIRMED' && trip.driver?.driverProfile?.spotifyRefreshToken && (
                  <div className="px-4 pb-4">
                    <SpotifyPlayer tripId={trip.id} />
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Trip History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Trip History
          </p>
          {pastTrips.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5"
              style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
            >
              {pastTrips.length}
            </span>
          )}
        </div>

        {pastTrips.length === 0 ? (
          <div
            className="rounded-lg"
            style={{ background: 'var(--card)', border: '1px solid #1e1e1e', padding: '20px' }}
          >
            <TrendingUp className="w-4 h-4 mb-2" style={{ color: '#2a2a2a' }} />
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Completed trips will appear here.</p>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {pastTrips.map((trip, i) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ 
                  borderBottom: i < pastTrips.length - 1 ? '1px solid #1e1e1e' : 'none',
                  backgroundColor: trip.status === 'CANCELLED' && trip.isOptimistic ? 'rgba(255,255,255,0.02)' : 'transparent',
                  opacity: trip.status === 'CANCELLED' ? 0.6 : 1
                }}
              >
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                    {trip.driver ? initials(trip.driver.name!) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${trip.status === 'CANCELLED' ? 'line-through decoration-white/20' : ''}`} style={{ color: 'var(--muted-foreground)' }}>
                    {trip.driver?.name ?? 'Unknown'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {trip.pickup} → {trip.destination}
                  </p>
                </div>
                {trip.status === 'COMPLETED' && !trip.review ? (
                  <Link
                    href={`/rate/${trip.id}`}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 flex items-center gap-1 hover:brightness-110"
                    style={{ background: 'var(--card)', color: 'var(--orange-brand)', borderRadius: '4px' }}
                  >
                    <Star className="w-2.5 h-2.5" /> Rate
                  </Link>
                ) : (
                  <StatusChip status={trip.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={userId}
          otherPartyName={activeChatTrip.driver?.name ?? 'Driver'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Share Trip</p>
              <button onClick={() => { setShareModalOpen(null); setCopied(false); }} className="p-1" style={{ color: 'var(--muted-foreground)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Send this link to a friend so they can see your verified driver details and track your trip status.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 px-3 py-2 rounded-md text-xs truncate" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                  {`${window.location.origin}/trip/${shareModalOpen}`}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/trip/${shareModalOpen}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 p-2 rounded-md transition-colors hover:brightness-110" 
                  style={{ background: 'var(--orange-brand)', color: 'var(--foreground)' }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`I'm on a TOVEDROP ride — here's my trip details: ${window.location.origin}/trip/${shareModalOpen}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-foreground transition-opacity hover:opacity-90"
                style={{ background: '#25D366' }}
              >
                Share via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!tripToCancel}
        title="Cancel Trip"
        description="Are you sure you want to cancel this trip? If you cancel within 2 hours of the pickup time, you will not be refunded your Drop."
        confirmText="Cancel Trip"
        isDestructive={true}
        onCancel={() => setTripToCancel(null)}
        onConfirm={() => {
          if (tripToCancel) handleCancel(tripToCancel)
        }}
      />
    </div>
  )
}
