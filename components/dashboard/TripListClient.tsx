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
  const R = 6371; 
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
      className="inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
      style={{ background: s.bg, color: s.color, borderRadius: '4px' }}
    >
      {s.label}
    </span>
  )
}

const initials = (name: string) =>
  name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?'

export function TripListClient({
  initialTrips,
  subtab,
  userId
}: {
  initialTrips: any[],
  subtab: 'upcoming' | 'past',
  userId: string
}) {
  const [trips, setTrips] = useState(initialTrips)
  const [processing, setProcessing] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState<string | null>(null)
  const [activeChatTrip, setActiveChatTrip] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)
  const handleBookRideClick = useBookRideNavigation()
  const [activeDrivers, setActiveDrivers] = useState<any[]>([])
  const [tripToCancel, setTripToCancel] = useState<string | null>(null)
  const router = useRouter()

  // Sync state when props change (like when paginating)
  useEffect(() => {
    setTrips(initialTrips)
  }, [initialTrips])

  useEffect(() => {
    if (subtab !== 'upcoming') return;
    const hasPending = trips.some(t => t.status === 'PENDING');
    if (!hasPending) return;
    if (!pusherClient) return;

    const channel = pusherClient.subscribe('global-driver-locations')
    channel.bind('location-update', (data: any) => {
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
  }, [trips, subtab])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDrivers(prev => prev.filter(d => Date.now() - d.timestamp < 60000));
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const showToast = (msg: string) => {
    alert(msg) 
  }

  const handleCancel = async (tripId: string) => {
    setTripToCancel(null)
    const prevTrips = [...trips]
    
    // Optimistic UI for cancel
    const targetTrip = trips.find(t => t.id === tripId)
    if (!targetTrip) return
    
    // If we're on the upcoming tab, we just remove it from the list
    setTrips(trips.filter(t => t.id !== tripId))
    
    const tripDate = new Date(`${targetTrip.date} ${targetTrip.time}`)
    const isWithin2Hours = tripDate.getTime() - Date.now() < 2 * 60 * 60 * 1000
    if (isWithin2Hours && targetTrip.status === 'CONFIRMED') {
      showToast('Trip cancelled — no refund (cancelled within 2 hours of trip time)')
    } else {
      showToast('Trip cancelled — 1 Drop refunded')
    }

    setProcessing(tripId)
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to cancel")
      // After success, router.refresh to sync server state
      router.refresh()
    } catch (err) {
      setTrips(prevTrips)
      showToast('Failed to cancel trip. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-xl flex flex-col items-center text-center justify-center py-12" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
        <Car className="w-8 h-8 mb-3 opacity-20 text-foreground" />
        <p className="text-sm font-medium text-muted-foreground">No {subtab} trips found</p>
        {subtab === 'upcoming' && (
          <button
            onClick={handleBookRideClick}
            className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg text-primary-foreground transition-all hover:brightness-110"
            style={{ background: 'var(--orange-brand)' }}
          >
            Book a Ride
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {trips.map((trip, i) => {
          let candidates: any[] = [];
          if (trip.status === 'PENDING' && trip.pickupLat && trip.pickupLng) {
            candidates = activeDrivers.map(d => {
              const dist = getDistance(trip.pickupLat, trip.pickupLng, d.lat, d.lng);
              return { ...d, distance: dist };
            }).sort((a, b) => a.distance - b.distance).slice(0, 3);
          }

          return (
            <div key={trip.id} style={{ borderBottom: i < trips.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div
                className="flex items-center gap-3 px-4 py-4 transition-all"
                style={{ opacity: processing === trip.id || trip.status === 'CANCELLED' ? 0.5 : 1 }}
              >
                <StatusDot status={trip.status} />
                <Avatar className="w-9 h-9 shrink-0 shadow-sm border border-border/50">
                  <AvatarFallback className="text-xs font-bold bg-surface-elevated text-muted-foreground">
                    {trip.driver ? initials(trip.driver.name!) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${trip.status === 'CANCELLED' ? 'line-through opacity-70' : 'text-foreground'}`}>
                    {trip.driver?.name ?? 'Searching for driver…'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{trip.pickup}</span>
                    <span className="text-[10px] text-muted-foreground/60">→</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{trip.destination}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right hidden sm:block mr-3 border-r border-border pr-4">
                  <p className="text-xs font-medium text-foreground">{trip.time}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{trip.date}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {trip.status === 'COMPLETED' && !trip.review ? (
                    <Link
                      href={`/rate/${trip.id}`}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 hover:brightness-110 shadow-sm"
                      style={{ background: 'var(--orange-brand)', color: 'var(--primary-foreground)' }}
                    >
                      <Star className="w-3 h-3" /> Rate
                    </Link>
                  ) : (
                    <StatusChip status={trip.status} />
                  )}
                  
                  {subtab === 'upcoming' && (
                    <div className="flex items-center gap-1 mt-1">
                      {trip.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => setActiveChatTrip(trip)}
                            className="p-1.5 rounded bg-surface-elevated hover:bg-white/10 transition-colors text-green-500"
                            aria-label="Message Driver"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {trip.shareToken && (
                            <button
                              onClick={() => setShareModalOpen(trip.shareToken)}
                              className="p-1.5 rounded bg-surface-elevated hover:bg-white/10 transition-colors text-orange-brand"
                              aria-label="Share Trip"
                            >
                              <Share className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      {(trip.status === 'PENDING' || trip.status === 'CONFIRMED') && (
                        <button
                          disabled={processing === trip.id}
                          onClick={() => setTripToCancel(trip.id)}
                          className="p-1.5 rounded bg-surface-elevated hover:bg-white/10 transition-colors text-red-500/80"
                          aria-label="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {trip.status === 'PENDING' && !trip.isScheduled && subtab === 'upcoming' && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-surface-elevated rounded-lg border border-border-subtle p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 animate-pulse text-orange-brand">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-brand"></span>
                        Pinging Nearby Drivers
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground">{candidates.length} online</p>
                    </div>
                    {candidates.length > 0 ? (
                      <div className="space-y-2">
                        {candidates.map(c => (
                          <div key={c.driverId} className="flex items-center justify-between rounded p-2 bg-background/50">
                            <div className="flex items-center gap-2">
                              <Car className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium truncate max-w-[100px] text-foreground">{c.driverName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-muted-foreground">~{Math.max(1, Math.round((c.distance / 30) * 60))} min ETA</span>
                              <span className="font-semibold px-1.5 py-0.5 rounded bg-orange-brand/10 text-orange-brand">
                                {c.distance.toFixed(1)} km
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-muted-foreground">
                        Looking for available drivers on campus...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {trip.status === 'CONFIRMED' && trip.driver?.driverProfile?.spotifyRefreshToken && subtab === 'upcoming' && (
                <div className="px-4 pb-4">
                  <SpotifyPlayer tripId={trip.id} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={userId}
          otherPartyName={activeChatTrip.driver?.name ?? 'Driver'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}

      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl overflow-hidden bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Share Trip</p>
              <button onClick={() => { setShareModalOpen(null); setCopied(false); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs mb-4 text-muted-foreground">
                Send this link to a friend so they can see your verified driver details and track your trip status.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 px-3 py-2 rounded-md text-xs truncate bg-surface-elevated border border-border text-muted-foreground">
                  {`${window.location.origin}/trip/${shareModalOpen}`}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/trip/${shareModalOpen}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 p-2 rounded-md transition-colors hover:brightness-110 bg-orange-brand text-primary-foreground"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`I'm on a TOVEDROP ride — here's my trip details: ${window.location.origin}/trip/${shareModalOpen}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#25D366' }}
              >
                Share via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

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
    </>
  )
}
