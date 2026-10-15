"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useResilientChannel } from "@/lib/pusher-client"
import { Bell, ArrowRight, X } from "lucide-react"

// Rich acoustic notification chime
function playNotificationChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    
    // Tone 1 (High bell)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5
    gain1.gain.setValueAtTime(0.2, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.45)

    // Tone 2 (Harmonic chime)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(1174.66, now + 0.08) // D6
    gain2.gain.setValueAtTime(0.12, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.55)
  } catch (e) {
    // AudioContext might be muted or blocked by browser autoplay policy
  }
}

interface ToastAlert {
  title: string
  message: string
  url?: string
  actionLabel?: string
  type: 'accepted' | 'arrived' | 'departed' | 'completed' | 'transferred' | 'cancelled'
}

export function TripPoller({ userId }: { userId: string }) {
  const router = useRouter()
  const [activeAlert, setActiveAlert] = useState<ToastAlert | null>(null)

  const triggerAlert = (alert: ToastAlert) => {
    // 1. Audible alert chime
    playNotificationChime()

    // 2. Device haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150])
      } catch (e) {}
    }

    // 3. Native Browser Notification (for backgrounded / minimized tabs)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(alert.title, {
          body: alert.message,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        })
        notif.onclick = () => {
          window.focus()
          if (alert.url) router.push(alert.url)
          notif.close()
        }
      } catch (e) {}
    }

    // 4. In-App Floating Toast
    setActiveAlert(alert)
    router.refresh()
  }

  const handleEvent = (data: any, type: string) => {
    if (type === 'accepted') {
      const driverName = data.driverName || 'A driver'
      const vehicle = data.vehicle ? ` (${data.vehicle})` : ''
      triggerAlert({
        type: 'accepted',
        title: 'Ride Accepted! 🎉',
        message: `${driverName} accepted your ride${vehicle}! Taking you to your live trip...`,
        url: data.tripId ? `/dashboard/trips/${data.tripId}` : '/dashboard',
        actionLabel: 'View Live Ride'
      })

      if (data.tripId) {
        setTimeout(() => {
          router.push(`/dashboard/trips/${data.tripId}`)
        }, 1200)
      }
      return
    }

    if (type === 'arrived') {
      triggerAlert({
        type: 'arrived',
        title: 'Driver Arrived! 📍',
        message: `${data.driverName || 'Your driver'} is waiting at ${data.pickup || 'the pickup point'}.`,
        url: data.tripId ? `/dashboard/trips/${data.tripId}` : undefined,
        actionLabel: 'Open Trip'
      })
      return
    }

    if (type === 'departed') {
      triggerAlert({
        type: 'departed',
        title: 'Taking Off! 🚗💨',
        message: `${data.driverName || 'Your driver'} is now taking off with you to ${data.destination || 'destination'}.`,
        url: data.tripId ? `/dashboard/trips/${data.tripId}` : undefined,
        actionLabel: 'Live Status'
      })
      return
    }

    if (type === 'completed') {
      triggerAlert({
        type: 'completed',
        title: 'You Have Arrived! 🏁',
        message: `Your ride is complete! Don't forget to rate your driver.`,
        url: data.tripId ? `/rate/${data.tripId}` : '/dashboard',
        actionLabel: 'Rate Ride'
      })
      return
    }

    if (type === 'transferred') {
      triggerAlert({
        type: 'transferred',
        title: 'Driver Reassigned 🔄',
        message: 'Your driver has been changed for your upcoming trip.',
        url: '/dashboard',
        actionLabel: 'View Dashboard'
      })
      return
    }

    if (type === 'cancelled') {
      triggerAlert({
        type: 'cancelled',
        title: 'Trip Cancelled 🚫',
        message: 'A trip was cancelled.',
        url: '/dashboard'
      })
      return
    }
  }

  // Subscribe across user-trips-${userId} and user-${userId} channels
  useResilientChannel(`user-trips-${userId}`, 'trip-accepted', (data) => handleEvent(data, 'accepted'))
  useResilientChannel(`user-${userId}`, 'trip-accepted', (data) => handleEvent(data, 'accepted'))

  useResilientChannel(`user-trips-${userId}`, 'driver-arrived', (data) => handleEvent(data, 'arrived'))
  useResilientChannel(`user-${userId}`, 'driver-arrived', (data) => handleEvent(data, 'arrived'))

  useResilientChannel(`user-trips-${userId}`, 'trip-departed', (data) => handleEvent(data, 'departed'))
  useResilientChannel(`user-${userId}`, 'trip-departed', (data) => handleEvent(data, 'departed'))

  useResilientChannel(`user-trips-${userId}`, 'trip-completed', (data) => handleEvent(data, 'completed'))
  useResilientChannel(`user-${userId}`, 'trip-completed', (data) => handleEvent(data, 'completed'))

  useResilientChannel(`user-trips-${userId}`, 'trip-transferred', (data) => handleEvent(data, 'transferred'))
  useResilientChannel(`user-trips-${userId}`, 'trip-cancelled', (data) => handleEvent(data, 'cancelled'))

  // Auto-dismiss toast after 8 seconds
  useEffect(() => {
    if (!activeAlert) return
    const timer = setTimeout(() => setActiveAlert(null), 8000)
    return () => clearTimeout(timer)
  }, [activeAlert])

  if (!activeAlert) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 max-w-sm w-[calc(100vw-32px)] sm:w-auto">
      <div 
        className="bg-card border-2 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 backdrop-blur-md"
        style={{ borderColor: 'var(--orange-brand)', boxShadow: '0 12px 35px rgba(249,115,22,0.22)' }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--orange-brand)' }}
        >
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span 
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: 'var(--orange-brand)' }}
            >
              {activeAlert.title}
            </span>
            <button 
              onClick={() => setActiveAlert(null)}
              className="opacity-50 hover:opacity-100 transition-opacity p-1 rounded-full text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-semibold text-foreground mt-1 leading-snug">
            {activeAlert.message}
          </p>

          {activeAlert.url && (
            <button
              onClick={() => {
                if (activeAlert.url) router.push(activeAlert.url)
                setActiveAlert(null)
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ background: 'var(--orange-brand)' }}
            >
              <span>{activeAlert.actionLabel || 'View Ride'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
