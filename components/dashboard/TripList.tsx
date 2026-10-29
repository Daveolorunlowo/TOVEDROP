'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Star, Car, TrendingUp, MessageCircle, ChevronDown, ChevronUp, Calendar, ShieldAlert, Share2, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { ChatModal } from '@/components/chat-modal'
import { SosModal } from '@/components/dashboard/SosModal'

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

function StatusChip({ status, driverDepartedAt, driverArrivedAt, notes }: { status: string; driverDepartedAt?: any; driverArrivedAt?: any; notes?: string }) {
  if (status === 'CANCELLED' && notes?.includes('Expired')) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md text-amber-500 bg-amber-500/10 border border-amber-500/20"
      >
        Expired · Refunded
      </span>
    )
  }
  if (status === 'CONFIRMED' && driverDepartedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md text-amber-500 bg-amber-500/10 border border-amber-500/20"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        Taking Off 🚀
      </span>
    )
  }
  if (status === 'CONFIRMED' && driverArrivedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Driver Arrived 📍
      </span>
    )
  }
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

function downloadICS(trip: any) {
  // If it's not scheduled, fallback to 'now'
  const dateStr = trip.isScheduled ? `${trip.date}T${trip.time}` : new Date().toISOString()
  const scheduledAt = new Date(dateStr).getTime()
  
  if (isNaN(scheduledAt)) return

  const dtStart = new Date(scheduledAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dtEnd = new Date(scheduledAt + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' // Assume 30 min duration
  const summary = `TOVEDROP Ride: ${trip.pickup}`
  const description = `Pickup: ${trip.pickup}\\nDestination: ${trip.destination}${trip.notes ? '\\nNotes: ' + trip.notes : ''}`
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\\r\\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `tovedrop-ride-${trip.id}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

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
  const [activeSosTrip, setActiveSosTrip] = useState<any>(null)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  const [justAcceptedTrip, setJustAcceptedTrip] = useState<any | null>(null)
  const [expiredTripNotice, setExpiredTripNotice] = useState<any | null>(null)
  const prevTripsRef = useRef<any[]>(initialUpcoming)

  useEffect(() => {
    // Detect if any previously PENDING trip was just accepted by a driver
    const previouslyPendingIds = new Set(
      prevTripsRef.current.filter((t: any) => t.status === 'PENDING').map((t: any) => t.id)
    )

    const newlyAccepted = initialUpcoming.find(
      (t: any) => t.status === 'CONFIRMED' && previouslyPendingIds.has(t.id)
    )

    if (newlyAccepted) {
      setJustAcceptedTrip(newlyAccepted)

      // 1. Play celebratory acceptance chime
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          const ctx = new AudioContextClass()
          const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 arpeggio
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.frequency.value = freq
            osc.type = 'sine'
            const startTime = ctx.currentTime + i * 0.12
            gain.gain.setValueAtTime(0, startTime)
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03)
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(startTime)
            osc.stop(startTime + 0.42)
          })
        }
      } catch (e) {}

      // 2. Trigger native OS notification if user is on another tab
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden) {
          try {
            new Notification('Ride Request Accepted! 🎉', {
              body: `${newlyAccepted.driver?.name || 'Your driver'} is on the way to ${newlyAccepted.pickup}!`,
              icon: '/icon-192x192.png',
              tag: `accepted-${newlyAccepted.id}`
            })
          } catch (e) {}
        }
      }
    }

    // Detect if any previously PENDING trip expired/cancelled without a driver
    const newlyExpired = initialPast.find(
      (t: any) =>
        t.status === 'CANCELLED' &&
        previouslyPendingIds.has(t.id) &&
        !t.driverId
    )

    if (newlyExpired) {
      setExpiredTripNotice(newlyExpired)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden) {
          try {
            new Notification('Ride Request Expired ⏰', {
              body: `No driver accepted your request to ${newlyExpired.destination}. Your Drop has been refunded.`,
              icon: '/icon-192x192.png',
              tag: `expired-${newlyExpired.id}`
            })
          } catch (e) {}
        }
      }
    }

    prevTripsRef.current = initialUpcoming
    setUpcomingTrips(initialUpcoming)
    setPastTrips(initialPast)
  }, [initialUpcoming, initialPast])

  // Automatic refresh at specific intervals to catch driver acceptance and status updates
  useEffect(() => {
    const hasPending = upcomingTrips.some(t => t.status === 'PENDING')
    // Faster poll (5s) when rider is waiting for driver acceptance, otherwise 12s
    const pollInterval = hasPending ? 5000 : 12000

    const interval = setInterval(() => {
      router.refresh()
    }, pollInterval)

    const handleFocus = () => {
      router.refresh()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [upcomingTrips, router])
  
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
      showToast('Trip cancelled - no refund (cancelled within 2 hours of trip time)')
    } else {
      showToast('Trip cancelled - 1 Drop refunded')
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

  const handleShare = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate link')
      const { shareToken } = await res.json()
      const url = `${window.location.origin}/track/${shareToken}`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Track my Tovedrop ride',
          text: 'Track my live location on Tovedrop:',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Tracking link copied to clipboard!')
      }
    } catch (e) {
      console.error(e)
      alert('Could not share trip')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Upcoming Trips */}
      <div className="lg:col-span-2">
        {justAcceptedTrip && (
          <div 
            className="rounded-2xl p-4 sm:p-5 mb-5 border-2 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300"
            style={{ 
              background: 'rgba(34, 197, 94, 0.12)', 
              borderColor: '#22c55e',
              boxShadow: '0 10px 25px rgba(34,197,94,0.15)' 
            }}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xl">
                🎉
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <span>Ride Accepted!</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                    Confirmed
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <strong className="text-foreground">{justAcceptedTrip.driver?.name || 'Your driver'}</strong> has accepted your ride request to <strong className="text-foreground">{justAcceptedTrip.destination}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/dashboard/trips/${justAcceptedTrip.id}`}
                className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--orange-brand)' }}
              >
                View Live Ride
              </Link>
              <button
                onClick={() => setJustAcceptedTrip(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {expiredTripNotice && (
          <div 
            className="rounded-2xl p-4 sm:p-5 mb-5 border-2 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300"
            style={{ 
              background: 'rgba(245, 158, 11, 0.12)', 
              borderColor: 'var(--orange-brand)',
              boxShadow: '0 10px 25px rgba(245,158,11,0.15)' 
            }}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-xl">
                ⏰
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <span>Pickup Time Passed — No Driver Available</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                    Refunded
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No driver accepted your ride request to <strong className="text-foreground">{expiredTripNotice.destination}</strong> before the pickup time passed. Your 1 Drop has been refunded to your wallet.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/book"
                className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--orange-brand)' }}
              >
                Book Again
              </Link>
              <button
                onClick={() => setExpiredTripNotice(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
          <div className="space-y-3">
            {upcomingTrips.map((trip) => {
              const isConfirmed = trip.status === 'CONFIRMED'
              return (
                <div
                  key={trip.id}
                  className="rounded-2xl p-4 sm:p-5 transition-all shadow-sm border"
                  style={{
                    background: 'var(--card)',
                    borderColor: isConfirmed ? 'rgba(34,197,94,0.3)' : 'var(--border)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Driver / Search State */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {isConfirmed ? (
                        <div className="relative shrink-0">
                          <Avatar className="w-11 h-11 border border-border shadow-sm">
                            <AvatarImage src={trip.driver?.image || ''} />
                            <AvatarFallback className="text-xs font-bold" style={{ background: 'var(--border)', color: 'var(--foreground)' }}>
                              {trip.driver ? initials(trip.driver.name!) : 'TD'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-[var(--orange-brand)]/10 border border-[var(--orange-brand)]/20 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-[var(--orange-brand)] animate-pulse" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-extrabold truncate" style={{ color: 'var(--foreground)' }}>
                            {isConfirmed ? (trip.driver?.name ?? 'Assigned Driver') : 'Searching for Available Driver...'}
                          </h4>
                          <StatusChip status={trip.status} driverDepartedAt={trip.driverDepartedAt} driverArrivedAt={trip.driverArrivedAt} notes={trip.notes} />
                        </div>

                        <p className="text-xs truncate font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          <span className="font-semibold text-foreground">{trip.pickup}</span> &rarr; <span className="font-semibold text-foreground">{trip.destination}</span>
                        </p>

                        <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {trip.isScheduled ? `${trip.date} at ${trip.time}` : `Instant Pick-Up · ${trip.time}`}
                        </p>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isConfirmed ? (
                        <Link
                          href={`/dashboard/trips/${trip.id}`}
                          id={`view-live-trip-${trip.id}`}
                          className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                          style={{ background: 'var(--orange-brand)' }}
                        >
                          <span>View Live Ride Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--orange-brand)] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--orange-brand)]/10">
                          <span className="w-2 h-2 rounded-full bg-[var(--orange-brand)] animate-ping" />
                          Driver Dispatched Soon
                        </span>
                      )}

                      <button
                        disabled={processing === trip.id}
                        onClick={() => handleCancel(trip.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Cancel Booking"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Trip History */}
      <div>
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer select-none group"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
        >
          <div className="flex items-center gap-1.5 transition-opacity group-hover:opacity-80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
              Trip History
            </p>
            {isHistoryExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            )}
          </div>
          {pastTrips.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 transition-opacity group-hover:opacity-80"
              style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
            >
              {pastTrips.length}
            </span>
          )}
        </div>

        {isHistoryExpanded && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
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
                      <AvatarImage src={trip.driver?.image || ''} />
                      <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                        {trip.driver ? initials(trip.driver.name!) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${trip.status === 'CANCELLED' ? 'line-through decoration-white/20' : ''}`} style={{ color: 'var(--muted-foreground)' }}>
                        {trip.driver ? trip.driver.name : (trip.notes?.includes('Expired') ? 'No Driver Accepted' : 'No Driver Assigned')}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {trip.pickup} &rarr; {trip.destination}
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
                      <StatusChip status={trip.status} notes={trip.notes} />
                    )}
                  </div>
                ))}
              </div>
            )}
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

      {activeSosTrip && (
        <SosModal
          trip={activeSosTrip}
          onClose={() => setActiveSosTrip(null)}
        />
      )}
    </div>
  )
}

