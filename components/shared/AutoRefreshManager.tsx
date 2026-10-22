'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { pusherClient } from '@/lib/pusher-client'
import { Car, MapPin, CheckCircle2, X, Navigation, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TripToast {
  id: string
  type: 'accepted' | 'arrived' | 'departed' | 'completed'
  title: string
  message: string
  tripId?: string
  driverName?: string
  vehicle?: string
  pickup?: string
}

function playTone(freqs: number[], duration = 0.4) {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.12)
      gain.gain.setValueAtTime(0.18, now + idx * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.12)
      osc.stop(now + idx * 0.12 + 0.3)
    })
  } catch (e) {
    // Audio context may be restricted before first gesture
  }
}

export function AutoRefreshManager() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeToast, setActiveToast] = useState<TripToast | null>(null)
  const lastRefreshRef = useRef<number>(Date.now())

  const triggerRefresh = () => {
    // Throttle router.refresh to max once every 2 seconds
    const now = Date.now()
    if (now - lastRefreshRef.current < 2000) return
    lastRefreshRef.current = now
    try {
      router.refresh()
    } catch (e) {}
  }

  // ── Listen to custom ride update events instead of polling ──────────
  useEffect(() => {
    if (!session?.user?.id) return

    const handleRideUpdate = () => {
      triggerRefresh()
    }

    window.addEventListener('tovedrop:trip-updated', handleRideUpdate)
    window.addEventListener('tovedrop:drops-updated', handleRideUpdate)

    return () => {
      window.removeEventListener('tovedrop:trip-updated', handleRideUpdate)
      window.removeEventListener('tovedrop:drops-updated', handleRideUpdate)
    }
  }, [session?.user?.id])

  // ── 3. Real-time Pusher ride event listeners ─────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return
    if (!pusherClient) return

    const userId = session.user.id
    const channel1 = `user-trips-${userId}`
    const channel2 = `user-${userId}`

    const handleTripAccepted = (data: any) => {
      // 1. Play celebratory acceptance chime
      playTone([523.25, 659.25, 783.99]) // C5, E5, G5 major triad

      // 2. Trigger native OS / background notification if user is not in tab
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden) {
          try {
            new Notification('Ride Accepted! 🎉', {
              body: `${data.driverName || 'A driver'} accepted your ride in a ${data.vehicle || 'campus vehicle'}!`,
              icon: '/icon-192x192.png',
              tag: `accepted-${data.tripId}`
            })
          } catch (e) {}
        }
      }

      // 3. Show high-visibility interactive toast banner
      setActiveToast({
        id: 'toast-' + Date.now(),
        type: 'accepted',
        title: 'Ride Request Accepted! 🎉',
        message: `${data.driverName || 'Your driver'} is on the way in a ${data.vehicle || 'campus vehicle'}.`,
        tripId: data.tripId,
        driverName: data.driverName,
        vehicle: data.vehicle
      })

      // 4. Immediately refresh app data so UI transitions out of "Pending"
      triggerRefresh()
    }

    const handleDriverArrived = (data: any) => {
      playTone([440, 880]) // Alert double tone

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden) {
          try {
            new Notification('Driver Arrived! 📍', {
              body: `${data.driverName || 'Your driver'} has arrived at ${data.pickup || 'the pickup point'}.`,
              icon: '/icon-192x192.png',
              tag: `arrived-${data.tripId}`
            })
          } catch (e) {}
        }
      }

      setActiveToast({
        id: 'toast-' + Date.now(),
        type: 'arrived',
        title: 'Driver Has Arrived! 📍',
        message: `${data.driverName || 'Your driver'} is waiting at your pickup location.`,
        tripId: data.tripId,
        pickup: data.pickup
      })

      triggerRefresh()
    }

    const handleDriverDeparted = () => {
      playTone([659.25, 880])
      triggerRefresh()
    }

    const handleTripCompleted = () => {
      playTone([523.25, 659.25, 1046.5])
      triggerRefresh()
    }

    const sub1 = pusherClient.subscribe(channel1)
    const sub2 = pusherClient.subscribe(channel2)

    sub1.bind('trip-accepted', handleTripAccepted)
    sub2.bind('trip-accepted', handleTripAccepted)

    sub1.bind('driver-arrived', handleDriverArrived)
    sub2.bind('driver-arrived', handleDriverArrived)

    sub1.bind('driver-departed', handleDriverDeparted)
    sub2.bind('driver-departed', handleDriverDeparted)

    sub1.bind('trip-completed', handleTripCompleted)
    sub2.bind('trip-completed', handleTripCompleted)

    return () => {
      if (pusherClient) {
        sub1.unbind('trip-accepted', handleTripAccepted)
        sub2.unbind('trip-accepted', handleTripAccepted)

        sub1.unbind('driver-arrived', handleDriverArrived)
        sub2.unbind('driver-arrived', handleDriverArrived)

        sub1.unbind('driver-departed', handleDriverDeparted)
        sub2.unbind('driver-departed', handleDriverDeparted)

        sub1.unbind('trip-completed', handleTripCompleted)
        sub2.unbind('trip-completed', handleTripCompleted)
      }
    }
  }, [session?.user?.id])

  if (!activeToast) return null

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-[200] max-w-md animate-in slide-in-from-top-3 fade-in duration-300">
      <div
        className="rounded-2xl p-4 shadow-2xl backdrop-blur-xl border-2 flex items-start gap-3.5"
        style={{
          background: 'var(--surface-card)',
          borderColor: activeToast.type === 'arrived' ? '#22c55e' : 'var(--orange-brand)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.45)'
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white"
          style={{
            background: activeToast.type === 'arrived' ? '#22c55e' : 'var(--orange-brand)'
          }}
        >
          {activeToast.type === 'arrived' ? (
            <MapPin className="w-5 h-5 animate-bounce" />
          ) : (
            <Car className="w-5 h-5 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
              {activeToast.title}
            </h4>
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            {activeToast.message}
          </p>

          {activeToast.tripId && (
            <div className="mt-2.5 flex items-center gap-2">
              <Link
                href={`/dashboard/trips/${activeToast.tripId}`}
                onClick={() => setActiveToast(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{
                  background: activeToast.type === 'arrived' ? '#22c55e' : 'var(--orange-brand)'
                }}
              >
                <span>View Live Ride</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
