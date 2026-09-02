"use client"

import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Calendar, Clock, Search, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToOfflineQueue } from '@/lib/offline-queue'
import { Footer } from '@/components/footer'
import type { MapPoint } from '@/components/map-picker'
import { LocationSearchInput } from '@/components/shared/LocationSearchInput'
import { getCampusLandmarks } from '@/lib/campus-landmarks'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useDropsBalance } from '@/hooks/useDropsBalance'

const CAMPUS_LANDMARKS = getCampusLandmarks().map(l => ({ name: l.label, lat: l.lat, lng: l.lng }))

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function BookWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const isScheduled = true
  const [noteStr, setNoteStr] = useState<string>('')
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const idempotencyKeyRef = useRef<string>(generateId())
  
  // Wizard state
  const [step, setStep] = useState<number>(1)
  const [dateStr, setDateStr] = useState<string>('')
  const [timeStr, setTimeStr] = useState<string>('')

  // Set default date/time to now on mount, and prefill destination from URL
  useEffect(() => {
    setQuickTime(0)
    
    const urlDest = searchParams.get('destination')
    if (urlDest) {
      setDestinationText(urlDest)
      // Attempt to match with campus landmarks to get lat/lng
      const matched = CAMPUS_LANDMARKS.find(l => l.name.toLowerCase() === urlDest.toLowerCase())
      if (matched) {
        setDestinationPoint({ lat: matched.lat, lng: matched.lng, label: matched.name })
      } else {
        // Just use text for now, geocoding would be better but we rely on the component for selection
        setDestinationPoint({ lat: 0, lng: 0, label: urlDest })
      }
    }
  }, [searchParams])

  const setQuickTime = (minutesToAdd: number) => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + minutesToAdd)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDateStr(`${yyyy}-${mm}-${dd}`)
    setTimeStr(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))
  }

  // Effect to update time automatically if leaving now
  useEffect(() => {
    if (!isScheduled) {
      setQuickTime(0)
    }
  }, [isScheduled])

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!pickupPoint || pickupPoint.label !== pickupText) newErrors.pickup = 'Please select a Pickup Location.'
    if (!destinationPoint || destinationPoint.label !== destinationText) newErrors.destination = 'Please select a Destination.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!dateStr) {
      newErrors.date = 'Please select a date.'
    }
    if (!timeStr) {
      newErrors.time = 'Please select a time.'
    }

    if (dateStr && timeStr) {
      const selectedDate = new Date(`${dateStr}T${timeStr}:00`)
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      if (selectedDate < now) {
        newErrors.time = 'You cannot select a time in the past.'
      } else if (selectedDate < twoHoursFromNow) {
        newErrors.time = 'Pickup time must be at least 2 hours from now.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      // Generate a fresh idempotency key for this booking attempt
      idempotencyKeyRef.current = generateId()
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    if (step === 3) {
      if (drops < 1) {
        setErrors({ general: 'Insufficient Drops to book a trip.' })
        return
      }
      confirmBooking()
    }
  }

  const confirmBooking = async () => {
    setSubmitting(true)
    try {
      const payload = { 
        pickup: pickupPoint!.label, 
        pickupLat: pickupPoint!.lat,
        pickupLng: pickupPoint!.lng,
        destination: destinationPoint!.label, 
        destinationLat: destinationPoint!.lat,
        destinationLng: destinationPoint!.lng,
        date: dateStr, 
        time: timeStr, 
        notes: noteStr,
        isPool,
        isScheduled,
        scheduledDateTime: isScheduled ? new Date(`${dateStr}T${timeStr}:00`).toISOString() : undefined,
        idempotencyKey: idempotencyKeyRef.current,
      }
      
      if (!navigator.onLine) {
        addToOfflineQueue('/api/trips/create', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify(payload))
        router.push('/dashboard')
        return
      }

      const res = await fetch('/api/trips/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        // 200 (idempotent hit) or 201 (newly created) — both are success
        router.push('/dashboard')
        return
      }

      const data = await res.json()

      if (res.status === 409) {
        // Duplicate trip guard — the trip exists, redirect to dashboard
        router.push('/dashboard')
        return
      }

      if (res.status >= 400 && res.status < 500) {
        // Definitive client error (e.g., Insufficient Drops, validation)
        // Safe to re-enable button — the trip was NOT created
        setErrors({ general: data.message || 'Failed to create trip.' })
        setShowConfirm(false)
        // Generate a new idempotency key for the next attempt
        idempotencyKeyRef.current = generateId()
        setSubmitting(false)
        return
      }

      // 5xx / ambiguous error — trip MAY have been created
      // Do NOT re-enable the button to prevent duplicates
      setErrors({ general: 'Something went wrong, but your booking may have been placed. Please check your trips.' })
      setShowConfirm(false)
      // Keep submitting=true so button stays disabled
    } catch (err) {
      // Network error / timeout — ambiguous, trip may exist
      setErrors({ general: 'Connection error. Your booking may have been placed. Please check your trips.' })
      setShowConfirm(false)
      // Keep submitting=true so button stays disabled
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
    <>
      <main className="flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center space-x-2 md:space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors duration-300 ${step >= s ? 'bg-orange-brand text-white' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5 text-white" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 md:w-16 h-1 ml-2 md:ml-4 rounded-full transition-colors duration-300 ${step > s ? 'bg-orange-brand' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 min-h-[420px] flex flex-col relative overflow-hidden">
              <h1 className="text-2xl font-extrabold text-secondary mb-1">
                {step === 1 && "Where are you going?"}
                {step === 2 && "When do you need a ride?"}
                {step === 3 && "Review & Confirm"}
              </h1>
              <p className="text-sm text-muted-foreground mb-7">
                {step === 1 && "Tap on the map or use a landmark to set locations."}
                {step === 2 && "Select a date and time for your pickup."}
                {step === 3 && "Add any notes and review your booking details."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col" noValidate>
                {/* STEP 1: Locations */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                  </div>
                )}

                {/* STEP 2: Date & Time */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="date">Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="date"
                                name="date"
                                type="date"
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
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
                                value={timeStr}
                                onChange={(e) => setTimeStr(e.target.value)}
                                className={`pl-10 ${errors.time ? 'border-red-500' : ''}`}
                              />
                            </div>
                            {errors.time && <p className="text-xs text-red-600">{errors.time}</p>}
                          </div>
                        </div>

                        {/* Quick Time Selection */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Select</Label>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setQuickTime(30)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle hover:bg-border-default transition-colors">+30m</button>
                            <button type="button" onClick={() => setQuickTime(60)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle hover:bg-border-default transition-colors">+1h</button>
                            <button type="button" onClick={() => setQuickTime(120)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle hover:bg-border-default transition-colors">+2h</button>
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                {/* STEP 3: Details & Review */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-surface-elevated rounded-xl p-4 border border-border-subtle space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pickup</p>
                          <p className="text-sm font-medium">{pickupText}</p>
                        </div>
                      </div>
                      <div className="w-0.5 h-4 bg-border ml-[9px]" />
                      <div className="flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Destination</p>
                          <p className="text-sm font-medium">{destinationText}</p>
                        </div>
                      </div>
                      <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-sm">
                           <Calendar className="w-4 h-4 text-muted-foreground" />
                           <span>{dateStr}</span>
                         </div>
                         <div className="flex items-center gap-2 text-sm font-semibold">
                           <Clock className="w-4 h-4 text-muted-foreground" />
                           <span>{timeStr}</span>
                         </div>
                      </div>
                    </div>

                    {/* Optional note */}
                    <div className="space-y-1.5">
                      <Label htmlFor="note">Note for driver <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="note"
                        name="note"
                        value={noteStr}
                        onChange={(e) => setNoteStr(e.target.value)}
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

                    {errors.general && <p className="text-sm font-semibold text-red-600 bg-red-100 p-3 rounded-md">{errors.general}</p>}
                  </div>
                )}

                {/* Form Footer Actions */}
                <div className="mt-auto pt-6 flex items-center gap-3">
                  {step > 1 && (
                    <Button type="button" variant="outline" size="lg" onClick={handlePrevStep} className="px-4">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  
                  {step < 3 ? (
                    <Button type="button" size="lg" onClick={handleNextStep} className="flex-1 text-foreground font-semibold" style={{ backgroundColor: 'var(--orange-brand)' }}>
                      Next Step <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  ) : (
                    (!loading && drops < 1) ? (
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => router.push('/dashboard/buy-drops')}
                        className="flex-1 text-foreground font-semibold"
                        style={{ backgroundColor: 'var(--orange-brand)' }}
                      >
                        Buy Drops
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitting || loading}
                        className="flex-1 text-foreground font-semibold"
                        style={{ backgroundColor: 'var(--orange-brand)' }}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {submitting ? 'Requesting...' : (loading ? 'Loading...' : 'Confirm & Book Ride')}
                      </Button>
                    )
                  )}
                </div>
              </form>
            </div>

            {/* Quick Landmarks / Map Container */}
            <div id="map-container" className="flex flex-col gap-4 lg:sticky lg:top-24 scroll-mt-24">
              {step === 1 && (
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              )}
              {step > 1 && (
                <div className="hidden lg:flex items-center justify-center bg-card/50 rounded-2xl border border-border/50 p-8 h-[200px] text-center text-muted-foreground animate-in fade-in duration-500">
                  <div className="space-y-3">
                    <Navigation className="w-10 h-10 mx-auto text-border" />
                    <p className="text-sm">Ready for the next step.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default function BookPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-brand border-t-transparent rounded-full animate-spin" /></div>}>
        <BookWizard />
      </Suspense>
      <Footer />
    </div>
  )
}
