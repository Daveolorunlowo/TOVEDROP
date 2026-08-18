import { useEffect, useRef } from 'react'

export interface LocationData {
  lat: number
  lng: number
  heading?: number | null
  speed?: number | null
}

export function useLocationBroadcaster(
  driverId: string | undefined,
  driverName: string | undefined,
  isActive: boolean, // If false, we stop tracking
  status: 'AVAILABLE' | 'ON_TRIP' = 'AVAILABLE'
) {
  const watchIdRef = useRef<number | null>(null)
  const lastBroadcastTimeRef = useRef<number>(0)
  const THROTTLE_MS = 5000 // Only send to server every 5 seconds to save battery/bandwidth

  useEffect(() => {
    if (!isActive || !driverId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by this browser.')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now()
        if (now - lastBroadcastTimeRef.current < THROTTLE_MS) {
          return // Skip this update, too soon
        }

        lastBroadcastTimeRef.current = now

        const locationData = {
          driverId,
          driverName: driverName || 'Unknown Driver',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          status
        }

        try {
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
          })
        } catch (error) {
          console.error('Failed to broadcast location:', error)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isActive, driverId, driverName, status])
}
