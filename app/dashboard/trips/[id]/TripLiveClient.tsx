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
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  X,
  Copy,
  Check,
  Star,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { pusherClient } from '@/lib/pusher-client'
import { SosModal } from '@/components/dashboard/SosModal'

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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestMessageTimeRef = useRef<string | null>(null)

  const isRider = trip.riderId === currentUserId
  const driver = trip.driver
  const driverProfile = driver?.driverProfile
  const driverPhone = driverProfile?.phone || driver?.phoneNumber || ''

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

      channel.bind('trip-completed', () => {
        if (!mounted) return
        if (isRider) {
          router.push(`/rate/${trip.id}`)
        } else {
          router.push('/driver')
        }
      })

      channel.bind('trip-cancelled', () => {
        if (!mounted) return
        alert('This trip was cancelled.')
        router.push(isRider ? '/dashboard' : '/driver')
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
        channel.unbind('trip-completed')
        channel.unbind('trip-cancelled')
        pusherClient.unsubscribe(`trip-${trip.id}`)
      }
    }
  }, [trip.id, currentUserId, isRider, router, driverArrivedNotice])

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

  // Download ICS
  const handleDownloadCalendar = () => {
    const dateStr = trip.isScheduled ? `${trip.date}T${trip.time}` : new Date().toISOString()
    const scheduledAt = new Date(dateStr).getTime()
    if (isNaN(scheduledAt)) return

    const dtStart = new Date(scheduledAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const dtEnd = new Date(scheduledAt + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const summary = `TOVEDROP Ride with ${driver?.name || 'Driver'}`
    const description = `Pickup: ${trip.pickup}\\nDestination: ${trip.destination}${driverPhone ? '\\nDriver Phone: ' + driverPhone : ''}`

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
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tovedrop-ride-${trip.id}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/track/${trip.shareToken || trip.id}` : ''

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ── Top Navigation Bar ── */}
      <div className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {driverArrivedNotice ? 'Driver Arrived' : 'Confirmed & Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* ── Driver Arrival Live Alert Banner ── */}
        {driverArrivedNotice && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-foreground flex items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Car className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  Your Driver Has Arrived at {trip.pickup}!
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please proceed to your pickup point. Your driver is waiting for you.
                </p>
              </div>
            </div>
            {driverPhone && (
              <a
                href={`tel:${driverPhone}`}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Driver
              </a>
            )}
          </div>
        )}

        {/* ── Hero Status Ribbon ── */}
        <div className="bg-gradient-to-r from-card via-card to-card/90 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--orange-brand)]">
                  Live Trip Portal
                </span>
                <span className="text-muted-foreground text-xs">&middot;</span>
                <span className="text-xs text-muted-foreground font-mono">#{trip.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {driverArrivedNotice ? 'Driver at Pickup Location' : 'Driver Accepted & En Route'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                Your ride with <span className="font-bold text-foreground">{driver?.name ?? 'your driver'}</span> is confirmed. You can coordinate in real time, track vehicle details, and share your live status.
              </p>
            </div>

            {/* Time / Schedule Badge */}
            <div className="bg-background/80 border border-border/80 rounded-2xl p-4 shrink-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--orange-brand)]/10 text-[var(--orange-brand)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Scheduled Departure</p>
                <p className="text-sm font-extrabold text-foreground">
                  {trip.isScheduled ? `${trip.date} at ${trip.time}` : `Instant Pick-Up (${trip.time})`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Driver Info + Route + Safety Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Driver & Vehicle Showcase Card */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Verified Driver & Vehicle
                </h2>
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Background Vetted
                </span>
              </div>

              {/* Driver Profile Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-border shadow-md">
                      <AvatarImage src={driver?.image || ''} />
                      <AvatarFallback className="text-base font-bold bg-muted text-foreground">
                        {driver ? initials(driver.name) : 'TD'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-card text-[10px]">
                      ✓
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">{driver?.name ?? 'Assigned Driver'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {driverProfile?.rating > 0 ? driverProfile.rating.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-muted-foreground text-xs">&middot;</span>
                      <span className="text-xs text-muted-foreground">{driverProfile?.totalTrips ?? 0} campus rides</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Contacts */}
                <div className="flex items-center gap-2 shrink-0">
                  {driverPhone && (
                    <a
                      href={`tel:${driverPhone}`}
                      className="px-3.5 py-2.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Call Driver"
                    >
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  )}
                  {driverPhone && (
                    <a
                      href={`https://wa.me/${driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${driver?.name || 'Driver'}, I am waiting at ${trip.pickup} for our TOVEDROP ride!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="WhatsApp Driver"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Vehicle Specifications Box */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
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
                    <div className="px-3 py-1 rounded-md bg-white text-slate-900 font-mono font-black tracking-widest border-2 border-emerald-600 shadow-sm inline-flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] text-emerald-700 font-sans font-bold">🇳🇬</span>
                      <span>{driverProfile.vehiclePlate}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">Plate Pending</span>
                  )}
                </div>

                {driverProfile?.bio && (
                  <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/40">
                    "{driverProfile.bio}"
                  </p>
                )}
              </div>
            </div>

            {/* 2. Pickup & Destination Route Details */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
                Route & Pickup Details
              </h2>

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

                <div className="ml-4 pl-4 border-l-2 border-dashed border-border py-1 text-xs text-muted-foreground">
                  Direct Campus Route
                </div>

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
                  <div className="mt-3 p-3 rounded-xl bg-background border border-border text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Rider Note:</span> {trip.notes}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Safety & Control Action Center */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
                Trip Actions & Safety Tools
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Share Live Trip Button */}
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="p-3.5 rounded-2xl bg-background border border-border hover:border-[var(--orange-brand)] flex items-center gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-[var(--orange-brand)] transition-colors">
                      Share Live Trip
                    </p>
                    <p className="text-[11px] text-muted-foreground">Send tracking link to friends</p>
                  </div>
                </button>

                {/* Add to Calendar Button */}
                <button
                  type="button"
                  onClick={handleDownloadCalendar}
                  className="p-3.5 rounded-2xl bg-background border border-border hover:border-[var(--orange-brand)] flex items-center gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--orange-brand)]/10 text-[var(--orange-brand)] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-[var(--orange-brand)] transition-colors">
                      Add to Calendar
                    </p>
                    <p className="text-[11px] text-muted-foreground">Phone reminder (.ics)</p>
                  </div>
                </button>

                {/* Campus SOS Button */}
                <button
                  type="button"
                  onClick={() => setActiveSos(true)}
                  className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:border-red-500 flex items-center gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-500">Emergency SOS</p>
                    <p className="text-[11px] text-muted-foreground">Siren & Security dispatch</p>
                  </div>
                </button>

                {/* Cancel Ride Button */}
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelTrip}
                  className="p-3.5 rounded-2xl bg-background border border-border hover:border-red-500 flex items-center gap-3 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground group-hover:text-red-500 flex items-center justify-center shrink-0 transition-colors">
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-red-500 transition-colors">
                      Cancel Ride
                    </p>
                    <p className="text-[11px] text-muted-foreground">Refund 1 Drop (if &gt; 2h)</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat with Driver (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px] sticky top-24">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={driver?.image || ''} />
                      <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                        {driver ? initials(driver.name) : 'TD'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-card animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Chat with {driver?.name?.split(' ')[0] ?? 'Driver'}</h3>
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
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50"
                style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
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
                              ? 'bg-[var(--orange-brand)] text-white rounded-br-sm'
                              : 'bg-card border border-border text-foreground rounded-bl-sm'
                          }`}
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

              {/* Chat Input Field */}
              <div className="p-3 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message ${driver?.name?.split(' ')[0] ?? 'driver'}...`}
                    className="w-full bg-muted/60 border border-border rounded-full pl-4 pr-11 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="absolute right-1 w-8 h-8 rounded-full bg-[var(--orange-brand)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                  >
                    {sendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Share Trip Modal ── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-foreground mb-1">Share Live Ride Status</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Anyone with this link can track your driver details, vehicle plate, and live ride progress in real time.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly
                value={shareUrl}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  setCopiedShare(true)
                  setTimeout(() => setCopiedShare(false), 2000)
                }}
                className="p-2.5 rounded-xl bg-[var(--orange-brand)] text-white hover:opacity-90 shrink-0 cursor-pointer"
              >
                {copiedShare ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I'm riding on TOVEDROP with ${driver?.name || 'my driver'}! Track my live trip status here: ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow"
            >
              <MessageCircle className="w-4 h-4" />
              Share via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── Emergency SOS Siren Modal ── */}
      {activeSos && (
        <SosModal trip={trip} onClose={() => setActiveSos(false)} />
      )}
    </div>
  )
}
