"use client"

import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { 
  MapPin, 
  Navigation, 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Pencil,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Coins,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToOfflineQueue } from '@/lib/offline-queue'
import { Footer } from '@/components/footer'
import type { MapPoint } from '@/components/map-picker'
import { LocationSearchInput } from '@/components/shared/LocationSearchInput'
import { subscribeToPushNotifications } from '@/lib/push-client'
import { getCampusLandmarks } from '@/lib/campus-landmarks'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useDropsBalance } from '@/hooks/useDropsBalance'
import { ComfortableTimePicker, formatTimeFriendly } from '@/components/booking/ComfortableTimePicker'

const CAMPUS_LANDMARKS = getCampusLandmarks().map(l => ({ name: l.label, lat: l.lat, lng: l.lng }))

const WIZARD_STEPS = [
  { step: 1, name: 'Locations' },
  { step: 2, name: 'Schedule' },
  { step: 3, name: 'Summary' },
]

function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return dateStr
    const [y, m, d] = parts
    const target = new Date(y, m - 1, d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const weekday = target.toLocaleDateString('en-US', { weekday: 'short' })
    const month = target.toLocaleDateString('en-US', { month: 'short' })
    const day = target.getDate()
    const year = target.getFullYear()

    if (diffDays === 0) return `Today (${weekday}, ${day} ${month})`
    if (diffDays === 1) return `Tomorrow (${weekday}, ${day} ${month})`
    return `${weekday}, ${day} ${month} ${year}`
  } catch {
    return dateStr
  }
}

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
 const [isScheduled, setIsScheduled] = useState<boolean>(false)
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

 // Effect to update time automatically if leaving now vs scheduled
 useEffect(() => {
 if (!isScheduled) {
 setQuickTime(0)
 } else {
 const d = new Date()
 d.setHours(d.getHours() + 2)
 let m = Math.ceil(d.getMinutes() / 15) * 15
 if (m >= 60) {
 d.setHours(d.getHours() + 1)
 m = 0
 }
 d.setMinutes(m)
 const yyyy = d.getFullYear()
 const mm = String(d.getMonth() + 1).padStart(2, '0')
 const dd = String(d.getDate()).padStart(2, '0')
 setDateStr(`${yyyy}-${mm}-${dd}`)
 setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
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
 if (isScheduled) {
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
   newErrors.time = 'Scheduled pickups must be at least 2 hours from now.'
   }
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

 let finalDate = dateStr
 let finalTime = timeStr
 
 if (!isScheduled) {
 const d = new Date()
 const yyyy = d.getFullYear()
 const mm = String(d.getMonth() + 1).padStart(2, '0')
 const dd = String(d.getDate()).padStart(2, '0')
 finalDate = `${yyyy}-${mm}-${dd}`
 finalTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
 }

 try {
 const payload = { 
 pickup: pickupPoint!.label, 
 pickupLat: pickupPoint!.lat,
 pickupLng: pickupPoint!.lng,
 destination: destinationPoint!.label, 
 destinationLat: destinationPoint!.lat,
 destinationLng: destinationPoint!.lng,
 date: finalDate, 
 time: finalTime, 
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
 if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
 subscribeToPushNotifications({ force: false }).catch(() => {})
 }
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
 <div className="mb-8 flex items-center justify-center">
 <div className="flex items-center">
 {WIZARD_STEPS.map((s, idx) => (
 <div key={s.step} className="flex items-center">
 <button
 type="button"
 disabled={s.step > step}
 onClick={() => {
 if (s.step < step) {
 setStep(s.step)
 setErrors({})
 }
 }}
 className={`flex items-center gap-2 group transition-all ${s.step < step ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
 >
 <div
 className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors duration-300 ${
 step >= s.step
 ? 'bg-orange-brand text-white shadow-sm'
 : 'bg-muted text-muted-foreground'
 }`}
 >
 {step > s.step ? <CheckCircle2 className="w-4 h-4 text-white" /> : s.step}
 </div>
 <span
 className={`text-xs font-semibold transition-colors hidden sm:inline ${
 step === s.step
 ? 'text-foreground'
 : step > s.step
 ? 'text-muted-foreground group-hover:text-orange-brand'
 : 'text-muted-foreground/60'
 }`}
 >
 {s.name}
 </span>
 </button>
 {idx < WIZARD_STEPS.length - 1 && (
 <div
 className={`w-8 md:w-16 h-0.5 mx-2 md:mx-3 rounded-full transition-colors duration-300 ${
 step > s.step ? 'bg-orange-brand' : 'bg-border'
 }`}
 />
 )}
 </div>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
 {/* Form */}
 <div className="bg-card rounded-xl border border-border p-6 sm:p-8 min-h-[420px] flex flex-col relative overflow-hidden">
 <h1 className={`text-2xl font-extrabold text-foreground ${step === 1 ? 'mb-6' : 'mb-1'}`}>
 {step === 1 && "Where are you going?"}
 {step === 2 && "When do you need a ride?"}
 {step === 3 && "Booking Summary & Confirmation"}
 </h1>
 {step > 1 && (
 <p className="text-sm text-muted-foreground mb-6">
 {step === 2 && "Select a date and time for your pickup."}
 {step === 3 && "Double-check your pickup, destination, and details before requesting."}
 </p>
 )}

 <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col" noValidate>
 {/* STEP 1: Locations */}
 {step === 1 && (
 <div className="space-y-5 animate-in fade-in slide-in- duration-300">
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
 icon={<Navigation className="w-4 h-4 text-muted-foreground" />}
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
 <div className="space-y-6 animate-in fade-in slide-in- duration-300">
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
 <div className="space-y-3">
 <Label className="text-base">Booking Type</Label>
 <div className="grid grid-cols-2 gap-4">
 <button
 type="button"
 onClick={() => setIsScheduled(false)}
 className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${!isScheduled ? 'border-orange-brand bg-orange-brand/5' : 'border-border hover:border-orange-brand/50'}`}
 >
 <Navigation className={`w-6 h-6 mb-2 ${!isScheduled ? 'text-orange-brand' : 'text-muted-foreground'}`} />
 <span className={`font-semibold text-sm ${!isScheduled ? 'text-foreground' : 'text-muted-foreground'}`}>Instant Pick-Up</span>
 <span className="text-xs text-muted-foreground mt-1">Leave right now</span>
 </button>
 <button
 type="button"
 onClick={() => setIsScheduled(true)}
 className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isScheduled ? 'border-orange-brand bg-orange-brand/5' : 'border-border hover:border-orange-brand/50'}`}
 >
 <Calendar className={`w-6 h-6 mb-2 ${isScheduled ? 'text-orange-brand' : 'text-muted-foreground'}`} />
 <span className={`font-semibold text-sm ${isScheduled ? 'text-foreground' : 'text-muted-foreground'}`}>Scheduled Ride</span>
 <span className="text-xs text-muted-foreground mt-1">Book in advance</span>
 </button>
 </div>
 </div>

 {!isScheduled && (
 <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle flex items-start gap-3.5 animate-in fade-in duration-200">
 <div className="w-9 h-9 rounded-xl bg-[var(--orange-brand)]/10 flex items-center justify-center shrink-0 mt-0.5 border border-[var(--orange-brand)]/20">
 <Navigation className="w-4 h-4 text-[var(--orange-brand)] animate-pulse" />
 </div>
 <div>
 <p className="text-xs font-bold text-foreground">Instant Pick-Up Activated</p>
 <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
 We'll automatically dispatch the closest available driver on campus to your pickup location immediately upon booking. Typical driver arrival: 2–5 minutes.
 </p>
 </div>
 </div>
 )}

 {isScheduled && (
 <ComfortableTimePicker
 dateStr={dateStr}
 timeStr={timeStr}
 onDateChange={setDateStr}
 onTimeChange={setTimeStr}
 minHoursAhead={2}
 error={errors.time || errors.date}
 />
 )}
 </div>
 </div>
 )}

 {/* STEP 3: Details & Review */}
 {step === 3 && (
 <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
 {/* Double-check banner */}
 <div className="p-3 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-between text-xs text-orange-brand font-medium">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 shrink-0 text-orange-brand" />
 <span>Please double-check your trip details before booking</span>
 </div>
 <span className="text-[11px] font-bold uppercase tracking-wider bg-orange-brand/20 px-2.5 py-0.5 rounded-full">
 Step 3 of 3
 </span>
 </div>

 {/* Section 1: Route Review Card */}
 <div className="bg-surface-elevated rounded-xl p-4 sm:p-5 border border-border-default shadow-sm space-y-4">
 <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
 <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
 <Navigation className="w-3.5 h-3.5 text-orange-brand" />
 Route Summary
 </span>
 <button
 type="button"
 onClick={() => setStep(1)}
 className="text-xs font-semibold text-orange-brand hover:underline flex items-center gap-1 transition-colors"
 title="Change pickup or destination"
 >
 <Pencil className="w-3 h-3" />
 Edit Route
 </button>
 </div>

 <div className="relative pl-6 space-y-5">
 {/* Visual Route Line */}
 <div className="absolute left-[9px] top-[14px] bottom-[14px] w-0.5 bg-gradient-to-b from-orange-brand via-orange-brand/60 to-purple-brand" />

 {/* Pickup */}
 <div className="relative">
 <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-surface-card border-2 border-orange-brand flex items-center justify-center shadow-sm">
 <div className="w-1.5 h-1.5 rounded-full bg-orange-brand" />
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pickup Location</p>
 <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5 break-words">
 {pickupPoint?.label || pickupText || 'Not specified'}
 </p>
 </div>
 </div>

 {/* Destination */}
 <div className="relative">
 <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-surface-card border-2 border-purple-brand flex items-center justify-center shadow-sm">
 <MapPin className="w-2.5 h-2.5 text-purple-brand" />
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destination</p>
 <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5 break-words">
 {destinationPoint?.label || destinationText || 'Not specified'}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Section 2: Ride Timing & Service Type */}
 <div className="bg-surface-elevated rounded-xl p-4 sm:p-5 border border-border-default shadow-sm space-y-3">
 <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
 <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5 text-orange-brand" />
 Ride Schedule
 </span>
 <button
 type="button"
 onClick={() => setStep(2)}
 className="text-xs font-semibold text-orange-brand hover:underline flex items-center gap-1 transition-colors"
 title="Change schedule"
 >
 <Pencil className="w-3 h-3" />
 Change Time
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {/* Booking Type */}
 <div className="p-3 rounded-lg bg-surface-card border border-border-subtle flex items-start gap-3">
 <div className="w-8 h-8 rounded-lg bg-orange-brand/10 text-orange-brand flex items-center justify-center shrink-0 mt-0.5">
 {isScheduled ? <Calendar className="w-4 h-4" /> : <Navigation className="w-4 h-4 animate-pulse" />}
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Booking Type</p>
 <p className="text-sm font-bold text-foreground">
 {isScheduled ? 'Scheduled Ride' : 'Instant Pick-Up'}
 </p>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 {isScheduled ? 'Reserved in advance' : 'Leaves immediately (2–5 mins)'}
 </p>
 </div>
 </div>

 {/* Time Details */}
 <div className="p-3 rounded-lg bg-surface-card border border-border-subtle flex items-start gap-3">
 <div className="w-8 h-8 rounded-lg bg-purple-brand/10 text-purple-brand flex items-center justify-center shrink-0 mt-0.5">
 <Clock className="w-4 h-4" />
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pickup Time</p>
 <p className="text-sm font-bold text-foreground">
 {isScheduled ? (formatTimeFriendly(timeStr) || timeStr) : 'Right Now'}
 </p>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 {isScheduled ? formatFriendlyDate(dateStr) : 'Immediate dispatch'}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Section 3: Driver Note / Special Instructions */}
 <div className="bg-surface-elevated rounded-xl p-4 sm:p-5 border border-border-default shadow-sm space-y-2">
 <div className="flex items-center justify-between">
 <Label htmlFor="note" className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
 <MessageSquare className="w-3.5 h-3.5 text-orange-brand" />
 Note for Driver <span className="font-normal text-muted-foreground/75 normal-case">(optional)</span>
 </Label>
 </div>
 <Input
 id="note"
 name="note"
 value={noteStr}
 onChange={(e) => setNoteStr(e.target.value)}
 placeholder="e.g. Waiting in front of the faculty, holding a bag..."
 className="bg-surface-card border-border-subtle focus-visible:ring-orange-brand/30 text-sm"
 />
 <p className="text-[11px] text-muted-foreground flex items-center gap-1">
 <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
 Your driver will see this note immediately after accepting your ride.
 </p>
 </div>

 {/* Section 4: Fare & Payment Summary */}
 <div className="bg-surface-elevated rounded-xl p-4 sm:p-5 border border-border-default shadow-sm space-y-3">
 <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
 <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
 <Coins className="w-3.5 h-3.5 text-orange-brand" />
 Fare & Payment Summary
 </span>
 <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
 Fixed Campus Rate
 </span>
 </div>

 <div className="space-y-2 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Standard Campus Fare</span>
 <span className="font-bold text-foreground">1 Drop</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Your Current Balance</span>
 <span className="font-semibold text-foreground">
 {loading ? '...' : `${drops} ${drops === 1 ? 'Drop' : 'Drops'}`}
 </span>
 </div>
 <div className="border-t border-border-subtle pt-2 flex items-center justify-between">
 <span className="font-semibold text-foreground text-sm">Balance After Ride</span>
 <span className={`font-bold ${drops >= 1 ? 'text-orange-brand' : 'text-red-500'}`}>
 {loading ? '...' : `${Math.max(0, drops - 1)} ${drops - 1 === 1 ? 'Drop' : 'Drops'}`}
 </span>
 </div>
 </div>

 {!loading && drops < 1 && (
 <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-xs text-red-600 font-medium">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <div>
 <span>Insufficient balance. You need 1 Drop to request this trip.</span>
 <button
 type="button"
 onClick={() => router.push('/dashboard/buy-drops')}
 className="block mt-1 font-bold underline hover:text-red-700"
 >
 Buy Drops now →
 </button>
 </div>
 </div>
 )}
 </div>

 {errors.general && (
 <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{errors.general}</span>
 </div>
 )}
 </div>
 )}

 {/* Form Footer Actions */}
 <div className="mt-auto pt-6 flex items-center gap-3">
 {step > 1 && (
 <Button 
 type="button" 
 variant="outline" 
 size="lg" 
 onClick={handlePrevStep} 
 className="px-4 gap-2 text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft className="w-5 h-5" />
 <span className="hidden sm:inline font-medium">Back</span>
 </Button>
 )}
 
 {step < 3 ? (
 <Button 
 type="button" 
 size="lg" 
 onClick={handleNextStep} 
 className="flex-1 text-white font-semibold shadow-md transition-all hover:brightness-105 active:scale-[0.99]" 
 style={{ backgroundColor: 'var(--orange-brand)' }}
 >
 Next Step <ChevronRight className="w-5 h-5 ml-1" />
 </Button>
 ) : (
 (!loading && drops < 1) ? (
 <Button
 type="button"
 size="lg"
 onClick={() => router.push('/dashboard/buy-drops')}
 className="flex-1 text-white font-semibold shadow-md"
 style={{ backgroundColor: 'var(--orange-brand)' }}
 >
 Buy Drops to Request Ride
 </Button>
 ) : (
 <Button
 type="submit"
 size="lg"
 disabled={submitting || loading}
 className="flex-1 text-white font-semibold shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
 style={{ backgroundColor: 'var(--orange-brand)' }}
 >
 {submitting ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
 Requesting Ride...
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4 mr-2" />
 Confirm & Request Ride
 </>
 )}
 </Button>
 )
 )}
 </div>
 </form>
 </div>

 {/* Quick Landmarks / Map Container */}
 <div id="map-container" className="flex flex-col gap-4 lg:sticky lg:top-24 scroll-mt-24">
 {step === 1 && (
 <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-4 animate-in fade-in slide-in- duration-500">
 <div>
 <p className="text-sm font-semibold mb-3">Quick Landmarks</p>
 <div className="flex flex-wrap gap-2">
 {CAMPUS_LANDMARKS.map(lm => (
 <button
 key={lm.name}
 type="button"
 onClick={() => handleLandmarkSelect(lm)}
 className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-muted-foreground hover:text-primary border border-border-subtle hover:bg-border-default transition-colors"
 >
 {lm.name}
 </button>
 ))}
 </div>
 </div>
 </div>
 )}

 {step === 2 && (
 <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-400">
 <div className="flex items-center gap-2.5 pb-3 border-b border-border">
 <div className="w-9 h-9 rounded-xl bg-orange-brand/10 text-orange-brand flex items-center justify-center shrink-0">
 <Clock className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timing Guide</p>
 <p className="text-sm font-bold text-foreground">Campus Ride Options</p>
 </div>
 </div>

 <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
 <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
 <p className="font-bold text-foreground mb-1 flex items-center gap-1.5">
 <Navigation className="w-3.5 h-3.5 text-orange-brand" /> Instant Pick-Up
 </p>
 <p className="text-[11px]">Best when you are packed and ready to go. The closest active campus driver is dispatched immediately (2–5 mins).</p>
 </div>

 <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
 <p className="font-bold text-foreground mb-1 flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-orange-brand" /> Scheduled Ride
 </p>
 <p className="text-[11px]">Must be at least 2 hours in advance. Gives campus drivers time to claim your upcoming journey.</p>
 </div>
 </div>
 </div>
 )}

 {step === 3 && (
 <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-400">
 <div className="flex items-center gap-2.5 pb-3 border-b border-border">
 <div className="w-9 h-9 rounded-xl bg-orange-brand/10 text-orange-brand flex items-center justify-center shrink-0">
 <ShieldCheck className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Peace of Mind</p>
 <p className="text-sm font-bold text-foreground">Rider Protection</p>
 </div>
 </div>

 <div className="space-y-3.5 text-xs">
 <div className="flex items-start gap-2.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <span className="font-semibold text-foreground">Verified Campus Drivers</span>
 <p className="text-muted-foreground text-[11px] mt-0.5">Every driver is a registered Bowen University student or staff member.</p>
 </div>
 </div>

 <div className="flex items-start gap-2.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <span className="font-semibold text-foreground">Live GPS Tracking</span>
 <p className="text-muted-foreground text-[11px] mt-0.5">Track your driver in real-time on your dashboard as soon as they accept.</p>
 </div>
 </div>

 <div className="flex items-start gap-2.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <span className="font-semibold text-foreground">In-App Chat & Contact</span>
 <p className="text-muted-foreground text-[11px] mt-0.5">Message or call your driver directly with one tap.</p>
 </div>
 </div>

 <div className="flex items-start gap-2.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <span className="font-semibold text-foreground">Fixed Rate Guarantee</span>
 <p className="text-muted-foreground text-[11px] mt-0.5">Always 1 Drop. Zero surge pricing, no hidden costs.</p>
 </div>
 </div>
 </div>

 <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle text-[11px] text-muted-foreground leading-relaxed">
 💡 <strong className="text-foreground">Reminder:</strong> You can cancel your trip anytime without penalty before your driver departs.
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
