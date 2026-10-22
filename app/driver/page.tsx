'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Calendar, Clock, Star, Car,
  CheckCircle, XCircle, Loader2, Check, MessageCircle, Settings, Navigation, ExternalLink, AlertTriangle, BellRing, Volume2, VolumeX
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SkeletonStatCard, SkeletonTripCard } from '@/components/shared/SkeletonVariants'
import { Skeleton } from '@/components/shared/Skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChatModal } from '@/components/chat-modal'
import { checkTripClash } from '@/lib/trip-schedule'
import { useDriverAlarms } from '@/hooks/useDriverAlarms'
import { AlarmModal } from '@/components/driver/AlarmModal'
import { HighVisibilityTripCard } from '@/components/driver/HighVisibilityTripCard'
import { TripCommitmentModal } from '@/components/driver/TripCommitmentModal'

// ─── Design tokens ─────────────────────────────────────
// bg var(--background) / surface var(--surface-card) / border var(--border-default) / divider var(--border)
// label: 11px / uppercase / tracking-[0.05em] / #555
// text: var(--foreground) / #888 / #555
// accent: var(--orange-brand) (amber — CTA only)
// radius: 8px cards / 4px badges
// ──────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    APPROVED:  { label: 'Approved',  color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    PENDING:   { label: 'Pending',   color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.08)' },
    SUSPENDED: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  }
  const s = map[status] ?? { label: status, color: 'var(--muted-foreground)', bg: 'var(--border)' }
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
      style={{ background: s.bg, color: s.color, borderRadius: '4px' }}
    >
      {s.label}
    </span>
  )
}

function CheckRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2.5">
        <span
          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: done ? 'rgba(34,197,94,0.12)' : 'transparent',
            border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-subtle)',
          }}
        >
          {done && <Check className="w-2.5 h-2.5" style={{ color: '#22c55e' }} />}
        </span>
        <p className="text-xs font-medium" style={{ color: done ? 'var(--text-secondary)' : 'var(--muted-foreground)' }}>{label}</p>
      </div>
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: done ? '#22c55e' : 'var(--border)' }}
      >
        {detail}
      </p>
    </div>
  )
}

