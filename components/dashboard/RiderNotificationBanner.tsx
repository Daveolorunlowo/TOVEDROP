'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { subscribeToPushNotifications, getNotificationPermission } from '@/lib/push-client'
import { Bell, Check, X } from 'lucide-react'

export function RiderNotificationBanner() {
  const { data: session } = useSession()
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    let dismissed = false
    try {
      dismissed = !!localStorage.getItem('tovedrop_rider_notif_dismissed')
    } catch (e) {}

    const perm = getNotificationPermission()
    
    // If user already granted permission, ensure push subscription is healthy and matches server VAPID key
    if (perm === 'granted') {
      subscribeToPushNotifications({ force: false }).catch(() => {})
      return
    }

    // If permission is default and not previously dismissed, show the prompt banner after a short delay
    if (perm === 'default' && !dismissed) {
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [session?.user?.id])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const success = await subscribeToPushNotifications({ force: true })
      if (success) {
        setSubscribed(true)
        setTimeout(() => setShowBanner(false), 2000)
      } else {
        setShowBanner(false)
        try {
          localStorage.setItem('tovedrop_rider_notif_dismissed', 'true')
        } catch (e) {}
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    try {
      localStorage.setItem('tovedrop_rider_notif_dismissed', 'true')
    } catch (e) {}
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 max-w-md animate-in slide-in-from-bottom-3 pointer-events-auto">
      <div 
        className="bg-card border-2 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3.5 backdrop-blur-md"
        style={{ borderColor: 'var(--orange-brand)', boxShadow: '0 12px 35px rgba(249,115,22,0.2)' }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--orange-brand)' }}
        >
          {subscribed ? <Check className="w-5 h-5 text-emerald-500" /> : <Bell className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-foreground">
            {subscribed ? "Notifications Enabled!" : "Turn On Ride Alerts"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {subscribed
              ? "You'll get instant alerts when your driver accepts and arrives."
              : "Get real-time audio & push alerts when a driver accepts your ride."}
          </p>
        </div>

        {!subscribed && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="text-xs font-black px-3.5 py-1.5 rounded-lg text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--orange-brand)' }}
            >
              {loading ? "..." : "Enable"}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
