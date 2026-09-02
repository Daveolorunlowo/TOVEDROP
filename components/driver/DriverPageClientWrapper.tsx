'use client'

import { useEffect, useState } from 'react'
import { useLocationBroadcaster } from '@/hooks/useLocationBroadcaster'
import { subscribeToPushNotifications, getNotificationPermission } from '@/lib/push-client'
import { Bell } from 'lucide-react'
import { DriverTripListener } from '@/components/driver-trip-listener'

export function DriverPageClientWrapper({ 
  driverId, 
  driverName 
}: { 
  driverId: string, 
  driverName: string 
}) {
  const [showNotifBanner, setShowNotifBanner] = useState(false)

  // Start tracking location for approved drivers
  useLocationBroadcaster(driverId, driverName, true, 'AVAILABLE')

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = !!localStorage.getItem('tovedrop_driver_notif_dismissed')
    } catch (e) {}
    if (dismissed) return
    const perm = getNotificationPermission()
    if (perm === 'default') {
      const timer = setTimeout(() => setShowNotifBanner(true), 2500)
      return () => clearTimeout(timer)
    }
    if (perm === 'granted') {
      subscribeToPushNotifications().catch(() => {})
    }
  }, [])

  const handleEnableNotifications = async () => {
    setShowNotifBanner(false)
    const success = await subscribeToPushNotifications()
    if (!success) {
      try { localStorage.setItem('tovedrop_driver_notif_dismissed', 'true') } catch (e) {}
    }
  }

  const handleDismissNotifBanner = () => {
    setShowNotifBanner(false)
    try { localStorage.setItem('tovedrop_driver_notif_dismissed', 'true') } catch (e) {}
  }

  return (
    <>
      <DriverTripListener />
      {showNotifBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 pointer-events-none">
          <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl bg-card border border-orange-brand/40 pointer-events-auto">
            <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-orange-brand/10">
              <Bell className="w-4 h-4 text-orange-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Enable Pickup Alarms</p>
              <p className="text-[11px] text-muted-foreground">Get notified 30 & 15 mins before each pickup</p>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="text-[11px] font-bold px-3 py-1.5 rounded shrink-0 bg-orange-brand text-primary-foreground"
            >
              Enable
            </button>
            <button
              onClick={handleDismissNotifBanner}
              className="text-[11px] px-2 py-1 shrink-0 text-muted-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
