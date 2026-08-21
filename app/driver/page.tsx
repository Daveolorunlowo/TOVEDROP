'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Calendar, Clock, Star, Car,
  CheckCircle, XCircle, Loader2, Check, CheckCircle2, ChevronRight, MessageSquare, Bell
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SkeletonStatCard, SkeletonTripCard } from '@/components/shared/SkeletonVariants'
import { DriverTripListener } from '@/components/driver-trip-listener'
import { ChatModal } from '@/components/chat-modal'
import { Skeleton } from '@/components/shared/Skeleton'
import { useDriverAlarms } from '@/hooks/useDriverAlarms'
import { AlarmModal } from '@/components/driver/AlarmModal'
import { AlarmSettings } from '@/components/driver/AlarmSettings'
import { useLocationBroadcaster } from '@/hooks/useLocationBroadcaster'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/sign-out-button'
import { cn } from '@/lib/utils'
import { subscribeToPushNotifications, getNotificationPermission } from '@/lib/push-client'
import { addToOfflineQueue } from '@/lib/offline-queue'

// ─── Design tokens ─────────────────────────────────────
// bg #111111 / surface #171717 / border #222 / divider #1e1e1e
// label: 11px / uppercase / tracking-[0.05em] / #555
// text: #f5f5f5 / #888 / #555
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
            border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid #333',
          }}
        >
          {done && <Check className="w-2.5 h-2.5" style={{ color: '#22c55e' }} />}
        </span>
        <p className="text-xs font-medium" style={{ color: done ? '#888' : '#555' }}>{label}</p>
      </div>
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: done ? '#22c55e' : '#444' }}
      >
        {detail}
      </p>
    </div>
  )
}

function generateICS(trip: any, scheduledAt: Date) {
  const endDate = new Date(scheduledAt.getTime() + 30 * 60000); // 30 min duration estimate
  
  const formatICSDate = (date: Date) => 
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TOVEDROP//Trip Reminder//EN
BEGIN:VEVENT
UID:${trip.id}@tovedrop.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(scheduledAt)}
DTEND:${formatICSDate(endDate)}
SUMMARY:TOVEDROP Ride: ${trip.pickup} to ${trip.destination}
DESCRIPTION:Pickup rider at ${trip.pickup}, drop off at ${trip.destination}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Trip starting in 30 minutes
END:VALARM
BEGIN:VALARM
TRIGGER:-PT10M
ACTION:DISPLAY
DESCRIPTION:Trip starting in 10 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

