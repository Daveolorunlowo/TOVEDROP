'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { subscribeToPushNotifications } from '@/lib/push-client'

export function ServiceWorkerRegistry() {
  const { data: session } = useSession()

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw-custom.js')
      .then(async (reg) => {
        // Check for service worker updates in background
        reg.update().catch(() => {})

        // If logged-in user already granted notification permission, ensure push subscription is healthy and synced
        if (session?.user?.id && 'Notification' in window && Notification.permission === 'granted') {
          await subscribeToPushNotifications().catch(() => {})
        }
      })
      .catch(err => console.warn('Service Worker registration skipped or failed:', err))
  }, [session?.user?.id])
  
  return null
}
