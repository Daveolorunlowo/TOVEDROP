"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { pusherClient } from "@/lib/pusher-client"
import { 
  MessageSquare, Car, MapPin, CheckCircle2, 
  AlertTriangle, RefreshCw, X, ArrowRight,
  BellRing, Banknote, Droplet, Sparkles 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GlobalToast {
  id: string
  type: 'message' | 'trip-accepted' | 'driver-arrived' | 'trip-departed' | 'trip-completed' | 'trip-cancelled' | 'trip-transferred' | 'new-trip' | 'admin-alert' | 'drops-credited'
  title: string
  content: string
  actionUrl?: string
  actionLabel?: string
  timestamp: number
}

// ── Synthesized Zero-Latency Audio Chimes ──
function playChime(type: 'message' | 'ride' | 'success' | 'alert' | 'danger') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    if (type === 'ride') {
      // Energetic double-chime (784Hz -> 1046Hz)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(784, now)
      osc.frequency.setValueAtTime(1046.5, now + 0.12)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.45)
    } else if (type === 'success') {
      // Harmonic 3-note chime (523Hz -> 659Hz -> 784Hz)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.15, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.35)
      })
    } else if (type === 'alert') {
      // Dual high-pitch alert ping
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.setValueAtTime(1174, now + 0.1)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.3)
    } else if (type === 'danger') {
      // Low descending warning chime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(392, now)
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    } else {
      // Soft gentle bubble pop
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.setValueAtTime(880, now + 0.08)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.28)
    }
  } catch (e) {
    // AudioContext autoplay restrictions are handled gracefully
  }
}

