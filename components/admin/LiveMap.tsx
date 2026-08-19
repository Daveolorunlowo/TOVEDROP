'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { pusherClient } from '@/lib/pusher-client'

// Leaflet needs to be dynamically imported because it uses window
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

export function LiveMap() {
  const [mounted, setMounted] = useState(false)
  const [L, setL] = useState<any>(null)
  
  // Dynamic points from Pusher
  const [points, setPoints] = useState<Record<string, { pos: [number, number], type: string, label: string, timestamp: number }>>({})

  useEffect(() => {
    import('leaflet').then(leaflet => {
      import('leaflet/dist/leaflet.css')
      setL(leaflet)
      setMounted(true)
    })
  }, [])

  useEffect(() => {
    const channel = pusherClient.subscribe('global-driver-locations')
    
    channel.bind('location-update', (data: any) => {
      setPoints(prev => ({
        ...prev,
        [data.driverId]: {
          pos: [data.lat, data.lng],
          type: data.status === 'ON_TRIP' ? 'trip' : 'driver',
          label: `Driver: ${data.driverName} (${data.status})`,
          timestamp: Date.now()
        }
      }))
    })

    return () => {
      channel.unbind('location-update')
      pusherClient.unsubscribe('global-driver-locations')
    }
  }, [])

  // Cleanup old points (stale > 5 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const now = Date.now()
        const newPoints = { ...prev }
        let changed = false
        Object.keys(newPoints).forEach(id => {
          if (now - newPoints[id].timestamp > 5 * 60 * 1000) {
            delete newPoints[id]
            changed = true
          }
        })
        return changed ? newPoints : prev
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted || !L) {
    return <div className="w-full h-full min-h-[300px] flex items-center justify-center text-sm text-gray-500 animate-pulse bg-background/20 rounded-xl">Initializing Map...</div>
  }

  // Default center Lagos, Nigeria
  const LAGOS_CENTER: [number, number] = [6.5244, 3.3792]
  
  const createPulseIcon = (color: string) => L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 12px; height: 12px; top: 6px; left: 6px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })

  const driverIcon = createPulseIcon('#22c55e') // Green for active driver
  const tripIcon = createPulseIcon('#F97316') // Orange for ongoing trip

  const activePointsList = Object.entries(points).map(([id, pt]) => ({ id, ...pt }))

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden relative" style={{ zIndex: 1 }}>
      <MapContainer 
        center={activePointsList.length > 0 ? activePointsList[0].pos : LAGOS_CENTER} 
        zoom={12} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {activePointsList.map((pt) => (
          <Marker key={pt.id} position={pt.pos} icon={pt.type === 'driver' ? driverIcon : tripIcon}>
            <Popup className="glass-popup">
              <div className="text-xs font-semibold text-gray-800">{pt.label}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Overlay Controls / Legends */}
      <div className="absolute bottom-4 left-4 z-[400] glass-card px-3 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span> Available Drivers</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span> Active Trips</div>
      </div>
    </div>
  )
}