export default function DriverDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [declined, setDeclined] = useState<string[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeChatTrip, setActiveChatTrip] = useState<any>(null)
  const [tripForCommitment, setTripForCommitment] = useState<any | null>(null)
  const [voiceAnnounce, setVoiceAnnounce] = useState<boolean>(true)
  const prevRequestIdsRef = useRef<string[]>([])

  const { activeAlarm, dismissAlarm, triggerTestAlarm } = useDriverAlarms(
    data?.confirmedTrips || [],
    data?.driverProfile || { alarmEnabled: true, alarmTimes: [30, 10, 2], alarmSound: 'loud', alarmVibrate: true }
  )

  // Voice announcement: speaks the place & time when a new request arrives
  useEffect(() => {
    if (!data?.pendingTrips || !voiceAnnounce) return
    const currentIds = data.pendingTrips.map((t: any) => t.id)
    const newTrips = data.pendingTrips.filter(
      (t: any) => !prevRequestIdsRef.current.includes(t.id) && !declined.includes(t.id)
    )

    if (newTrips.length > 0 && prevRequestIdsRef.current.length > 0) {
      const latest = newTrips[0]
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel()
          const pickup = latest.pickup.split(',')[0]
          const time = latest.isScheduled ? latest.time : 'Instant departure'
          const u = new SpeechSynthesisUtterance(`New trip request: Pickup at ${pickup}. Time: ${time}.`)
          u.rate = 1.05
          window.speechSynthesis.speak(u)
        } catch (e) {}
      }
    }
    prevRequestIdsRef.current = currentIds
  }, [data?.pendingTrips, voiceAnnounce, declined])

  // Live GPS Location broadcaster for driver
  useEffect(() => {
    const driverId = data?.driverProfile?.userId
    const driverName = data?.driverProfile?.user?.name || 'Driver'
    if (!driverId || typeof window === 'undefined' || !('geolocation' in navigator)) return

    let watchId: number | null = null
    let lastSent = 0

    const sendLocation = async (pos: GeolocationPosition) => {
      const now = Date.now()
      if (now - lastSent < 8000) return // Throttled to 8 seconds
      lastSent = now

      try {
        await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId,
            driverName,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            status: data?.confirmedTrips?.length > 0 ? 'ON_TRIP' : 'AVAILABLE'
          })
        })
      } catch (err) {
        // silent
      }
    }

    try {
      watchId = navigator.geolocation.watchPosition(
        sendLocation,
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      )
    } catch (e) {}

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [data?.driverProfile?.userId, data?.driverProfile?.user?.name, data?.confirmedTrips?.length])

  const handleOpenCommitment = (trip: any) => {
    setTripForCommitment(trip)
  }

  const handleConfirmCommitment = async () => {
    if (!tripForCommitment) return
    const id = tripForCommitment.id
    setTripForCommitment(null)
    await handleAccept(id)
  }

  const fetchData = async () => {
    const start = Date.now()
    try {
      const res = await fetch('/api/driver/trips')
      if (res.ok) setData(await res.json())
      else if (res.status === 401) router.push('/auth')
    } catch (e) {
      console.error(e)
    } finally {
      const elapsed = Date.now() - start
      if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed))
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll every 8s as fallback safety net
    const id = setInterval(fetchData, 8000)

    const handleFocus = () => {
      fetchData()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }

    // Instant Zero-Delay updates from Pusher / Service Worker
    const handleInstantUpdate = () => {
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('tovedrop:new-trip', handleInstantUpdate)
    window.addEventListener('tovedrop:trip-updated', handleInstantUpdate)

    return () => {
      clearInterval(id)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('tovedrop:new-trip', handleInstantUpdate)
      window.removeEventListener('tovedrop:trip-updated', handleInstantUpdate)
    }
  }, [router])

  const handleAccept = async (id: string) => {
    const tripToAccept = data.pendingTrips.find((t: any) => t.id === id)
    if (!tripToAccept) return

    // 1. Snapshot
    const prevData = { ...data }
    
    // 2. Optimistic Update
    setProcessing(id)
    setData({
      ...data,
      pendingTrips: data.pendingTrips.filter((t: any) => t.id !== id),
      confirmedTrips: [{ ...tripToAccept, status: 'CONFIRMED' }, ...data.confirmedTrips]
    })
    // toast.success('Trip accepted!') would go here

    // 3. Network Request
    try {
      const res = await fetch('/api/trips/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: id }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message ?? 'Failed to accept')
      }
      await fetchData()
    } catch (err: any) {
      // 4. Rollback
      setData(prevData)
      alert(err.message || 'This trip was already accepted by another driver')
    } finally { 
      setProcessing(null) 
    }
  }

  const handleArrive = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/trips/${id}/arrive`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to notify arrival')
      }
      setData((prev: any) => ({
        ...prev,
        confirmedTrips: prev.confirmedTrips.map((t: any) =>
          t.id === id ? { ...t, driverArrivedAt: new Date().toISOString() } : t
        )
      }))
    } catch (err: any) {
      alert(err.message || 'Error marking arrival')
    } finally {
      setProcessing(null)
    }
  }

  const handleDepart = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/trips/${id}/depart`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to notify departure')
      }
      setData((prev: any) => ({
        ...prev,
        confirmedTrips: prev.confirmedTrips.map((t: any) =>
          t.id === id ? {
            ...t,
            driverDepartedAt: new Date().toISOString(),
            driverArrivedAt: t.driverArrivedAt || new Date().toISOString()
          } : t
        )
      }))
    } catch (err: any) {
      alert(err.message || 'Error notifying departure')
    } finally {
      setProcessing(null)
    }
  }

  const handleComplete = async (id: string) => {
    // 1. Snapshot
    const prevData = { ...data }

    // 2. Optimistic Update
    setProcessing(id)
    setData({
      ...data,
      confirmedTrips: data.confirmedTrips.filter((t: any) => t.id !== id),
    })

    // 3. Network Request
    try {
      const res = await fetch('/api/trips/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: id }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message ?? 'Failed to complete')
      }
      await fetchData()
    } catch (err: any) {
      // 4. Rollback
      setData(prevData)
      alert(err.message || 'Error completing trip')
    } finally { 
      setProcessing(null) 
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4">
              <Skeleton width={44} height={44} borderRadius="9999px" className="shrink-0" />
              <div>
                <Skeleton width={100} height={12} className="mb-2" />
                <Skeleton width={150} height={28} className="mb-2" />
                <Skeleton width={120} height={18} />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton width={110} height={32} borderRadius="6px" />
              <Skeleton width={80} height={32} borderRadius="6px" />
            </div>
          </div>
          <SkeletonStatCard />
          <div className="mb-6">
            <Skeleton width={130} height={12} className="mb-3" />
            <div className="rounded-lg overflow-hidden bg-surface-card border border-border-default">
              {Array.from({ length: 2 }).map((_, i) => <SkeletonTripCard key={i} />)}
            </div>
          </div>
          <div>
            <Skeleton width={160} height={12} className="mb-3" />
            <div className="rounded-lg overflow-hidden bg-surface-card border border-border-default">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonTripCard key={i} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.driverProfile) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
        <Car className="w-12 h-12 mb-4 opacity-50" style={{ color: 'var(--muted-foreground)' }} />
        <h2 className="text-xl font-bold mb-2 text-foreground">Driver Profile Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Your driver profile could not be found. Please contact support or submit a new application.
        </p>
        <Link href="/apply">
          <Button style={{ background: 'var(--orange-brand)' }} className="text-foreground hover:opacity-90">
            Apply to Drive
          </Button>
        </Link>
      </div>
    )
  }

  const { driverProfile, pendingTrips, confirmedTrips } = data
  const status = driverProfile.status

  if (status === 'PENDING') {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
        <Clock className="w-12 h-12 mb-4" style={{ color: 'var(--orange-brand)' }} />
        <h2 className="text-xl font-bold mb-2 text-foreground">Application Under Review</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We are currently reviewing your driver application. This process usually takes 24-48 hours. We'll email you once you're approved.
        </p>
      </div>
    )
  }

  if (status === 'SUSPENDED') {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-14 h-14 mb-4 text-red-500" />
        <h2 className="text-2xl font-black mb-2 text-foreground">Account Suspended</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-3 leading-relaxed">
          {driverProfile.lateWarningsCount >= 3
            ? `Your driver account was suspended after reaching ${driverProfile.lateWarningsCount} late arrival warnings (>15m delay past scheduled pickup). A ₦1,000 penalty was deducted.`
            : 'Your driver account has been temporarily suspended. Please contact TOVEDROP support to review and reactivate your account.'}
        </p>
        <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 max-w-sm mb-6">
          Late Warnings Recorded: <strong>{driverProfile.lateWarningsCount || 3} / 3</strong>
          {driverProfile.latePenaltyDeductions > 0 && (
            <span className="block mt-1">Total Late Deductions: ₦{driverProfile.latePenaltyDeductions.toLocaleString()}</span>
          )}
        </div>
        <Link href="mailto:support@tovedrop.com">
          <Button style={{ background: 'var(--orange-brand)' }} className="text-foreground hover:opacity-90 font-bold">
            Contact Support
          </Button>
        </Link>
      </div>
    )
  }

  if (status === 'REJECTED') {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2 text-foreground">Application Not Approved</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Unfortunately, your application to drive with TOVEDROP was not approved at this time.
        </p>
        <Link href="/apply">
          <Button variant="outline" className="text-foreground border-border-default hover:bg-surface-elevated">
            Reapply
          </Button>
        </Link>
      </div>
    )
  }

  const requests = pendingTrips.filter((t: any) => !declined.includes(t.id))
  const instantReqs = requests.filter((r: any) => !r.isScheduled)
  const scheduledReqs = requests.filter((r: any) => r.isScheduled)

  const instantConfirmed = confirmedTrips.filter((t: any) => !t.isScheduled)
  const scheduledConfirmed = confirmedTrips.filter((t: any) => t.isScheduled)
  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'
  const firstName = driverProfile.user.name?.split(' ')[0] ?? 'Driver'

  
  const renderRequestSection = (reqs: any[], title: string, emptyMsg: string) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
          {title}
        </p>
        {reqs.length > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5"
            style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--orange-brand)', borderRadius: '4px' }}
          >
            {reqs.length} new
          </span>
        )}
      </div>

      {reqs.length === 0 ? (
        <div
          className="rounded-lg"
          style={{ background: 'var(--surface-card)', border: '1px dashed var(--border-default)', padding: '20px' }}
        >
          <Car className="w-4 h-4 mb-2" style={{ color: 'var(--border-subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No {title.toLowerCase()}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{emptyMsg}</p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
        >
          {reqs.map((req: any, i: number) => {
            const clashInfo = checkTripClash(req, confirmedTrips)
            return (
              <div
                key={req.id}
                className="px-4 py-3"
                style={{ borderBottom: i < reqs.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--border-default)', color: 'var(--muted-foreground)' }}>
                      {initials(req.rider.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{req.rider.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {req.pickup} → {req.destination}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{req.isScheduled ? `${req.date} · ${req.time}` : `Instant Pick-Up · ${req.time}`}</p>
                      {clashInfo.clashes && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            borderColor: 'rgba(239,68,68,0.25)'
                          }}
                          title={clashInfo.reason}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Clash ({clashInfo.timeDifferenceMinutes}m)</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={processing === req.id || clashInfo.clashes}
                      onClick={() => {
                        if (clashInfo.clashes) {
                          alert(`Cannot accept: ${clashInfo.reason}`)
                          return
                        }
                        handleAccept(req.id)
                      }}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded transition-opacity"
                      style={{
                        background: clashInfo.clashes ? 'var(--border)' : 'rgba(34,197,94,0.1)',
                        color: clashInfo.clashes ? 'var(--muted-foreground)' : '#22c55e',
                        cursor: clashInfo.clashes ? 'not-allowed' : 'pointer',
                        opacity: clashInfo.clashes ? 0.6 : 1,
                        borderRadius: '4px'
                      }}
                      title={clashInfo.clashes ? clashInfo.reason : 'Accept'}
                    >
                      {processing === req.id ? '...' : clashInfo.clashes ? 'Clash ⚠️' : 'Accept'}
                    </button>
                    <button
                      disabled={processing === req.id}
                      onClick={() => setDeclined(d => [...d, req.id])}
                      className="text-[11px] font-semibold px-2.5 py-1"
                      style={{ background: 'var(--border)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
                {req.notes && (
                  <p className="text-[11px] mt-2 ml-10 px-2 py-1 rounded" style={{ background: 'var(--border)', color: 'var(--muted-foreground)', borderRadius: '4px' }}>
                    Note: {req.notes}
                  </p>
                )}
                {clashInfo.clashes && (
                  <p className="text-[10px] mt-1.5 ml-10 text-red-400 font-medium">
                    ⚠️ {clashInfo.reason}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderConfirmedSection = (trips: any[], title: string, emptyMsg: string) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
          {title}
        </p>
        {trips.length > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5"
            style={{ background: 'var(--border)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
          >
            {trips.length}
          </span>
        )}
      </div>

      {trips.length === 0 ? (
        <div
          className="rounded-lg"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', padding: '20px' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{emptyMsg}</p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
        >
          {trips.map((trip: any, i: number) => (
            <div
              key={trip.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < trips.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--border-default)', color: 'var(--muted-foreground)' }}>
                  {initials(trip.rider.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{trip.rider.name}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {trip.pickup} → {trip.destination}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  {trip.isScheduled ? `${trip.date} · ${trip.time}` : `Instant Pick-Up · ${trip.time}`}
                </p>
              </div>
              <button
                disabled={processing === trip.id}
                onClick={() => setActiveChatTrip(trip)}
                className="p-1 rounded shrink-0 transition-colors text-[var(--orange-brand)] hover:bg-foreground/5 mr-2"
                aria-label="Chat"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                disabled={processing === trip.id}
                onClick={() => handleComplete(trip.id)}
                className="text-[11px] font-semibold px-2.5 py-1 shrink-0"
                style={{ background: 'var(--border)', color: '#22c55e', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                {processing === trip.id ? '...' : 'Mark Complete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Avatar with badge overlap */}
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11">
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  {initials(driverProfile.user.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#22c55e', border: '2px solid var(--background)' }}
              >
                <Check className="w-2 h-2 text-foreground" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-0.5 text-white/90 drop-shadow-sm">
                Driver Dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold truncate text-white drop-shadow-sm" style={{ letterSpacing: '-0.01em' }}>
                {firstName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusChip status={driverProfile.status} />
                {driverProfile.rating > 0 && (
                  <span className="flex items-center gap-1 text-[11px] shrink-0 text-white/90 font-medium drop-shadow-sm">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    {driverProfile.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={triggerTestAlarm}
              className="text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all bg-[var(--orange-brand)]/15 border border-[var(--orange-brand)]/40 text-[var(--orange-brand)] hover:bg-[var(--orange-brand)]/25 cursor-pointer"
              title="Test continuous, insanely loud inbuilt alarm"
            >
              <BellRing className="w-3.5 h-3.5 animate-pulse" />
              Test Inbuilt Alarm
            </button>
            <Link
              href="/driver/earnings"
              className="text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--border)', color: 'var(--foreground)' }}
            >
              Earnings & Bank
            </Link>
            <Link
              href="/driver/settings"
              id="driver-settings-nav-btn"
              className="text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all hover:bg-white/10"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--foreground)' }}
            >
              <Settings className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
              Settings
            </Link>
          </div>
        </div>

        {/* ── Warning Banner (if driver has accumulated late warnings) ── */}
        {driverProfile.lateWarningsCount > 0 && driverProfile.status !== 'SUSPENDED' && (
          <div
            className="rounded-lg mb-6 flex items-start gap-3 p-4 border"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              color: 'var(--foreground)'
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Late Arrival Warning ({driverProfile.lateWarningsCount} / 3)
                </p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Suspension at 3
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You have received {driverProfile.lateWarningsCount} warning{driverProfile.lateWarningsCount > 1 ? 's' : ''} for delayed pickup (&gt;15 mins past scheduled pickup time). Please ensure timely arrivals. Reaching 3 warnings results in account suspension and a ₦1,000 penalty deducted from your wallet.
              </p>
            </div>
          </div>
        )}

        {/* ── Stats card ── */}
        <div
          className="rounded-lg mb-6"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', padding: '16px 20px' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Performance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { label: 'Trips Completed', value: String(driverProfile.totalTrips) },
              { label: 'Late Warnings',   value: `${driverProfile.lateWarningsCount || 0} / 3`, isWarning: (driverProfile.lateWarningsCount || 0) > 0 },
              { label: 'Avg. Rating',     value: driverProfile.rating > 0 ? driverProfile.rating.toFixed(1) : '—' },
              { label: 'Status',          value: driverProfile.status, chip: true },
            ].map((s: any, i) => (
              <div
                key={s.label}
                className={cn(i > 0 && 'pl-5 sm:border-l')}
                style={{ borderColor: 'var(--border)', paddingRight: i < 3 ? '20px' : undefined }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  {s.label}
                </p>
                {s.chip ? (
                  <StatusChip status={s.value} />
                ) : (
                  <p
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      s.isWarning && "text-amber-500 font-black"
                    )}
                    style={{ color: s.isWarning ? '#f59e0b' : 'var(--foreground)', letterSpacing: '-0.02em' }}
                  >
                    {s.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Wallet Section ── */}
        <div
          className="rounded-lg mb-6"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', padding: '24px 20px' }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Balance */}
            <div className="md:w-1/3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Wallet Balance
              </p>
              <h2 className="text-4xl font-black mb-1" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                ₦{driverProfile.walletBalance?.toLocaleString() ?? '0'}
              </h2>
              <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Earned from {driverProfile.totalTrips} completed rides
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                This is a bonus <strong>from TOVEDROP</strong>. It is separate from and in addition to the transport fare riders pay you directly for the ride.
              </p>
              <div className="mt-6 p-3 rounded" style={{ background: 'var(--background)', border: '1px dashed var(--border-subtle)' }}>
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  Withdrawal requests coming soon. Your balance is being tracked accurately in the meantime.
                </p>
              </div>
            </div>
            
            {/* History Table */}
            <div className="md:w-2/3 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Transaction History
              </p>
              {(!driverProfile.walletTransactions || driverProfile.walletTransactions.length === 0) ? (
                <div
                  className="rounded-lg h-full flex flex-col items-center justify-center min-h-[120px]"
                  style={{ background: 'var(--background)', border: '1px dashed var(--border-default)', padding: '20px' }}
                >
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border-default)' }}>Date</th>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border-default)' }}>Description</th>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border-default)' }}>Trip</th>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3 text-right" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border-default)' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverProfile.walletTransactions.slice(0, 5).map((txn: any) => (
                        <tr key={txn.id}>
                          <td className="py-3 text-[11px] whitespace-nowrap" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-xs" style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
                            {txn.description}
                          </td>
                          <td className="py-3 text-[11px]" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                            {txn.trip?.pickup ? `${txn.trip.pickup.split(',')[0]} → ${txn.trip.destination.split(',')[0]}` : '—'}
                          </td>
                          <td className="py-3 text-xs font-bold text-right whitespace-nowrap" style={{ color: txn.amount > 0 ? '#22c55e' : 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
                            {txn.amount > 0 ? '+' : ''}₦{txn.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {driverProfile.walletTransactions.length > 5 && (
                    <div className="pt-3 text-center">
                      <p className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                        View All
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Incoming Requests (High Visibility Dispatch Cards) ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-foreground">
                Incoming Ride Requests
              </p>
              {requests.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--orange-brand)] text-white shadow-xs">
                  {requests.length} Live
                </span>
              )}
            </div>

            {/* Voice Announcement Toggle */}
            <button
              type="button"
              onClick={() => setVoiceAnnounce(!voiceAnnounce)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                voiceAnnounce
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
              title="Voice announcement of place & time when new requests arrive"
            >
              {voiceAnnounce ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Voice Announce: ON
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Voice Announce: OFF
                </>
              )}
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border-2 border-dashed border-border flex flex-col items-center justify-center bg-card">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                <Car className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">No new ride requests right now</p>
              <p className="text-xs text-muted-foreground mt-1">
                When riders book trips, unmissable mission cards with high-contrast pickup spots and departure times will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req: any) => {
                const clashInfo = checkTripClash(req, confirmedTrips)
                return (
                  <HighVisibilityTripCard
                    key={req.id}
                    trip={req}
                    isConfirmed={false}
                    processing={processing === req.id}
                    clashInfo={clashInfo}
                    onAccept={handleOpenCommitment}
                    onDecline={(id) => setDeclined(d => [...d, id])}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ── Upcoming Confirmed Trips (High Visibility Cards) ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-foreground">
              Upcoming Confirmed Trips
            </p>
            {confirmedTrips.length > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {confirmedTrips.length} Confirmed
              </span>
            )}
          </div>

          {confirmedTrips.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border border-border bg-card">
              <p className="text-xs font-medium text-muted-foreground">No confirmed trips scheduled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {confirmedTrips.map((trip: any) => (
                <HighVisibilityTripCard
                  key={trip.id}
                  trip={trip}
                  isConfirmed={true}
                  processing={processing === trip.id}
                  onArrive={handleArrive}
                  onDepart={handleDepart}
                  onComplete={handleComplete}
                  onOpenChat={(t) => setActiveChatTrip(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Zero-Excuses Trip Commitment Modal ── */}
      <TripCommitmentModal
        trip={tripForCommitment}
        isOpen={!!tripForCommitment}
        isLoading={!!processing}
        onConfirm={handleConfirmCommitment}
        onCancel={() => setTripForCommitment(null)}
      />

      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={activeChatTrip.driverId}
          otherPartyName={activeChatTrip.rider?.name ?? 'Rider'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}
      {activeAlarm && (
        <AlarmModal
          trip={activeAlarm.trip}
          minutesBefore={activeAlarm.minutesBefore}
          alarmSound={data?.driverProfile?.alarmSound || 'loud'}
          alarmVibrate={data?.driverProfile?.alarmVibrate ?? true}
          alarmDuration={60}
          onDismiss={dismissAlarm}
          onSnooze={async () => {
            try {
              await fetch('/api/alarms/snooze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tripId: activeAlarm.trip.id,
                  minutesBefore: activeAlarm.minutesBefore
                })
              })
            } catch (err) {
              console.error('Failed to snooze', err)
            }
            dismissAlarm()
          }}
        />
      )}
    </div>
  )
}