export function GlobalMessageListener() {
  const { data: session } = useSession()
  const router = useRouter()
  const [toast, setToast] = useState<GlobalToast | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = (toastData: Omit<GlobalToast, 'id' | 'timestamp'>) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Trigger device haptics
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200])
      } catch (e) {}
    }

    setToast({
      ...toastData,
      id: String(Date.now()),
      timestamp: Date.now()
    })

    // Auto dismiss after 7.5 seconds
    timerRef.current = setTimeout(() => {
      setToast(null)
    }, 7500)
  }

  useEffect(() => {
    if (!session?.user?.id || !pusherClient) return

    const userId = session.user.id
    const userRole = session.user.role

    const userTripsChannel = pusherClient.subscribe(`user-trips-${userId}`)
    const userDirectChannel = pusherClient.subscribe(`user-${userId}`)

    // ── 1. IN-APP MESSAGES ──
    const handleIncomingMessage = (data: any) => {
      playChime('message')
      showToast({
        type: 'message',
        title: `Message from ${data.senderName || 'Chat'}`,
        content: data.content || 'Sent you a message',
        actionUrl: data.tripId ? `/dashboard/trips/${data.tripId}` : undefined,
        actionLabel: 'Reply'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:new-message', { detail: data }))
    }

    // ── 2. RIDE ACCEPTED ──
    const handleTripAccepted = (data: any) => {
      playChime('ride')
      showToast({
        type: 'trip-accepted',
        title: 'Ride Accepted! 🎉',
        content: `${data.driverName || 'A driver'} accepted your ride in a ${data.vehicle || 'vehicle'}.`,
        actionUrl: data.tripId ? `/dashboard/trips/${data.tripId}` : '/dashboard',
        actionLabel: 'Track Driver'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:trip-updated', { detail: data }))
    }

    // ── 3. DRIVER ARRIVED ──
    const handleDriverArrived = (data: any) => {
      playChime('ride')
      showToast({
        type: 'driver-arrived',
        title: 'Driver Arrived! 📍',
        content: `${data.driverName || 'Your driver'} has arrived at ${data.pickup || 'the pickup location'}.`,
        actionUrl: data.tripId ? `/dashboard/trips/${data.tripId}` : '/dashboard',
        actionLabel: 'View Pickup'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:trip-updated', { detail: data }))
    }

    // ── 4. TRIP DEPARTED ──
    const handleTripDeparted = (data: any) => {
      playChime('ride')
      showToast({
        type: 'trip-departed',
        title: 'Ride Taking Off! 🚗💨',
        content: `Your driver is en route to ${data.destination || 'destination'}. Safe travels!`,
        actionUrl: data.tripId ? `/dashboard/trips/${data.tripId}` : '/dashboard',
        actionLabel: 'Live Map'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:trip-updated', { detail: data }))
    }

    // ── 5. TRIP COMPLETED ──
    const handleTripCompleted = (data: any) => {
      playChime('success')
      showToast({
        type: 'trip-completed',
        title: 'Trip Completed! 🏁',
        content: 'You have arrived at your destination! Tap to rate your driver.',
        actionUrl: data.tripId ? `/rate/${data.tripId}` : '/dashboard',
        actionLabel: 'Rate Ride'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:trip-updated', { detail: data }))
    }

    // ── 6. TRIP CANCELLED ──
    const handleTripCancelled = (data: any) => {
      playChime('danger')
      showToast({
        type: 'trip-cancelled',
        title: 'Trip Cancelled ❌',
        content: data.message || 'A trip has been cancelled.',
        actionUrl: userRole === 'DRIVER' ? '/driver' : '/dashboard',
        actionLabel: 'View Trips'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:trip-updated', { detail: data }))
    }

    // ── 7. TRIP TRANSFERRED ──
    const handleTripTransferred = (data: any) => {
      playChime('alert')
      showToast({
        type: 'trip-transferred',
        title: 'Driver Updated 🔄',
        content: `Your trip was transferred to ${data.newDriverName || 'another driver'}.`,
        actionUrl: data.tripId ? `/dashboard/trips/${data.tripId}` : '/dashboard',
        actionLabel: 'View Details'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:trip-updated', { detail: data }))
    }

    // ── 8. DROPS CREDITED ──
    const handleDropsCredited = (data: any) => {
      playChime('success')
      showToast({
        type: 'drops-credited',
        title: 'Drops Credited! 💧',
        content: `Successfully added ${data.amount || 0} Drops to your account!`,
        actionUrl: '/dashboard',
        actionLabel: 'Check Balance'
      })
      window.dispatchEvent(new CustomEvent('tovedrop:drops-updated', { detail: data }))
    }

    // Bind on user channels
    userTripsChannel.bind('incoming-message', handleIncomingMessage)
    userDirectChannel.bind('incoming-message', handleIncomingMessage)

    userTripsChannel.bind('trip-accepted', handleTripAccepted)
    userDirectChannel.bind('trip-accepted', handleTripAccepted)

    userTripsChannel.bind('driver-arrived', handleDriverArrived)
    userDirectChannel.bind('driver-arrived', handleDriverArrived)

    userTripsChannel.bind('trip-departed', handleTripDeparted)
    userDirectChannel.bind('trip-departed', handleTripDeparted)

    userTripsChannel.bind('trip-completed', handleTripCompleted)
    userDirectChannel.bind('trip-completed', handleTripCompleted)

    userTripsChannel.bind('trip-cancelled', handleTripCancelled)
    userDirectChannel.bind('trip-cancelled', handleTripCancelled)

    userTripsChannel.bind('trip-transferred', handleTripTransferred)
    userDirectChannel.bind('trip-transferred', handleTripTransferred)

    userDirectChannel.bind('drops-credited', handleDropsCredited)

    // ── 9. DRIVER GLOBAL CHANNEL (New Ride Requests) ──
    let globalTripsChannel: any = null
    if (userRole === 'DRIVER') {
      globalTripsChannel = pusherClient.subscribe('global-trips')
      globalTripsChannel.bind('new-trip', (data: any) => {
        playChime('ride')
        const trip = data.trip || data
        showToast({
          type: 'new-trip',
          title: 'New Ride Request! 🚗',
          content: `${trip.pickup || 'Campus'} → ${trip.destination || 'Destination'} (${trip.time || 'Now'})`,
          actionUrl: '/driver',
          actionLabel: 'Accept Ride'
        })
        window.dispatchEvent(new CustomEvent('tovedrop:new-trip', { detail: data }))
      })
    }

    // ── 10. ADMIN ALERTS CHANNEL (Live Activity Stream) ──
    let adminAlertsChannel: any = null
    if (userRole === 'ADMIN') {
      adminAlertsChannel = pusherClient.subscribe('admin-alerts')

      adminAlertsChannel.bind('new-trip', (data: any) => {
        playChime('alert')
        showToast({
          type: 'admin-alert',
          title: 'New Ride Booked 🚗',
          content: `${data.riderName || 'Rider'}: ${data.pickup} → ${data.destination}`,
          actionUrl: '/admin',
          actionLabel: 'View Event'
        })
        window.dispatchEvent(new CustomEvent('tovedrop:admin-event', { detail: data }))
      })

      adminAlertsChannel.bind('new-driver-application', (data: any) => {
        playChime('alert')
        showToast({
          type: 'admin-alert',
          title: 'New Driver Application 📝',
          content: `${data.name || 'Applicant'} applied to join TOVEDROP fleet.`,
          actionUrl: '/admin?tab=approvals',
          actionLabel: 'Review Driver'
        })
        window.dispatchEvent(new CustomEvent('tovedrop:admin-event', { detail: data }))
      })

      adminAlertsChannel.bind('new-withdrawal-request', (data: any) => {
        playChime('alert')
        showToast({
          type: 'admin-alert',
          title: 'New Withdrawal Request 💸',
          content: `${data.driverName || 'Driver'} requested ₦${Number(data.amount || 0).toLocaleString()} payout.`,
          actionUrl: '/admin?tab=payouts',
          actionLabel: 'Review Payout'
        })
        window.dispatchEvent(new CustomEvent('tovedrop:admin-event', { detail: data }))
      })

      adminAlertsChannel.bind('trip-cancelled', (data: any) => {
        playChime('danger')
        showToast({
          type: 'admin-alert',
          title: 'Trip Cancelled ❌',
          content: data.title || 'A trip was cancelled on platform.',
          actionUrl: '/admin',
          actionLabel: 'Open HQ'
        })
        window.dispatchEvent(new CustomEvent('tovedrop:admin-event', { detail: data }))
      })
    }

    return () => {
      if (pusherClient) {
        userTripsChannel.unbind_all()
        userDirectChannel.unbind_all()
        if (globalTripsChannel) globalTripsChannel.unbind_all()
        if (adminAlertsChannel) adminAlertsChannel.unbind_all()
      }
    }
  }, [session?.user?.id, session?.user?.role])

  if (!toast) return null

  const getToastIcon = () => {
    switch (toast.type) {
      case 'trip-accepted':
      case 'new-trip':
        return <Car className="w-5 h-5 text-orange-brand" />
      case 'driver-arrived':
        return <MapPin className="w-5 h-5 text-emerald-500" />
      case 'trip-departed':
        return <Car className="w-5 h-5 text-blue-500" />
      case 'trip-completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'trip-cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'trip-transferred':
        return <RefreshCw className="w-5 h-5 text-purple-500" />
      case 'drops-credited':
        return <Droplet className="w-5 h-5 text-purple-500" />
      case 'admin-alert':
        return <BellRing className="w-5 h-5 text-orange-brand" />
      default:
        return <MessageSquare className="w-5 h-5 text-orange-brand" />
    }
  }

  const handleAction = () => {
    if (toast.actionUrl) {
      router.push(toast.actionUrl)
    }
    setToast(null)
  }

  return (
    <div className="fixed top-4 right-4 z-[200] w-full max-w-sm sm:max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
      <div 
        className="relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-border bg-card/95 text-card-foreground shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all"
      >
        {/* Pulsing indicator dot */}
        <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />

        <div className="flex items-start gap-3.5 relative z-10 pl-2">
          {/* Icon Box */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-surface-elevated border border-border shadow-sm">
            {getToastIcon()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-black text-foreground truncate pr-2">
                {toast.title}
              </p>
              <button 
                onClick={() => setToast(null)}
                className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2.5">
              {toast.content}
            </p>

            {toast.actionUrl && (
              <button
                onClick={handleAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-brand hover:bg-orange-dark text-white transition-all shadow-sm cursor-pointer"
              >
                <span>{toast.actionLabel || 'View Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
