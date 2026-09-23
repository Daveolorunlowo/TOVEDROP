'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Star, Car, TrendingUp, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { ChatModal } from '@/components/chat-modal'

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'var(--orange-brand)',
    CONFIRMED: '#22c55e',
    COMPLETED: 'var(--muted-foreground)',
    CANCELLED: '#ef4444',
  }
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: colors[status] ?? 'var(--muted-foreground)' }}
    />
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'Pending',   color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.1)' },
    CONFIRMED: { label: 'Confirmed', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    COMPLETED: { label: 'Completed', color: 'var(--muted-foreground)',    bg: 'var(--border)' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  }
  const s = map[status] ?? { label: status, color: 'var(--muted-foreground)', bg: 'var(--border)' }
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

export function TripList({
  initialUpcoming,
  initialPast
}: {
  initialUpcoming: any[],
  initialPast: any[]
}) {
  const router = useRouter()
  const [upcomingTrips, setUpcomingTrips] = useState(initialUpcoming)
  const [pastTrips, setPastTrips] = useState(initialPast)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeChatTrip, setActiveChatTrip] = useState<any>(null)
  
  useEffect(() => {
    setUpcomingTrips(initialUpcoming)
    setPastTrips(initialPast)
  }, [initialUpcoming, initialPast])
  
  // Custom styled Toast/Alert fallback if we don't have a toast library available
  // In a real app we'd use sonner or similar.
  const showToast = (msg: string) => {
    alert(msg) // Placeholder for toast, you can replace with a real toast
  }

  const handleCancel = async (tripId: string) => {
    if (!window.confirm("Are you sure you want to cancel this trip?")) return
    
    // 1. Snapshot
    const prevUpcoming = [...upcomingTrips]
    const prevPast = [...pastTrips]
    
    // 2. Optimistic UI
    const targetTrip = upcomingTrips.find(t => t.id === tripId)
    if (!targetTrip) return
    
    const cancelledTrip = { ...targetTrip, status: 'CANCELLED' }
    setUpcomingTrips(upcomingTrips.filter(t => t.id !== tripId))
    setPastTrips([cancelledTrip, ...pastTrips])
    
    // Estimate refund
    const tripDate = new Date(`${targetTrip.date} ${targetTrip.time}`)
    const hoursDifference = (tripDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)

    if (hoursDifference <= 2) {
      showToast('Trip cancelled â€” no refund (cancelled within 2 hours of trip time)')
    } else {
      showToast('Trip cancelled â€” 1 Drop refunded')
    }

    setProcessing(tripId)
    
    // 3. Network Request
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error("Failed to cancel")
      router.refresh()
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
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
            <Link
              href="/book"
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-foreground"
              style={{ background: 'var(--orange-brand)' }}
            >
              Book a Ride
            </Link>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {upcomingTrips.map((trip, i) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 px-4 py-3 transition-opacity"
                style={{ 
                  borderBottom: i < upcomingTrips.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: processing === trip.id ? 0.5 : 1
                }}
              >
                <StatusDot status={trip.status} />
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}>
                    {trip.driver ? initials(trip.driver.name!) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                    {trip.driver?.name ?? 'Searching for driverâ€¦'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {trip.pickup} â†’ {trip.destination}
                  </p>
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    {trip.isScheduled ? trip.date : 'Instant Pick-Up'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{trip.time}</p>
                </div>
                <StatusChip status={trip.status} />
                {trip.status === 'CONFIRMED' && (
                  <button
                    onClick={() => setActiveChatTrip(trip)}
                    className="p-1 rounded shrink-0 transition-colors text-[var(--orange-brand)] hover:bg-foreground/5 mr-1"
                    aria-label="Chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  disabled={processing === trip.id}
                  onClick={() => handleCancel(trip.id)}
                  className="p-1 rounded shrink-0 transition-colors hover:bg-foreground/5"
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-label="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trip History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
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
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px' }}
          >
            <TrendingUp className="w-4 h-4 mb-2" style={{ color: 'var(--muted-foreground)' }} />
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
                  borderBottom: i < pastTrips.length - 1 ? '1px solid var(--border)' : 'none',
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
                    {trip.pickup} â†’ {trip.destination}
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

      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={activeChatTrip.riderId}
          otherPartyName={activeChatTrip.driver?.name ?? 'Driver'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}
    </div>
  )
}

