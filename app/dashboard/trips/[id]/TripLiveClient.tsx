'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Car,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Share2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  X,
  Copy,
  Check,
  Star,
  Gift,
  AlertTriangle,
  Bell
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { pusherClient } from '@/lib/pusher-client'
import { SosModal } from '@/components/dashboard/SosModal'
import { TripProgressStepper } from '@/components/trip/TripProgressStepper'
import { SetAlarmModal } from '@/components/driver/SetAlarmModal'
import { AlarmModal } from '@/components/driver/AlarmModal'
import { useDriverAlarms } from '@/hooks/useDriverAlarms'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
}

interface TripLiveClientProps {
  initialTrip: any
  currentUserId: string
}

// Gentle incoming message chime
function playChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, now)
    osc.frequency.setValueAtTime(880, now + 0.1)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  } catch (e) {}
}

export function TripLiveClient({ initialTrip, currentUserId }: TripLiveClientProps) {
  const router = useRouter()
  const [trip, setTrip] = useState<any>(initialTrip)
  const [messages, setMessages] = useState<Message[]>(initialTrip.messages || [])
  const [inputText, setInputText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeSos, setActiveSos] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [driverArrivedNotice, setDriverArrivedNotice] = useState(!!initialTrip.driverArrivedAt)
  const [driverDepartedNotice, setDriverDepartedNotice] = useState(!!initialTrip.driverDepartedAt)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [alarmModalOpen, setAlarmModalOpen] = useState(false)
  const [tripReminders, setTripReminders] = useState<any[]>(initialTrip.tripReminders || [])
  const [expiredNotice, setExpiredNotice] = useState<string | null>(
    initialTrip.status === 'CANCELLED' && !initialTrip.driverId
      ? (initialTrip.notes?.includes('Expired')
          ? 'No driver was able to accept your ride request before the pickup time passed. Your 1 Drop has been automatically refunded to your wallet.'
          : 'This ride request was cancelled. Your Drop has been refunded.')
      : null
  )

  const quickMessages = [
    "I'm waiting outside 📍",
    "Coming down in 2 mins 🏃",
    "I'm by the gate 🚪",
    "I see your car! 👋"
  ]

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestMessageTimeRef = useRef<string | null>(null)

  const isRider = trip.riderId === currentUserId
  const rider = trip.rider
  const driver = trip.driver
  const driverProfile = driver?.driverProfile
  const driverPhone = driverProfile?.phone || driver?.phoneNumber || ''
  const riderPhone = rider?.phoneNumber || ''
  const contactPhone = isRider ? driverPhone : riderPhone
  const contactLabel = isRider ? 'Driver' : 'Rider'

  const { activeAlarm, dismissAlarm } = useDriverAlarms(
    !isRider ? [{ ...trip, tripReminders }] : [],
    driverProfile || { alarmEnabled: true, alarmTimes: [30, 10, 2], alarmSound: 'loud', alarmVibrate: true }
  )

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/track/${trip.shareToken || trip.id}` : ''

  const getWhatsAppShareUrl = () => {
    const driverName = driver?.name || 'My driver'
    const plate = driverProfile?.vehiclePlate ? ` (${driverProfile.vehiclePlate})` : ''
    const text = encodeURIComponent(
      `Hey! I'm on a TOVEDROP campus ride with ${driverName}${plate}. You can track my live ride status here: ${shareUrl}`
    )
    return `https://api.whatsapp.com/send?text=${text}`
  }

  const initials = (name: string) =>
    name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?'

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Track latest message timestamp
  useEffect(() => {
    if (messages.length > 0) {
      latestMessageTimeRef.current = messages[messages.length - 1].createdAt
    }
  }, [messages])

  // Real-time synchronization (Pusher + Resilient Polling)
  useEffect(() => {
    let mounted = true

    // 1. Pusher realtime listener
    let channel: any = null
    if (pusherClient) {
      channel = pusherClient.subscribe(`trip-${trip.id}`)

      channel.bind('new-message', (newMsg: Message) => {
        if (!mounted) return
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          if (newMsg.senderId !== currentUserId) playChime()
          const filtered = prev.filter(m => !m.id.startsWith('optimistic-'))
          return [...filtered, newMsg]
        })
        latestMessageTimeRef.current = newMsg.createdAt
      })

      channel.bind('driver-arrived', (data: any) => {
        if (!mounted) return
        setDriverArrivedNotice(true)
        setTrip((prev: any) => ({ ...prev, driverArrivedAt: new Date().toISOString() }))
        playChime()
      })

      channel.bind('driver-departed', (data: any) => {
        if (!mounted) return
        setDriverDepartedNotice(true)
        setTrip((prev: any) => ({
          ...prev,
          driverDepartedAt: data?.departedAt || new Date().toISOString(),
          driverArrivedAt: prev.driverArrivedAt || new Date().toISOString()
        }))
        playChime()
      })

      channel.bind('trip-overdue-updated', (data: any) => {
        if (!mounted) return
        setTrip((prev: any) => ({
          ...prev,
          isOverdue: true,
          riderCompensatedAt: data.riderCompensatedAt || prev.riderCompensatedAt || new Date().toISOString(),
          driverPenalizedAt: data.driverPenalizedAt || prev.driverPenalizedAt || new Date().toISOString()
        }))
        playChime()
      })

      channel.bind('trip-completed', () => {
        if (!mounted) return
        if (isRider) {
          router.push(`/rate/${trip.id}`)
        } else {
          router.push('/driver')
        }
      })

      channel.bind('trip-expired-unaccepted', (data: any) => {
        if (!mounted) return
        setExpiredNotice(
          data?.message ||
          'No driver was able to accept your ride request before the pickup time passed. Your 1 Drop has been automatically refunded to your wallet.'
        )
        playChime()
      })

      channel.bind('trip-cancelled', (data: any) => {
        if (!mounted) return
        if (data?.reason === 'EXPIRED_NO_DRIVER' || (!trip.driverId && !data?.driverId)) {
          setExpiredNotice(
            data?.message ||
            'No driver was able to accept your ride request before the pickup time passed. Your 1 Drop has been automatically refunded to your wallet.'
          )
          playChime()
        } else {
          alert('This trip was cancelled.')
          router.push(isRider ? '/dashboard' : '/driver')
        }
      })
    }

    // 2. Resilient Fast Poller (every 3 seconds)
    const interval = setInterval(async () => {
      if (!mounted) return
      try {
        // Poll for trip status updates
        const tripRes = await fetch(`/api/trips/${trip.id}`)
        if (tripRes.ok) {
          const tripData = await tripRes.json()
          if (mounted && tripData.trip) {
            setTrip(tripData.trip)
            if (tripData.trip.driverArrivedAt && !driverArrivedNotice) {
              setDriverArrivedNotice(true)
            }
            if (tripData.trip.driverDepartedAt && !driverDepartedNotice) {
              setDriverDepartedNotice(true)
            }
            if (tripData.trip.status === 'CANCELLED' && !tripData.trip.driverId) {
              setExpiredNotice(
                tripData.trip.notes?.includes('Expired')
                  ? 'No driver was able to accept your ride request before the pickup time passed. Your 1 Drop has been automatically refunded to your wallet.'
                  : 'This ride request was cancelled. Your Drop has been refunded.'
              )
              return
            }
            if (tripData.trip.status === 'COMPLETED' && isRider) {
              router.push(`/rate/${trip.id}`)
              return
            }
          }
        }

        // Poll for new messages
        const afterParam = latestMessageTimeRef.current ? `?after=${encodeURIComponent(latestMessageTimeRef.current)}` : ''
        const msgRes = await fetch(`/api/trips/${trip.id}/messages${afterParam}`)
        if (msgRes.ok) {
          const msgData = await msgRes.json()
          if (mounted && Array.isArray(msgData.messages) && msgData.messages.length > 0) {
            let otherSent = false
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id))
              const newItems = msgData.messages.filter((m: Message) => !existingIds.has(m.id))
              if (newItems.length === 0) return prev
              newItems.forEach((m: Message) => {
                if (m.senderId !== currentUserId) otherSent = true
              })
              const withoutOptimistic = prev.filter(m => !m.id.startsWith('optimistic-'))
              return [...withoutOptimistic, ...newItems]
            })
            if (otherSent) playChime()
            latestMessageTimeRef.current = msgData.messages[msgData.messages.length - 1].createdAt
          }
        }
      } catch (err) {
        // silent
      }
    }, 3000)

    return () => {
      mounted = false
      clearInterval(interval)
      if (channel && pusherClient) {
        channel.unbind('new-message')
        channel.unbind('driver-arrived')
        channel.unbind('driver-departed')
        channel.unbind('trip-overdue-updated')
        channel.unbind('trip-completed')
        channel.unbind('trip-cancelled')
        pusherClient.unsubscribe(`trip-${trip.id}`)
      }
    }
  }, [trip.id, currentUserId, isRider, router, driverArrivedNotice, driverDepartedNotice])

  // Instant on-demand check for overdue pickup guarantee on mount
  useEffect(() => {
    if (trip.status === 'CONFIRMED' && !trip.driverArrivedAt && !trip.driverDepartedAt && !trip.riderCompensatedAt) {
      fetch(`/api/trips/${trip.id}/check-overdue`, { method: 'POST' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.trip) {
            setTrip(data.trip)
          }
        })
        .catch(() => {})
    }
  }, [trip.id, trip.status, trip.driverArrivedAt, trip.driverDepartedAt, trip.riderCompensatedAt])

  // Driver actions
  const handleDriverArrive = async () => {
    setActionLoading('arrive')
    try {
      const res = await fetch(`/api/trips/${trip.id}/arrive`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to mark arrival')
      }
      setDriverArrivedNotice(true)
      setTrip((prev: any) => ({ ...prev, driverArrivedAt: new Date().toISOString() }))
    } catch (err: any) {
      alert(err.message || 'Error marking arrival')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDriverDepart = async () => {
    setActionLoading('depart')
    try {
      const res = await fetch(`/api/trips/${trip.id}/depart`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to notify take off')
      }
      setDriverDepartedNotice(true)
      setTrip((prev: any) => ({
        ...prev,
        driverDepartedAt: new Date().toISOString(),
        driverArrivedAt: prev.driverArrivedAt || new Date().toISOString()
      }))
    } catch (err: any) {
      alert(err.message || 'Error notifying passenger of departure')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDriverComplete = async () => {
    if (!window.confirm('Mark this trip as completed?')) return
    setActionLoading('complete')
    try {
      const res = await fetch('/api/trips/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to complete trip')
      }
      router.push('/driver')
    } catch (err: any) {
      alert(err.message || 'Error completing trip')
    } finally {
      setActionLoading(null)
    }
  }

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sendingMessage) return

    const content = inputText.trim()
    setInputText('')
    setSendingMessage(true)

    const optimisticId = 'optimistic-' + Date.now()
    const optimisticMsg: Message = {
      id: optimisticId,
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch(`/api/trips/${trip.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error('Failed to send')
      const json = await res.json()
      setMessages(prev => prev.map(m => m.id === optimisticId ? json.message : m))
      latestMessageTimeRef.current = json.message.createdAt
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInputText(content)
      alert('Could not send message. Please retry.')
    } finally {
      setSendingMessage(false)
    }
  }

  // Cancel trip
  const handleCancelTrip = async () => {
    if (!window.confirm('Are you sure you want to cancel this trip? Cancelling outside 2 hours refunds your 1 Drop.')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error('Cancel failed')
      alert('Trip has been cancelled.')
      router.push('/dashboard')
    } catch (e) {
      alert('Failed to cancel trip. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }} className="text-foreground pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 md:py-8 landscape:py-3 space-y-6">

        {/* ── Top Bar & Back Navigation on Curved Orange Wave ── */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={isRider ? "/dashboard" : "/driver"}
            id="live-trip-back-btn"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/95 hover:text-white transition-all drop-shadow-sm group px-3 py-1.5 rounded-lg bg-black/15 hover:bg-black/25 backdrop-blur-md border border-white/15 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>{isRider ? "Back to Dashboard" : "Back to Driver Hub"}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-black/20 text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${driverDepartedNotice ? 'bg-amber-400 animate-ping' : driverArrivedNotice ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              {driverDepartedNotice ? 'Taking Off / En Route 🚗💨' : driverArrivedNotice ? 'Driver Arrived 📍' : 'Confirmed & Active'}
            </span>
          </div>
        </div>

        {/* ── Hero Title on Curved Orange Wave ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/90 drop-shadow-sm">
                Live Ride Portal
              </p>
              <span className="text-white/60 text-xs">&middot;</span>
              <span className="text-[11px] font-mono text-white/80 drop-shadow-sm">#{trip.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold truncate text-white drop-shadow-sm" style={{ letterSpacing: '-0.01em' }}>
              {driverDepartedNotice
                ? `Taking Off to ${trip.destination} 🚗💨`
                : driverArrivedNotice
                ? 'Driver at Pickup Location 📍'
                : (driver?.name ? `Trip with ${driver.name}` : 'Live Trip Details')}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 truncate text-white/90 font-medium drop-shadow-sm flex items-center gap-1.5">
              <span>{trip.pickup}</span>
              <span className="text-white/60">&rarr;</span>
              <span>{trip.destination}</span>
            </p>
          </div>

          {/* Scheduled Departure Pill on Orange Header */}
          <div className="px-3.5 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/20 text-white flex items-center gap-2.5 shadow-sm shrink-0 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-white/90" />
            <div>
              <p className="text-[9px] uppercase font-bold text-white/75 leading-none">Scheduled</p>
              <p className="text-xs font-bold text-white mt-0.5">
                {trip.isScheduled ? `${trip.date} at ${trip.time}` : `Instant (${trip.time})`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Real-Time Journey Lifecycle Stepper & Live Countdown ── */}
        <TripProgressStepper trip={trip} />

        {/* ── Driver Progress Banners ── */}
        {driverDepartedNotice ? (
          <div
            className="rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2"
            style={{
              background: 'var(--surface-card)',
              border: '2px solid var(--orange-brand)',
              boxShadow: '0 8px 30px rgba(249,115,22,0.18)'
            }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md animate-pulse"
                style={{ background: 'var(--orange-brand)' }}
              >
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[var(--orange-brand)]">
                  Taking Off to {trip.destination}! 🚗💨
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRider
                    ? `${driver?.name || 'Your driver'} is now taking off with you. Have a safe and smooth campus ride!`
                    : `Taking off with ${rider?.name || 'your rider'}. Have a safe and smooth campus ride!`}
                </p>
              </div>
            </div>
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:border-[var(--orange-brand)] text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                style={{ background: 'var(--surface-elevated)' }}
              >
                <Phone className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
                Call {contactLabel}
              </a>
            )}
          </div>
        ) : driverArrivedNotice ? (
          <div
            className="rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2"
            style={{
              background: 'var(--surface-card)',
              border: '2px solid #22c55e',
              boxShadow: '0 8px 30px rgba(34,197,94,0.18)'
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Car className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-emerald-500">
                  {isRider ? `Your Driver Has Arrived at ${trip.pickup}!` : `You Have Arrived at ${trip.pickup}!`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRider
                    ? 'Please proceed to your pickup point. Your driver is waiting for you.'
                    : `Waiting for ${rider?.name?.split(' ')[0] || 'the rider'} to meet you at pickup point.`}
                </p>
              </div>
            </div>
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                Call {contactLabel}
              </a>
            )}
          </div>
        ) : null}

        {/* ── Overdue Pickup & Rider Compensation Banner ── */}
        {(trip.isOverdue || trip.riderCompensatedAt) && (
          <div
            className="rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border animate-in fade-in slide-in-from-top-2"
            style={{
              background: isRider ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: isRider ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: isRider ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: isRider ? '#22c55e' : '#f59e0b'
                }}
              >
                {isRider ? <Gift className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <p
                  className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: isRider ? '#22c55e' : '#f59e0b' }}
                >
                  {isRider ? '🎁 On-Time Guarantee Applied (+1 Free Drop)' : '⚠️ Late Pickup Warning Notice'}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                  {isRider
                    ? '1 Free Drop has been credited to your balance!'
                    : 'Scheduled pickup was delayed by over 15 minutes'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xl">
                  {isRider
                    ? 'Because your driver was delayed by more than 15 minutes past the scheduled pickup time, we automatically reimbursed you with 1 Free Drop as part of our punctuality commitment.'
                    : 'This ride has exceeded the 15-minute grace period without pickup. The rider received a free compensation drop, and a warning was recorded on your driver profile. (3 warnings result in suspension and a ₦1,000 penalty).'}
                </p>
              </div>
            </div>
            {isRider && (
              <span className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                +1 Drop Credited
              </span>
            )}
          </div>
        )}

        {/* ── Driver Progress Controls (when viewed by driver) ── */}
        {!isRider && (
          <div
            className="rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--orange-brand)] flex items-center gap-1.5">
                  <Car className="w-4 h-4" />
                  Driver Live Controls
                </p>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {driverDepartedNotice
                    ? 'Taking Off / En Route to Destination'
                    : driverArrivedNotice
                    ? 'Arrived at Pickup — Ready to Depart?'
                    : 'En Route to Pickup Point'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {driverDepartedNotice
                    ? 'Passenger and TOVEDROP have been notified that you are in transit.'
                    : driverArrivedNotice
                    ? 'Notify passenger and TOVEDROP once all passengers are on board.'
                    : 'Tap "I\'ve Arrived" once you reach the passenger pickup location.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {!driverDepartedNotice && (
                  <button
                    type="button"
                    onClick={() => setAlarmModalOpen(true)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      tripReminders.length > 0
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                        : 'bg-surface-elevated border-border hover:border-amber-500/40 text-foreground'
                    }`}
                    title="Set an alarm a few minutes before pickup"
                  >
                    <Bell className={`w-3.5 h-3.5 ${tripReminders.length > 0 ? 'text-amber-400 animate-pulse' : ''}`} />
                    <span>{tripReminders.length > 0 ? `${tripReminders[0].type} Alarm Active` : 'Set Alarm ⏰'}</span>
                  </button>
                )}

                {!driverArrivedNotice && (
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={handleDriverArrive}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'arrive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    <span>I've Arrived 📍</span>
                  </button>
                )}

                {!driverDepartedNotice ? (
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={handleDriverDepart}
                    className="px-4 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
                    style={{ background: 'var(--orange-brand)' }}
                  >
                    {actionLoading === 'depart' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>Taking Off with Passenger 🚀</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    En Route 🚗💨
                  </span>
                )}

                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleDriverComplete}
                  className="px-4 py-2.5 rounded-xl border border-border hover:border-emerald-500 text-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--surface-elevated)' }}
                >
                  {actionLoading === 'complete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>Complete Ride</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Driver Info + Route + Safety Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Driver & Vehicle Showcase Card */}
            <div
              className="rounded-xl shadow-lg backdrop-blur-md transition-all p-5 sm:p-6 space-y-5"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  {isRider ? 'Verified Driver & Vehicle' : 'Campus Rider Details'}
                </p>
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRider ? 'Background Vetted' : 'Verified Student/Staff'}
                </span>
              </div>

              {/* Driver/Rider Profile Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border border-border shadow-md">
                      <AvatarImage src={(isRider ? driver?.image : rider?.image) || ''} />
                      <AvatarFallback className="text-base font-bold bg-muted text-foreground">
                        {isRider ? (driver ? initials(driver.name) : 'TD') : (rider ? initials(rider.name) : 'RD')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[var(--surface-card)] text-[10px] font-bold">
                      ✓
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                      {isRider ? (driver?.name ?? 'Assigned Driver') : (rider?.name ?? 'Campus Rider')}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isRider ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {driverProfile?.rating > 0 ? driverProfile.rating.toFixed(1) : '5.0'}
                          </span>
                          <span className="text-muted-foreground text-xs">&middot;</span>
                          <span className="text-xs text-muted-foreground">{driverProfile?.totalTrips ?? 0} campus rides</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{rider?.email ?? 'Campus Passenger'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Contacts */}
                <div className="flex items-center gap-2 shrink-0">
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone}`}
                      className="px-3.5 py-2 rounded-xl border border-border hover:border-emerald-500 text-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      style={{ background: 'var(--surface-elevated)' }}
                      title={`Call ${contactLabel}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Call {contactLabel}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Vehicle Specifications Box */}
              <div
                className="p-4 rounded-xl space-y-3"
                style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[var(--orange-brand)]" />
                    <span className="text-xs font-bold text-foreground">
                      {driverProfile?.vehicleColor ? `${driverProfile.vehicleColor} ` : ''}
                      {driverProfile?.vehicleMake ?? 'Campus Vehicle'}{' '}
                      {driverProfile?.vehicleModel ?? ''}
                    </span>
                    {driverProfile?.vehicleType && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {driverProfile.vehicleType}
                      </span>
                    )}
                  </div>

                  {/* Realistic License Plate Badge */}
                  {driverProfile?.vehiclePlate ? (
                    <div className="px-2.5 py-1 rounded-md bg-white text-slate-900 font-mono font-black tracking-widest border border-emerald-600 shadow-sm inline-flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] text-emerald-700 font-sans font-bold">🇳🇬</span>
                      <span>{driverProfile.vehiclePlate}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">Plate Pending</span>
                  )}
                </div>

                {driverProfile?.bio && (
                  <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
                    "{driverProfile.bio}"
                  </p>
                )}
              </div>
            </div>

            {/* 2. Pickup & Destination Route Details */}
            <div
              className="rounded-xl shadow-lg backdrop-blur-md transition-all p-5 sm:p-6 space-y-4"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground pb-2 border-b border-border">
                Route & Pickup Details
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pickup Location</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{trip.pickup}</p>
                  </div>
                </div>

                <div className="ml-4 pl-4 border-l-2 border-dashed border-border/70 h-4" />

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--orange-brand)]/10 border border-[var(--orange-brand)]/30 flex items-center justify-center text-[var(--orange-brand)] shrink-0 mt-0.5">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Destination Drop-Off</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{trip.destination}</p>
                  </div>
                </div>

                {trip.notes && (
                  <div
                    className="mt-3 p-3 rounded-xl text-xs text-muted-foreground"
                    style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    <span className="font-semibold text-foreground">Rider Note:</span> {trip.notes}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Safety & Control Action Center */}
            <div
              className="rounded-xl shadow-lg backdrop-blur-md transition-all p-5 sm:p-6 space-y-4"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground pb-2 border-b border-border">
                {isRider ? 'Trip Actions & Safety Tools' : 'Trip Management'}
              </p>

              <div className={isRider ? "grid grid-cols-1 sm:grid-cols-3 gap-3" : "grid grid-cols-1 gap-3"}>
                {/* Share Live Trip Button (Rider Only) */}
                {isRider && (
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="p-3.5 rounded-xl border border-border hover:border-[var(--orange-brand)] flex items-center gap-3 text-left transition-all cursor-pointer group"
                    style={{ background: 'var(--surface-elevated)' }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-[var(--orange-brand)] transition-colors">
                        Share Ride
                      </p>
                      <p className="text-[11px] text-muted-foreground">Tracking link</p>
                    </div>
                  </button>
                )}

                {/* Campus SOS Button (Rider Only) */}
                {isRider && (
                  <button
                    type="button"
                    onClick={() => setActiveSos(true)}
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500 flex items-center gap-3 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-500">Emergency SOS</p>
                      <p className="text-[11px] text-muted-foreground">Security siren</p>
                    </div>
                  </button>
                )}

                {/* Cancel Ride Button */}
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelTrip}
                  className="p-3.5 rounded-xl border border-border hover:border-red-500 flex items-center gap-3 text-left transition-all cursor-pointer group disabled:opacity-50"
                  style={{ background: 'var(--surface-elevated)' }}
                >
                  <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground group-hover:text-red-500 flex items-center justify-center shrink-0 transition-colors">
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-red-500 transition-colors">
                      Cancel Ride
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isRider ? 'Refund policy' : 'Driver cancellation policy'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat with Driver/Rider (5 cols) */}
          <div className="lg:col-span-5">
            <div
              className="rounded-xl shadow-lg backdrop-blur-md transition-all overflow-hidden flex flex-col h-[620px] sticky top-6"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between" style={{ background: 'var(--surface-elevated)' }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-9 h-9 border border-border">
                      <AvatarImage src={(isRider ? driver?.image : rider?.image) || ''} />
                      <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                        {isRider ? (driver ? initials(driver.name) : 'TD') : (rider ? initials(rider.name) : 'RD')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[var(--surface-card)] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Chat with {isRider ? (driver?.name?.split(' ')[0] ?? 'Driver') : (rider?.name?.split(' ')[0] ?? 'Rider')}
                    </h3>
                    <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Active Connection</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Instant</span>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ background: 'var(--background)' }}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-[var(--orange-brand)]/10 text-[var(--orange-brand)] flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-foreground mb-1">Direct Driver Messaging</p>
                    <p className="text-[11px] leading-relaxed max-w-xs">
                      Say hi or inform {driver?.name?.split(' ')[0] ?? 'your driver'} if you're waiting in a specific spot.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUserId
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium break-words shadow-sm ${
                            isMe
                              ? 'text-white rounded-br-sm'
                              : 'border border-border text-foreground rounded-bl-sm'
                          }`}
                          style={{
                            background: isMe ? 'var(--orange-brand)' : 'var(--surface-elevated)'
                          }}
                        >
                          <p className="leading-relaxed">{m.content}</p>
                          <p className={`text-[9px] mt-1 text-right font-semibold uppercase tracking-wider ${isMe ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Quick Pre-Set Message Chips */}
              <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-border/70" style={{ background: 'var(--surface-elevated)' }}>
                {quickMessages.map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputText(msg)}
                    className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border shadow-xs transition-colors cursor-pointer"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* Chat Input Field */}
              <div className="p-3 border-t border-border" style={{ background: 'var(--surface-card)' }}>
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message ${driver?.name?.split(' ')[0] ?? 'driver'}...`}
                    className="w-full border border-border rounded-full pl-4 pr-11 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                    style={{ background: 'var(--surface-elevated)' }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="absolute right-1 w-8 h-8 rounded-full text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-sm"
                    style={{ background: 'var(--orange-brand)' }}
                  >
                    {sendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Share Trip Modal (Rider Only) ── */}
      {isRider && shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-xl p-6 shadow-2xl relative"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
          >
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-foreground mb-1">Share Live Ride Status</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Anyone with this link can track your driver details, vehicle plate, and live ride progress in real time.
            </p>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="w-full border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground select-all font-mono"
                style={{ background: 'var(--surface-elevated)' }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  setCopiedShare(true)
                  setTimeout(() => setCopiedShare(false), 2000)
                }}
                className="px-3.5 py-2 rounded-xl text-white hover:opacity-90 shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5 text-xs font-bold"
                style={{ background: 'var(--orange-brand)' }}
              >
                {copiedShare ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShare ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* WhatsApp 1-Click Share Button */}
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Share via WhatsApp 💬</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Emergency SOS Siren Modal (Rider Only) ── */}
      {isRider && activeSos && (
        <SosModal trip={trip} onClose={() => setActiveSos(false)} />
      )}

      {/* ── Driver Set Pickup Alarm Modal ── */}
      {!isRider && (
        <SetAlarmModal
          trip={{ ...trip, tripReminders }}
          isOpen={alarmModalOpen}
          onClose={() => setAlarmModalOpen(false)}
          onAlarmSaved={(savedReminder) => {
            if (savedReminder) {
              setTripReminders([savedReminder])
            } else {
              setTripReminders([])
            }
          }}
        />
      )}

      {/* ── Driver Inbuilt Ringing Alarm Modal ── */}
      {!isRider && activeAlarm && (
        <AlarmModal
          trip={activeAlarm.trip}
          minutesBefore={activeAlarm.minutesBefore}
          alarmSound={driverProfile?.alarmSound || 'loud'}
          alarmVibrate={driverProfile?.alarmVibrate ?? true}
          alarmDuration={60}
          onDismiss={dismissAlarm}
        />
      )}

      {/* ── Expired / Unaccepted Trip Modal ── */}
      {expiredNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mb-4">
              ⏰
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">
              Pickup Time Passed
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              {expiredNotice}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <Link
                href="/book"
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white text-center shadow-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--orange-brand)' }}
              >
                Book a New Ride 🚗
              </Link>
              <Link
                href="/dashboard"
                className="py-3 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border text-center transition-all hover:bg-muted"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
