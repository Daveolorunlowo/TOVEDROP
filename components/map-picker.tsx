"use client"

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const BOWEN_BOUNDS = {
  north: 7.6400,
  south: 7.6080,
  east: 4.2050,
  west: 4.1730
}

export const BOWEN_CENTER = { lat: 7.6236, lng: 4.1890 }

import { getCampusLandmarks } from '@/lib/campus-landmarks'

export const CAMPUS_LANDMARKS = getCampusLandmarks().map(l => ({ name: l.label, lat: l.lat, lng: l.lng }))

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export type MapPoint = { lat: number; lng: number; label: string }

interface MapPickerProps {
  pickup: MapPoint | null
  destination: MapPoint | null
  onPickupChange: (p: MapPoint) => void
  onDestinationChange: (p: MapPoint) => void
  selectingMode: 'pickup' | 'destination'
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function MapPicker({ pickup, destination, onPickupChange, onDestinationChange, selectingMode }: MapPickerProps) {
  const maxBounds = L.latLngBounds(
    L.latLng(BOWEN_BOUNDS.south, BOWEN_BOUNDS.west),
    L.latLng(BOWEN_BOUNDS.north, BOWEN_BOUNDS.east)
  )

  const handleMapClick = async (lat: number, lng: number) => {
    // We can show a temporary label while geocoding
    const tempLabel = `Custom Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    if (selectingMode === 'pickup') {
      onPickupChange({ lat, lng, label: tempLabel })
    } else {
      onDestinationChange({ lat, lng, label: tempLabel })
    }

    import('@/lib/geocode').then(async ({ reverseGeocode }) => {
      const label = await reverseGeocode(lat, lng);
      if (selectingMode === 'pickup') {
        onPickupChange({ lat, lng, label })
      } else {
        onDestinationChange({ lat, lng, label })
      }
    });
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={BOWEN_CENTER} 
        zoom={15} 
        minZoom={14}
        maxBounds={maxBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onSelect={handleMapClick} />
        
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>Pickup: {pickup.label}</Popup>
          </Marker>
        )}
        
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>Destination: {destination.label}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
