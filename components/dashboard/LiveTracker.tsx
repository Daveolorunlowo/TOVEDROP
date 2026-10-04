'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { pusherClient } from '@/lib/pusher-client'
import { Car, MapPin, Navigation } from 'lucide-react'

// Fix for default Leaflet markers in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom Car Icon for Driver
const carIcon = new L.DivIcon({
  className: 'bg-transparent border-none',
  html: `<div style="background: var(--orange-brand); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.3); border: 2px solid white;">🚗</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 16, { animate: true })
  }, [center, map])
  return null
}

export default function LiveTracker({ trip }: { trip: any }) {
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [status, setStatus] = useState(trip.status)

  // Default to Bowen University coords roughly
  const defaultCenter: [number, number] = [7.6256, 4.1843]

  useEffect(() => {
    // Listen for pusher updates
    const channel = pusherClient.subscribe('global-driver-locations')
    
    channel.bind('location-update', (data: any) => {
      if (data.driverId === trip.driverId) {
        setDriverLocation([data.lat, data.lng])
        if (data.heading) setHeading(data.heading)
        if (data.status) setStatus(data.status)
      }
    })

    return () => {
      channel.unbind('location-update')
      pusherClient.unsubscribe('global-driver-locations')
    }
  }, [trip.driverId])

  const center = driverLocation || defaultCenter

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-[400] bg-card p-4 rounded-xl border border-border shadow-2xl flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
            {trip.driver?.image ? (
              <img src={trip.driver.image} alt={trip.driver.name} className="w-full h-full object-cover" />
            ) : (
              <Car className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm">{trip.driver?.name ?? 'Driver'}</h3>
            <p className="text-xs text-muted-foreground">
              {status === 'CONFIRMED' ? 'On their way to pickup' : status === 'STARTED' ? 'Trip in progress' : status}
            </p>
          </div>
        </div>
        
        <div className="h-px w-full bg-border my-1" />
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{trip.pickup}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Navigation className="w-3.5 h-3.5 text-[var(--orange-brand)] shrink-0" />
            <span className="truncate">{trip.destination}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative z-0">
        <MapContainer 
          center={center} 
          zoom={15} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <MapController center={center} />
          
          {driverLocation && (
            <Marker position={driverLocation} icon={carIcon}>
              <Popup>Driver is here!</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {!driverLocation && trip.status === 'CONFIRMED' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-black/80 text-white px-4 py-2 rounded-full text-xs font-medium animate-pulse backdrop-blur-sm whitespace-nowrap shadow-lg">
          Waiting for live GPS signal...
        </div>
      )}
    </div>
  )
}
