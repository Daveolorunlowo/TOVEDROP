'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Star, Car, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

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
    COMPLETED: { label: 'Completed', color: '#555',    bg: '#1e1e1e' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  }
  const s = map[status] ?? { label: status, color: '#555', bg: '#1e1e1e' }
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
  const [upcomingTrips, setUpcomingTrips] = useState(initialUpcoming)
  const [pastTrips, setPastTrips] = useState(initialPast)
  const [processing, setProcessing] = useState<string | null>(null)
  
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
            Upcoming Trips
          </p>
          {upcomingTrips.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5"
              style={{ background: '#1e1e1e', color: '#888', borderRadius: '4px' }}
            >
              {upcomingTrips.length}
            </span>
          )}
        </div>

        {upcomingTrips.length === 0 ? (
          <div
            className="rounded-lg flex flex-col items-start"
            style={{ background: '#171717', border: '1px dashed #222', padding: '20px' }}
          >
            <Car className="w-4 h-4 mb-2" style={{ color: '#333' }} />
            <p className="text-sm font-medium" style={{ color: '#888' }}>No upcoming trips</p>
            <p className="text-xs mt-0.5 mb-4" style={{ color: '#555' }}>Book your next campus ride.</p>
            <Link
              href="/book"
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-black"
              style={{ background: 'var(--orange-brand)' }}
            >
              Book a Ride
            </Link>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: '#171717', border: '1px solid #222' }}
          >
            {upcomingTrips.map((trip, i) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 px-4 py-3 transition-opacity"
                style={{ 
                  borderBottom: i < upcomingTrips.length - 1 ? '1px solid #1e1e1e' : 'none',
                  opacity: processing === trip.id ? 0.5 : 1
                }}
              >
                <StatusDot status={trip.status} />
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: '#222', color: '#888' }}>
                    {trip.driver ? initials(trip.driver.name!) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#f5f5f5' }}>
                    {trip.driver?.name ?? 'Searching for driver…'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: '#555' }}>
                    {trip.pickup} → {trip.destination}
                  </p>
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-[11px]" style={{ color: '#555' }}>{trip.date}</p>
                  <p className="text-[11px]" style={{ color: '#444' }}>{trip.time}</p>
                </div>
                <StatusChip status={trip.status} />
                <button
                  disabled={processing === trip.id}
                  onClick={() => handleCancel(trip.id)}
                  className="p-1 rounded shrink-0 transition-colors hover:bg-white/5"
                  style={{ color: '#888' }}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
            Trip History
          </p>
          {pastTrips.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5"
              style={{ background: '#1e1e1e', color: '#888', borderRadius: '4px' }}
            >
              {pastTrips.length}
            </span>
          )}
        </div>

        {pastTrips.length === 0 ? (
          <div
            className="rounded-lg"
            style={{ background: '#171717', border: '1px solid #1e1e1e', padding: '20px' }}
          >
            <TrendingUp className="w-4 h-4 mb-2" style={{ color: '#2a2a2a' }} />
            <p className="text-xs" style={{ color: '#444' }}>Completed trips will appear here.</p>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: '#171717', border: '1px solid #222' }}
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
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: '#1e1e1e', color: '#555' }}>
                    {trip.driver ? initials(trip.driver.name!) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${trip.status === 'CANCELLED' ? 'line-through decoration-white/20' : ''}`} style={{ color: '#888' }}>
                    {trip.driver?.name ?? 'Unknown'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: '#444' }}>
                    {trip.pickup} → {trip.destination}
                  </p>
                </div>
                {trip.status === 'COMPLETED' && !trip.review ? (
                  <Link
                    href={`/rate/${trip.id}`}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 flex items-center gap-1 hover:brightness-110"
                    style={{ background: '#1e1e1e', color: 'var(--orange-brand)', borderRadius: '4px' }}
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
    </div>
  )
}