function downloadICS(trip: any, scheduledAt: Date) {
  const icsContent = generateICS(trip, scheduledAt);
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tovedrop-trip-${trip.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function ConfirmedTripCard({ trip, isLast, onComplete, onChat, processing }: { trip: any, isLast: boolean, onComplete: (id: string) => void, onChat: (trip: any) => void, processing: string | null }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every minute
    const tick = () => {
      setNow(new Date());
    };

    tick(); // run immediately
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [trip.id, trip.date, trip.time]);

  const scheduledAt = new Date(`${trip.date}T${trip.time}:00`);
  const diffMs = scheduledAt.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  let statusLevel = 0; // 0: > 1hr, 1: 15m-1hr, 2: < 15m
  let timeStr = "";

  if (diffMins > 60) {
    statusLevel = 0;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    timeStr = `in ${hrs}h ${mins}m`;
  } else if (diffMins >= 15) {
    statusLevel = 1;
    timeStr = `in ${diffMins}m`;
  } else if (diffMins >= 0) {
    statusLevel = 2;
    timeStr = `in ${diffMins}m`;
  } else {
    statusLevel = 2;
    timeStr = `Started`;
  }

  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <div
      className={cn("flex flex-col gap-3 px-4 py-4 transition-colors")}
      style={{ 
        borderBottom: isLast ? 'none' : '1px solid #1e1e1e',
        borderLeft: statusLevel === 2 ? '3px solid var(--orange-brand)' : '3px solid transparent',
        background: statusLevel === 2 ? 'rgba(217,119,6,0.02)' : 'transparent'
      }}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}>
              {initials(trip.rider.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{trip.rider.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {trip.pickup} → {trip.destination}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{trip.date} · {trip.time}</p>
          </div>
        </div>
        
        {/* Urgency Badge */}
        <div className="shrink-0 flex flex-col items-end">
          {statusLevel === 0 && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{timeStr}</span>
          )}
          {statusLevel === 1 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--orange-brand)' }}></span>
              <span className="text-xs font-semibold" style={{ color: 'var(--orange-brand)' }}>{timeStr}</span>
            </div>
          )}
          {statusLevel === 2 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--orange-brand)' }}>Trip starting soon</span>
              <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{timeStr}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 justify-end">
        <button
          onClick={() => downloadICS(trip, scheduledAt)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded"
          style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid #333' }}
        >
          <Calendar className="w-3 h-3" />
          Add to Calendar
        </button>
        <button
          onClick={() => onChat(trip)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-colors hover:bg-white/5"
          style={{ color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <MessageSquare className="w-3 h-3" />
          Message
        </button>
        <button
          disabled={processing === trip.id}
          onClick={() => onComplete(trip.id)}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          {processing === trip.id ? '…' : 'Mark Complete'}
        </button>
      </div>
    </div>
  )
}

export default function DriverDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [declined, setDeclined] = useState<string[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeChatTrip, setActiveChatTrip] = useState<any | null>(null)
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [driverSettings, setDriverSettings] = useState<any>(null)

  // Start tracking location if the driver is loaded and approved
  const driverId = data?.driverProfile?.userId
  const driverName = data?.user?.name || data?.driverProfile?.userId
  const isApproved = data?.driverProfile?.status === 'APPROVED'
  useLocationBroadcaster(driverId, driverName, isApproved, 'AVAILABLE')

  // Auto-prompt for notification permission once the driver dashboard loads
  useEffect(() => {
    const dismissed = localStorage.getItem('tovedrop_driver_notif_dismissed')
    if (dismissed) return
    const perm = getNotificationPermission()
    if (perm === 'default') {
      // Slight delay so it doesn't interrupt initial load
      const timer = setTimeout(() => setShowNotifBanner(true), 2500)
      return () => clearTimeout(timer)
    }
    if (perm === 'granted') {
      // Re-subscribe in background to ensure subscription is fresh
      subscribeToPushNotifications().catch(() => {})
    }
  }, [])

  const handleEnableNotifications = async () => {
    setShowNotifBanner(false)
    const success = await subscribeToPushNotifications()
    if (!success) {
      // If denied, don't show again
      localStorage.setItem('tovedrop_driver_notif_dismissed', 'true')
    }
  }

  const handleDismissNotifBanner = () => {
    setShowNotifBanner(false)
    localStorage.setItem('tovedrop_driver_notif_dismissed', 'true')
  }

  const fetchData = async () => {
    const start = Date.now()
    try {
      const res = await fetch('/api/driver/trips')
      if (res.ok) {
        const d = await res.json()
        setData(d)
        if (!driverSettings && d.driverProfile) {
          setDriverSettings({
            alarmEnabled: d.driverProfile.alarmEnabled,
            alarmTimes: d.driverProfile.alarmTimes,
            alarmSound: d.driverProfile.alarmSound,
            alarmVibrate: d.driverProfile.alarmVibrate
          })
        }
      }
      else if (res.status === 401) router.push('/auth/login')
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
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [router])

  const { activeAlarm, dismissAlarm } = useDriverAlarms(
    data?.confirmedTrips || [],
    driverSettings || {}
  );

  const handleAccept = async (id: string) => {
    const tripToAccept = data.pendingTrips.find((t: any) => t.id === id)
    if (!tripToAccept) return

    // 1. Snapshot
    const prevData = { ...data }
    
    // 2. Optimistic Update
    setProcessing(id)
    
    // Identify all trips that should be optimistically accepted
    let tripsToAccept = [tripToAccept]
    if (tripToAccept.isPool && tripToAccept.poolGroupId) {
      tripsToAccept = data.pendingTrips.filter((t: any) => 
        t.poolGroupId === tripToAccept.poolGroupId
      )
    }
    
    const acceptedIds = tripsToAccept.map(t => t.id)

    setData({
      ...data,
      pendingTrips: data.pendingTrips.filter((t: any) => !acceptedIds.includes(t.id)),
      confirmedTrips: [
        ...tripsToAccept.map((t: any) => ({ ...t, status: 'CONFIRMED' })), 
        ...data.confirmedTrips
      ]
    })
    // toast.success('Trip accepted!') would go here

    // 3. Network Request
    try {
      if (!navigator.onLine) {
        addToOfflineQueue('/api/trips/accept', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({ tripId: id }))
        // Optimistically continue without throwing
      } else {
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
      }
    } catch (err: any) {
      // 4. Rollback
      setData(prevData)
      alert(err.message || 'This trip was already accepted by another driver')
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
      if (!navigator.onLine) {
        addToOfflineQueue('/api/trips/complete', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({ tripId: id }))
      } else {
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
      }
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
        <XCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2 text-foreground">Account Suspended</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your driver account has been suspended. Please contact support for more information or to appeal this decision.
        </p>
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

  const rawRequests = pendingTrips.filter((t: any) => !declined.includes(t.id))
  
  // Group pooled trips
  const requests: any[] = []
  const pools = new Map<string, any[]>()
  
  for (const t of rawRequests) {
    if (t.isPool && t.poolGroupId) {
      if (!pools.has(t.poolGroupId)) pools.set(t.poolGroupId, [])
      pools.get(t.poolGroupId)!.push(t)
    } else {
      requests.push(t)
    }
  }
  
  for (const [poolId, poolRides] of Array.from(pools.entries())) {
    requests.push({
      id: poolRides[0].id, // Driver accepts the first one, backend handles all
      isPoolGroup: true,
      poolCount: poolRides.length,
      rider: { name: `Pool: ${poolRides.length} Riders` },
      pickup: poolRides[0].pickup + (poolRides.length > 1 ? " & others" : ""),
      destination: poolRides[0].destination + (poolRides.length > 1 ? " & others" : ""),
      date: poolRides[0].date,
      time: poolRides[0].time,
      notes: poolRides.map(r => r.notes).filter(Boolean).join(" | "),
    })
  }
  
  // Sort by created time or something? Let's just leave it.
  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'
  const firstName = driverProfile.user.name?.split(' ')[0] ?? 'Driver'

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      {/* ── Notification Permission Banner ── */}
      {showNotifBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="max-w-md mx-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(217,119,6,0.4)',
              pointerEvents: 'all',
            }}
          >
            <div
              className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(217,119,6,0.12)' }}
            >
              <Bell className="w-4 h-4" style={{ color: 'var(--orange-brand)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                Enable Pickup Alarms
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Get notified 30 &amp; 15 mins before each pickup
              </p>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="text-[11px] font-bold px-3 py-1.5 rounded shrink-0"
              style={{ background: 'var(--orange-brand)', color: '#fff' }}
            >
              Enable
            </button>
            <button
              onClick={handleDismissNotifBanner}
              className="text-[11px] px-2 py-1 shrink-0"
              style={{ color: 'var(--muted-foreground)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4 min-w-0 max-w-full">
            {/* Avatar with badge overlap */}
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11">
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}
                >
                  {initials(driverProfile.user.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#22c55e', border: '2px solid #111111' }}
              >
                <Check className="w-2 h-2 text-foreground" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Driver Dashboard
              </p>
              <h1 className="text-2xl font-bold break-words" style={{ color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
                {firstName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusChip status={driverProfile.status} />
                {driverProfile.rating > 0 && (
                  <span className="flex items-center gap-1 text-[11px] whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                    <Star className="w-3 h-3" style={{ color: 'var(--orange-brand)' }} />
                    {driverProfile.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats card ── */}
        <div
          className="rounded-lg mb-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Performance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { label: 'Trips Completed', value: String(driverProfile.totalTrips) },
              { label: 'This Week',       value: '—' },
              { label: 'Avg. Rating',     value: driverProfile.rating > 0 ? driverProfile.rating.toFixed(1) : '—' },
              { label: 'Status',          value: driverProfile.status, chip: true },
            ].map((s, i) => (
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
                  <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
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
          style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 20px' }}
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
              <p className="text-[11px] leading-relaxed" style={{ color: '#666' }}>
                This is a bonus <strong>from TOVEDROP</strong>. It is separate from and in addition to the transport fare riders pay you directly for the ride.
              </p>
              <div className="mt-6 p-3 rounded" style={{ background: 'var(--background)', border: '1px dashed #333' }}>
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
                  style={{ background: 'var(--background)', border: '1px dashed var(--border)', padding: '20px' }}
                >
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid #222' }}>Date</th>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid #222' }}>Description</th>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid #222' }}>Trip</th>
                        <th className="text-[10px] font-semibold uppercase tracking-wider pb-3 text-right" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid #222' }}>Amount</th>
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
                      <p className="text-[10px] text-muted cursor-pointer hover:text-primary uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                        View All
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Alarm Settings ── */}
        {driverSettings && driverId && (
          <AlarmSettings 
            driverId={driverId} 
            initialSettings={driverSettings} 
            onSave={(newSettings) => setDriverSettings(newSettings)}
          />
        )}

        {/* ── Incoming Requests ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
                  Incoming Requests
                </p>
                {requests.length > 0 && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5"
                    style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--orange-brand)', borderRadius: '4px' }}
                  >
                    {requests.length} new
                  </span>
                )}
              </div>

              {requests.length === 0 ? (
                <div
                  className="rounded-lg"
                  style={{ background: 'var(--card)', border: '1px dashed var(--border)', padding: '20px' }}
                >
                  <Car className="w-4 h-4 mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No new requests</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>New trip requests will appear here.</p>
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {requests.map((req: any, i: number) => (
                    <div
                      key={req.id}
                      className="px-4 py-3"
                      style={{ borderBottom: i < requests.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}>
                            {initials(req.rider.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{req.rider.name}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {req.pickup} → {req.destination}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{req.date} · {req.time}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            disabled={processing === req.id}
                            onClick={() => handleAccept(req.id)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded"
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '4px' }}
                          >
                            {processing === req.id ? '…' : 'Accept'}
                          </button>
                          <button
                            disabled={processing === req.id}
                            onClick={() => setDeclined(d => [...d, req.id])}
                            className="text-[11px] font-semibold px-2.5 py-1"
                            style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                      {req.notes && (
                        <p className="text-[11px] mt-2 ml-10 px-2 py-1 rounded" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '4px' }}>
                          Note: {req.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Confirmed Trips ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-foreground)' }}>
                  Upcoming Confirmed Trips
                </p>
                {confirmedTrips.length > 0 && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5"
                    style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '4px' }}
                  >
                    {confirmedTrips.length}
                  </span>
                )}
              </div>

              {confirmedTrips.length === 0 ? (
                <div
                  className="rounded-lg"
                  style={{ background: 'var(--card)', border: '1px solid #1e1e1e', padding: '20px' }}
                >
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No confirmed trips yet.</p>
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {confirmedTrips.map((trip: any, i: number) => (
                      <ConfirmedTripCard 
                        key={trip.id} 
                        trip={trip} 
                        isLast={i === confirmedTrips.length - 1}
                        onComplete={handleComplete}
                        onChat={setActiveChatTrip}
                        processing={processing}
                      />
                  ))}
                </div>
              )}
            </div>
      </div>
      
      <DriverTripListener />

      {activeChatTrip && (
        <ChatModal 
          tripId={activeChatTrip.id}
          currentUserId={data.driverProfile.userId}
          otherPartyName={activeChatTrip.rider?.name || "Rider"}
          onClose={() => setActiveChatTrip(null)}
        />
      )}

      {activeAlarm && (
        <AlarmModal
          trip={activeAlarm.trip}
          minutesBefore={activeAlarm.minutesBefore}
          alarmSound={driverSettings?.alarmSound || 'default'}
          alarmVibrate={driverSettings?.alarmVibrate ?? true}
          onDismiss={dismissAlarm}
          onSnooze={() => {
            fetch('/api/alarms/snooze', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                tripId: activeAlarm.trip.id,
                minutesBefore: activeAlarm.minutesBefore 
              })
            });
            dismissAlarm();
          }}
        />
      )}
    </div>
  )
}
