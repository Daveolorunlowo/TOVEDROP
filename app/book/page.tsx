"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Calendar, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToOfflineQueue } from '@/lib/offline-queue'

import { Footer } from '@/components/footer'
import type { MapPoint } from '@/components/map-picker'
import { LocationSearchInput } from '@/components/shared/LocationSearchInput'
import { getCampusLandmarks } from '@/lib/campus-landmarks'

const CAMPUS_LANDMARKS = getCampusLandmarks().map(l => ({ name: l.label, lat: l.lat, lng: l.lng }))
import { useDropsBalance } from '@/hooks/useDropsBalance'

const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted/50 flex items-center justify-center text-muted-foreground">Loading interactive map...</div>
})

export default function BookPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<boolean>(false)
  const { balance: dropsBalance, loading: dropsLoading } = useDropsBalance()

  const drops = dropsBalance ?? 0
  const loading = dropsLoading

  const [pickupPoint, setPickupPoint] = useState<MapPoint | null>(null)
  const [destinationPoint, setDestinationPoint] = useState<MapPoint | null>(null)
  const [pickupText, setPickupText] = useState<string>('')
  const [destinationText, setDestinationText] = useState<string>('')
  const [selectingMode, setSelectingMode] = useState<'pickup' | 'destination'>('pickup')
  const [isPool, setIsPool] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const form = e.target as HTMLFormElement
    const newErrors: Record<string, string> = {}
    const date = (form.elements.namedItem('date') as HTMLInputElement)?.value
    const time = (form.elements.namedItem('time') as HTMLInputElement)?.value
    const note = (form.elements.namedItem('note') as HTMLInputElement)?.value
    
    if (!pickupPoint || pickupPoint.label !== pickupText) newErrors.pickup = 'Please select a Pickup Location from the search results or tap the map.'
    if (!destinationPoint || destinationPoint.label !== destinationText) newErrors.destination = 'Please select a Destination from the search results or tap the map.'
    if (!date) newErrors.date = 'Please select a date.'
    if (!time) newErrors.time = 'Please select a time.'
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      if (drops < 1) {
        setErrors({ general: 'Insufficient Drops to book a trip.' })
        return
      }
      
      setSubmitting(true)
      try {
        const payload = { 
          pickup: pickupPoint!.label, 
          pickupLat: pickupPoint!.lat,
          pickupLng: pickupPoint!.lng,
          destination: destinationPoint!.label, 
          destinationLat: destinationPoint!.lat,
          destinationLng: destinationPoint!.lng,
          date, 
          time, 
          notes: note,
          isPool 
        }
        
        if (!navigator.onLine) {
          addToOfflineQueue('/api/trips/create', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify(payload))
          router.push('/dashboard')
        } else {
          const res = await fetch('/api/trips/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          
          if (res.ok) {
            router.push('/dashboard')
          } else {
            const data = await res.json()
            setErrors({ general: data.message || 'Failed to create trip.' })
          }
        }
      } catch (err) {
        setErrors({ general: 'An error occurred.' })
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleLandmarkSelect = (landmark: typeof CAMPUS_LANDMARKS[0]) => {
    const pt: MapPoint = { lat: landmark.lat, lng: landmark.lng, label: landmark.name }
    if (selectingMode === 'pickup') {
      setPickupPoint(pt)
      setPickupText(landmark.name)
      if (!destinationPoint) setSelectingMode('destination')
    } else {
      setDestinationPoint(pt)
      setDestinationText(landmark.name)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <h1 className="text-2xl font-extrabold text-secondary mb-1">Where are you going?</h1>
              <p className="text-sm text-muted-foreground mb-7">
                Tap on the map or use a landmark to set locations.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Pickup */}
                <div className="space-y-1.5">
                  <Label>Pickup Location</Label>
                  <LocationSearchInput
                    placeholder="Search pickup location..."
                    value={pickupPoint?.label || ''}
                    onFocus={() => setSelectingMode('pickup')}
                    onChangeText={setPickupText}
                    icon={<MapPin className="w-4 h-4 text-primary" />}
                    onSelect={(result) => {
                      const pt: MapPoint = { lat: result.lat, lng: result.lng, label: result.label }
                      setPickupPoint(pt)
                      setPickupText(result.label)
                      setSelectingMode('pickup')
                      if (!destinationPoint) setSelectingMode('destination')
                    }}
                    className={`${errors.pickup ? '[&_input]:border-red-500' : ''} ${pickupPoint && pickupPoint.label === pickupText && selectingMode === 'pickup' ? '[&_input]:border-primary [&_input]:ring-2 [&_input]:ring-ring [&_input]:ring-offset-2' : ''}`}
                  />
                  {errors.pickup && <p className="text-xs text-red-600">{errors.pickup}</p>}
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <Label>Destination</Label>
                  <LocationSearchInput
                    placeholder="Search destination..."
                    value={destinationPoint?.label || ''}
                    onFocus={() => setSelectingMode('destination')}
                    onChangeText={setDestinationText}
                    icon={<Navigation className="w-4 h-4 text-secondary" />}
                    onSelect={(result) => {
                      const pt: MapPoint = { lat: result.lat, lng: result.lng, label: result.label }
                      setDestinationPoint(pt)
                      setDestinationText(result.label)
                      setSelectingMode('destination')
                    }}
                    className={`${errors.destination ? '[&_input]:border-red-500' : ''} ${destinationPoint && destinationPoint.label === destinationText && selectingMode === 'destination' ? '[&_input]:border-secondary [&_input]:ring-2 [&_input]:ring-ring [&_input]:ring-offset-2' : ''}`}
                  />
                  {errors.destination && <p className="text-xs text-red-600">{errors.destination}</p>}
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        className={`pl-10 ${errors.date ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="time"
                        name="time"
                        type="time"
                        className={`pl-10 ${errors.time ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.time && <p className="text-xs text-red-600">{errors.time}</p>}
                  </div>
                </div>

                {/* Optional note */}
                <div className="space-y-1.5">
                  <Label htmlFor="note">Note for driver <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="note"
                    name="note"
                    placeholder="e.g. I have luggage, please bring a saloon car"
                  />
                </div>

                {/* Ride Pooling Toggle */}
                <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-surface-card">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Pool this Ride?</Label>
                    <p className="text-sm text-muted-foreground">Share this ride with others going in the same direction.</p>
                  </div>
                  <div 
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isPool ? 'bg-orange-brand' : 'bg-muted'}`}
                    onClick={() => setIsPool(!isPool)}
                  >
                    <div className={`absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full transition-transform ${isPool ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {errors.general && <p className="text-sm font-semibold text-red-600 bg-red-100 p-3 rounded-md">{errors.general}</p>}

                <div className="bg-surface-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <circle cx="10" cy="10" r="9" fill="url(#bdc)" />
                      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
                      <defs><linearGradient id="bdc" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="var(--orange-brand)" /><stop offset="100%" stopColor="var(--orange-brand)" /></linearGradient></defs>
                    </svg>
                    <span className="text-sm font-semibold text-orange-brand">This booking costs 1 Drop</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{loading ? <div className="h-4 w-12 bg-muted animate-pulse rounded inline-block align-middle" /> : drops} Drops remaining</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Drops used</span>
                    <span>1 / {loading ? <div className="h-3 w-4 bg-muted animate-pulse rounded inline-block align-middle" /> : drops}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: drops > 0 ? `${(1 / drops) * 100}%` : '0%', backgroundColor: 'var(--orange-brand)' }} />
                  </div>
                </div>
                {(!loading && drops < 1) ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => router.push('/dashboard/buy-drops')}
                    className="w-full text-white font-semibold mt-2"
                    style={{ backgroundColor: 'var(--orange-brand)' }}
                  >
                    Buy Drops
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || loading}
                    className="w-full text-white font-semibold mt-2"
                    style={{ backgroundColor: 'var(--orange-brand)' }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {submitting ? 'Requesting...' : (loading ? 'Loading...' : 'Find Drivers')}
                  </Button>
                )}
              </form>
            </div>

            {/* Map Area */}
            <div id="map-container" className="flex flex-col gap-4 lg:sticky lg:top-24 scroll-mt-24">
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-4">


                <div>
                  <p className="text-sm font-semibold mb-3">Quick Landmarks</p>
                  <div className="flex flex-wrap gap-2">
                  {CAMPUS_LANDMARKS.map(lm => (
                    <button
                      key={lm.name}
                      type="button"
                      onClick={() => handleLandmarkSelect(lm)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle hover:bg-border-default transition-colors"
                    >
                      {lm.name}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm h-[400px]">
                <MapPicker 
                  pickup={pickupPoint}
                  destination={destinationPoint}
                  onPickupChange={(p) => { 
                    setPickupPoint(p); 
                    setPickupText(p.label); 
                    if(!destinationPoint) setSelectingMode('destination'); 
                  }}
                  onDestinationChange={(p) => {
                    setDestinationPoint(p);
                    setDestinationText(p.label);
                  }}
                  selectingMode={selectingMode}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
