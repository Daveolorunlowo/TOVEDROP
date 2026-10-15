'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Car,
  MapPin,
  Clock,
  Bell,
  Volume2,
  CreditCard,
  MessageSquare,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  Square,
  Smartphone,
  ShieldCheck,
  Star
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/sign-out-button'
import { subscribeToPushNotifications } from '@/lib/push-client'
import { startContinuousAlarm, stopAllAlarms, AlarmController } from '@/lib/alarm-sounds'

const VEHICLE_TYPES = [
  { id: 'Sedan', label: 'Sedan' },
  { id: 'SUV', label: 'SUV' },
  { id: 'Hatchback', label: 'Hatchback' },
  { id: 'Minivan', label: 'Minivan / Bus' },
  { id: 'Tricycle', label: 'Tricycle / Keke' },
  { id: 'Motorcycle', label: 'Motorcycle / Bike' }
]

const SCHEDULE_PRESETS = [
  'All Days (Monday – Sunday)',
  'Weekdays Only (Monday – Friday)',
  'Weekends Only (Saturday & Sunday)',
  'Morning & Afternoon Shifts (6 AM – 4 PM)',
  'Evening & Night Shifts (4 PM – 11 PM)',
  'Custom / On-Demand'
]

const CAMPUS_ZONES = [
  'Campus Core & Academic Halls',
  'Student Hostels & Residential Quarters',
  'Main Campus Gate & Commercial Strip',
  'Staff Quarters & Faculty Annex',
  'Off-Campus Housing & Express Junction'
]

const ALARM_INTERVAL_OPTIONS = [
  { mins: 30, label: '30 mins before' },
  { mins: 15, label: '15 mins before' },
  { mins: 10, label: '10 mins before' },
  { mins: 5, label: '5 mins before' },
  { mins: 2, label: '2 mins before' }
]

const ALARM_SOUNDS = [
  { id: 'loud', label: 'Emergency Siren (Insanely Loud)', desc: 'Dual-tone oscillating siren with maximum loudness limiter' },
  { id: 'urgent', label: 'Collision Alert (High Strobe)', desc: 'Rapid piercing multi-burst horn' },
  { id: 'default', label: 'High Priority Alert (Brisk)', desc: 'Sharp quad-pulse dispatch tone' },
  { id: 'radar', label: 'Tactical Sonar Sweep', desc: 'Deep penetrating swept sonar ping' },
  { id: 'chime', label: 'Power Chime (Harmonic)', desc: 'Multi-harmonic bright cascading chime' },
  { id: 'gentle', label: 'Gentle Wakeup', desc: 'Ascending melodic chime' }
]

const NIGERIAN_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Kuda Bank',
  'OPay',
  'PalmPay',
  'Stanbic IBTC Bank',
  'United Bank for Africa (UBA)',
  'Wema Bank / ALAT',
  'Zenith Bank'
]

export default function DriverSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'vehicle' | 'zones' | 'alarms' | 'notifications' | 'bank' | 'support'>('vehicle')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Driver details state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehicleType, setVehicleType] = useState('Sedan')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [rating, setRating] = useState(0)
  const [totalTrips, setTotalTrips] = useState(0)
  const [status, setStatus] = useState('APPROVED')

  // Schedule & Areas
  const [availability, setAvailability] = useState(SCHEDULE_PRESETS[0])
  const [selectedZones, setSelectedZones] = useState<string[]>([])

  // Alarms
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [alarmTimes, setAlarmTimes] = useState<number[]>([30, 10, 2])
  const [alarmSound, setAlarmSound] = useState('default')
  const [alarmVibrate, setAlarmVibrate] = useState(true)
  const [playingTone, setPlayingTone] = useState(false)

  // Notifications
  const [pushEnabled, setPushEnabled] = useState(false)
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(true)
  const [pushMessage, setPushMessage] = useState('')

  // Bank & Payout
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)

  // Support & Feedback
  const [feedbackType, setFeedbackType] = useState('ISSUE')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  // 1. Fetch Profile Data on Mount
  useEffect(() => {
    async function loadDriverProfile() {
      try {
        const res = await fetch('/api/driver/profile')
        if (res.status === 401) {
          router.push('/auth')
          return
        }
        if (res.ok) {
          const json = await res.json()
          const p = json.driverProfile
          if (p) {
            setName(p.user?.name || '')
            setEmail(p.user?.email || '')
            setPhone(p.phone || p.user?.phoneNumber || '')
            setBio(p.bio || '')
            setLicenseNumber(p.licenseNumber || '')
            setVehicleMake(p.vehicleMake || '')
            setVehicleModel(p.vehicleModel || '')
            setVehicleColor(p.vehicleColor || '')
            setVehicleType(p.vehicleType || 'Sedan')
            setVehiclePlate(p.vehiclePlate || '')
            setRating(p.rating || 0)
            setTotalTrips(p.totalTrips || 0)
            setStatus(p.status || 'APPROVED')

            if (p.availability) setAvailability(p.availability)
            if (p.preferredAreas) {
              const areas = p.preferredAreas.split(',').map((s: string) => s.trim()).filter(Boolean)
              setSelectedZones(areas)
            } else {
              setSelectedZones([CAMPUS_ZONES[0], CAMPUS_ZONES[1]])
            }

            setAlarmEnabled(p.alarmEnabled ?? true)
            if (Array.isArray(p.alarmTimes) && p.alarmTimes.length > 0) {
              setAlarmTimes(p.alarmTimes)
            }
            setAlarmSound(p.alarmSound || 'default')
            setAlarmVibrate(p.alarmVibrate ?? true)

            setWhatsappNotificationsEnabled(p.user?.whatsappNotificationsEnabled ?? true)

            setBankName(p.bankName || '')
            setAccountNumber(p.accountNumber || '')
            setAccountName(p.accountName || '')
            setWalletBalance(p.walletBalance || 0)
          }
        }
      } catch (e) {
        console.error('Failed to load driver profile', e)
      } finally {
        setLoading(false)
      }
    }

    loadDriverProfile()

    // Check device notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true)
    }
  }, [router])

  // Toggle Zone selection
  const handleToggleZone = (zone: string) => {
    setSelectedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    )
  }

  // Toggle Alarm Time
  const handleToggleAlarmTime = (mins: number) => {
    setAlarmTimes(prev => {
      if (prev.includes(mins)) {
        if (prev.length === 1) return prev // keep at least 1
        return prev.filter(m => m !== mins)
      } else {
        return [...prev, mins].sort((a, b) => b - a)
      }
    })
  }

  const [activeTestingSound, setActiveTestingSound] = useState<string | null>(null)
  const testAlarmControllerRef = useRef<AlarmController | null>(null)

  useEffect(() => {
    return () => {
      if (testAlarmControllerRef.current) {
        testAlarmControllerRef.current.stop()
        testAlarmControllerRef.current = null
      }
      stopAllAlarms()
    }
  }, [])

  // Preview sound continuously with stop toggle
  const handleToggleSoundPreview = (soundId: string) => {
    if (activeTestingSound === soundId) {
      if (testAlarmControllerRef.current) {
        testAlarmControllerRef.current.stop()
        testAlarmControllerRef.current = null
      }
      setActiveTestingSound(null)
      return
    }

    if (testAlarmControllerRef.current) {
      testAlarmControllerRef.current.stop()
      testAlarmControllerRef.current = null
    }

    setActiveTestingSound(soundId)
    testAlarmControllerRef.current = startContinuousAlarm({
      type: soundId,
      duration: 30, // 30s continuous preview
      vibrate: alarmVibrate,
      volumeBoost: true,
      onStop: () => {
        setActiveTestingSound(null)
        testAlarmControllerRef.current = null
      }
    })
  }

  const [testingPush, setTestingPush] = useState(false)

  const handleTestPush = async () => {
    setTestingPush(true)
    setPushMessage('Ensuring push registration...')
    try {
      await subscribeToPushNotifications()
      let res = await fetch('/api/user/push/test', { method: 'POST' })
      let data = await res.json()

      // If the server detected an outdated or missing subscription, force resubscribe and retry once
      if (!res.ok && data.requiresResubscribe) {
        setPushMessage('Updating device registration with active server key...')
        await subscribeToPushNotifications({ force: true })
        res = await fetch('/api/user/push/test', { method: 'POST' })
        data = await res.json()
      }

      if (res.ok && data.success) {
        setPushEnabled(true)
        setPushMessage('✅ Test notification sent! Check your device banner or notification shade.')
      } else {
        setPushMessage(`❌ ${data.message || 'Could not send test notification.'}`)
      }
    } catch (e: any) {
      setPushMessage(`❌ Error: ${e.message || 'Failed to send test push.'}`)
    } finally {
      setTestingPush(false)
      setTimeout(() => setPushMessage(''), 7000)
    }
  }

  // Handle push toggle
  const handleTogglePush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    if (checked) {
      if ('Notification' in window && Notification.permission === 'denied') {
        setPushMessage('Notifications are blocked by your browser. Please allow notifications in site settings.')
        import('@/lib/push-client').then(m => m.showNotificationDeniedAlert())
        setTimeout(() => setPushMessage(''), 6000)
        return
      }

      setPushMessage('Registering device notifications...')
      const success = await subscribeToPushNotifications({ force: true })
      if (success) {
        setPushEnabled(true)
        setPushMessage('Push notifications enabled successfully! 🔔')
      } else {
        setPushEnabled(false)
        setPushMessage('Could not enable push notifications.')
      }
    } else {
      setPushEnabled(false)
      setPushMessage('Notifications turned off for this session.')
    }
    setTimeout(() => setPushMessage(''), 4000)
  }

  // Save All Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const payload = {
        name,
        phone,
        phoneNumber: phone,
        bio,
        licenseNumber,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleType,
        vehiclePlate,
        availability,
        preferredAreas: selectedZones.join(', '),
        alarmEnabled,
        alarmTimes,
        alarmSound,
        alarmVibrate,
        whatsappNotificationsEnabled,
        bankName,
        accountNumber,
        accountName
      }

      const res = await fetch('/api/driver/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 4000)
      } else {
        const data = await res.json()
        setSaveError(data.message || 'Failed to save settings. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setSaveError('Network error while saving settings.')
    } finally {
      setSaving(false)
    }
  }

  // Submit Driver Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackContent.trim()) return

    setFeedbackSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, content: feedbackContent })
      })

      if (res.ok) {
        setFeedbackSuccess(true)
        setFeedbackContent('')
        setTimeout(() => setFeedbackSuccess(false), 5000)
      } else {
        alert('Could not submit feedback. Please try again.')
      }
    } catch (err) {
      alert('Network error while sending feedback.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* ── Top Bar ── */}
      <div className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/driver"
            id="driver-settings-back-link"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignOutButton
              variant="outline"
              className="text-xs border-border bg-transparent hover:bg-muted text-foreground rounded-lg px-3 py-1.5"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* ── Driver Header Banner ── */}
        <div className="bg-gradient-to-r from-card to-card/80 border border-border/80 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--orange-brand)]/15 border border-[var(--orange-brand)]/30 flex items-center justify-center text-[var(--orange-brand)] font-bold text-xl shrink-0">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight">Driver Settings</h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    {status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure your vehicle specs, operating zones, departure alarms, and payout details.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 sm:border-l sm:border-border/60 sm:pl-6">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1 text-sm font-extrabold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {rating > 0 ? rating.toFixed(1) : '5.0'}
                </div>
              </div>
              <div className="h-7 w-[1px] bg-border/60" />
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Trips Done</p>
                <p className="text-sm font-extrabold">{totalTrips}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 border-b border-border/60 no-scrollbar">
          {[
            { id: 'vehicle', label: 'Vehicle & Identity', icon: Car },
            { id: 'zones', label: 'Zones & Schedule', icon: MapPin },
            { id: 'alarms', label: 'Trip Alarms', icon: Clock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'bank', label: 'Payout Account', icon: CreditCard },
            { id: 'support', label: 'Support & Help', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`driver-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[var(--orange-brand)] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-card rounded-2xl w-full" />
            <div className="h-48 bg-card rounded-2xl w-full" />
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* ── TAB 1: VEHICLE & IDENTITY ── */}
            {activeTab === 'vehicle' && (
              <div className="space-y-6">
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/40">
                    <Car className="w-5 h-5 text-[var(--orange-brand)]" />
                    <div>
                      <h2 className="text-base font-bold">Vehicle Specifications</h2>
                      <p className="text-xs text-muted-foreground">Riders see this info when you accept their ride request.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Vehicle Type</label>
                      <select
                        id="vehicle-type-select"
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      >
                        {VEHICLE_TYPES.map(vt => (
                          <option key={vt.id} value={vt.id}>{vt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">License Plate Number</label>
                      <input
                        id="vehicle-plate-input"
                        type="text"
                        value={vehiclePlate}
                        onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="e.g. ABC-123-XY"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground uppercase tracking-wider focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Vehicle Make (Manufacturer)</label>
                      <input
                        id="vehicle-make-input"
                        type="text"
                        value={vehicleMake}
                        onChange={e => setVehicleMake(e.target.value)}
                        placeholder="e.g. Toyota, Honda, Hyundai"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Vehicle Model</label>
                      <input
                        id="vehicle-model-input"
                        type="text"
                        value={vehicleModel}
                        onChange={e => setVehicleModel(e.target.value)}
                        placeholder="e.g. Corolla, Civic, Elantra"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Vehicle Color</label>
                      <input
                        id="vehicle-color-input"
                        type="text"
                        value={vehicleColor}
                        onChange={e => setVehicleColor(e.target.value)}
                        placeholder="e.g. Silver, Black, Navy Blue"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Driver's License Number</label>
                      <input
                        id="driver-license-input"
                        type="text"
                        value={licenseNumber}
                        onChange={e => setLicenseNumber(e.target.value)}
                        placeholder="e.g. DL-98341-NGR"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/40">
                    <Smartphone className="w-5 h-5 text-[var(--orange-brand)]" />
                    <div>
                      <h2 className="text-base font-bold">Driver Identity & Contact</h2>
                      <p className="text-xs text-muted-foreground">Keep your contact info updated so riders and dispatch can reach you.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Full Name</label>
                      <input
                        id="driver-name-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Driver Name"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Phone Number (Calling / WhatsApp)</label>
                      <input
                        id="driver-phone-input"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Driver Greeting / Note to Riders</label>
                    <textarea
                      id="driver-bio-textarea"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="e.g. Friendly driver with AC. I arrive 5 minutes early for scheduled pickups!"
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground min-h-[80px] focus:outline-none focus:border-[var(--orange-brand)] transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: ZONES & SCHEDULE ── */}
            {activeTab === 'zones' && (
              <div className="space-y-6">
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/40">
                    <MapPin className="w-5 h-5 text-[var(--orange-brand)]" />
                    <div>
                      <h2 className="text-base font-bold">Preferred Campus Operating Areas</h2>
                      <p className="text-xs text-muted-foreground">Select the zones you frequent. Ride requests in these zones will be highlighted for you.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {CAMPUS_ZONES.map(zone => {
                      const isSelected = selectedZones.includes(zone)
                      return (
                        <button
                          type="button"
                          key={zone}
                          onClick={() => handleToggleZone(zone)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--orange-brand)]/10 border-[var(--orange-brand)] text-foreground'
                              : 'bg-background border-border text-muted-foreground hover:border-border/80'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-[var(--orange-brand)] border-[var(--orange-brand)] text-white' : 'border-border'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium leading-relaxed">{zone}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="pt-4 border-t border-border/40">
                    <label className="block text-xs font-semibold mb-2">Weekly Driving Schedule Preset</label>
                    <select
                      id="availability-preset-select"
                      value={availability}
                      onChange={e => setAvailability(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                    >
                      {SCHEDULE_PRESETS.map(preset => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: TRIP WAKEUP & ALARMS ── */}
            {activeTab === 'alarms' && (
              <div className="space-y-6">
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-[var(--orange-brand)]" />
                      <div>
                        <h2 className="text-base font-bold">Departure Wake-Up Alarms</h2>
                        <p className="text-xs text-muted-foreground">High-priority alerts to ensure you never miss or show up late for confirmed rides.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alarmEnabled}
                        onChange={e => setAlarmEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--orange-brand)]"></div>
                    </label>
                  </div>

                  {alarmEnabled && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold mb-2.5">
                          When should alarms ring before departure?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ALARM_INTERVAL_OPTIONS.map(opt => {
                            const isSet = alarmTimes.includes(opt.mins)
                            return (
                              <button
                                type="button"
                                key={opt.mins}
                                onClick={() => handleToggleAlarmTime(opt.mins)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  isSet
                                    ? 'bg-[var(--orange-brand)] text-white border-[var(--orange-brand)]'
                                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                                }`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <label className="block text-xs font-semibold">Alarm Tone & Sound</label>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            🔊 Insanely High Gain Active
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {ALARM_SOUNDS.map(sound => {
                            const isSelected = alarmSound === sound.id
                            const isPlayingThis = activeTestingSound === sound.id
                            return (
                              <div
                                key={sound.id}
                                onClick={() => setAlarmSound(sound.id)}
                                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[var(--orange-brand)]/10 border-[var(--orange-brand)]'
                                    : 'bg-background border-border hover:border-border/80'
                                }`}
                              >
                                <div className="pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold">{sound.label}</p>
                                    {isPlayingThis && (
                                      <span className="text-[10px] text-red-400 font-bold animate-pulse">
                                        ● Ringing...
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{sound.desc}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setAlarmSound(sound.id)
                                    handleToggleSoundPreview(sound.id)
                                  }}
                                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                    isPlayingThis
                                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                                      : 'bg-card border-border text-foreground hover:text-[var(--orange-brand)]'
                                  }`}
                                  title={isPlayingThis ? 'Stop Alarm Preview' : 'Test Alarm Continuous Playback'}
                                >
                                  {isPlayingThis ? (
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  )}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <div>
                          <p className="text-xs font-bold">Haptic Device Vibration</p>
                          <p className="text-[11px] text-muted-foreground">Vibrate phone alongside audio alert for high urgency</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={alarmVibrate}
                            onChange={e => setAlarmVibrate(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--orange-brand)]"></div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/40">
                    <Bell className="w-5 h-5 text-[var(--orange-brand)]" />
                    <div>
                      <h2 className="text-base font-bold">Ride Dispatch Notifications</h2>
                      <p className="text-xs text-muted-foreground">Never miss an instant ride alert on campus.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <div>
                        <p className="text-xs font-bold">Device Push Notifications</p>
                        <p className="text-[11px] text-muted-foreground">Receive instant audio chime & push popups when riders request trips</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pushEnabled}
                          onChange={handleTogglePush}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--orange-brand)]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <div>
                        <p className="text-xs font-bold">Test Device Alerts</p>
                        <p className="text-[11px] text-muted-foreground">Send an immediate test alert to this phone/browser</p>
                      </div>
                      <button
                        type="button"
                        disabled={testingPush}
                        onClick={handleTestPush}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:border-[var(--orange-brand)] transition-colors text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {testingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5 text-[var(--orange-brand)]" />}
                        <span>Send Test Alert</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-xs font-bold">WhatsApp Dispatch Notifications</p>
                        <p className="text-[11px] text-muted-foreground">Send trip details to your phone via WhatsApp when a rider books your car</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={whatsappNotificationsEnabled}
                          onChange={e => setWhatsappNotificationsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--orange-brand)]"></div>
                      </label>
                    </div>
                  </div>

                  {pushMessage && (
                    <div className="mt-4 p-3 rounded-xl bg-[var(--orange-brand)]/10 border border-[var(--orange-brand)]/20 text-xs font-semibold text-[var(--orange-brand)]">
                      {pushMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 5: PAYOUT ACCOUNT ── */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-[var(--orange-brand)]" />
                      <div>
                        <h2 className="text-base font-bold">Earnings & Payout Bank Details</h2>
                        <p className="text-xs text-muted-foreground">Where your ride earnings will be deposited upon withdrawal requests.</p>
                      </div>
                    </div>

                    <Link
                      href="/driver/earnings"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--orange-brand)] hover:underline"
                    >
                      View Wallet & Withdrawals
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Wallet Balance</p>
                      <p className="text-2xl font-black text-foreground">₦{walletBalance.toLocaleString()}</p>
                    </div>
                    <Link
                      href="/driver/earnings"
                      className="px-3 py-1.5 rounded-lg bg-[var(--orange-brand)] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Request Payout
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Bank Name</label>
                      <input
                        list="bank-list"
                        id="driver-bank-name-input"
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="Select or enter bank name"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                      <datalist id="bank-list">
                        {NIGERIAN_BANKS.map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Account Number (10 Digits)</label>
                      <input
                        id="driver-account-number-input"
                        type="text"
                        maxLength={10}
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 0123456789"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground tracking-wider focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1.5">Account Name (Must match your registered name)</label>
                      <input
                        id="driver-account-name-input"
                        type="text"
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="e.g. DAVID OLORUNLOWO"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground uppercase focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: SUPPORT & HELP ── */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/40">
                    <MessageSquare className="w-5 h-5 text-[var(--orange-brand)]" />
                    <div>
                      <h2 className="text-base font-bold">Driver Support & Incident Help</h2>
                      <p className="text-xs text-muted-foreground">Report issues with riders, trips, vehicle emergencies, or propose features.</p>
                    </div>
                  </div>

                  {feedbackSuccess ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-foreground">Report Submitted to Admin Team</h3>
                      <p className="text-xs text-muted-foreground mt-1">Thank you for letting us know. An admin will review this shortly.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Category</label>
                        <select
                          value={feedbackType}
                          onChange={e => setFeedbackType(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-[var(--orange-brand)] transition-colors"
                        >
                          <option value="ISSUE">Report a Rider / Incident Issue</option>
                          <option value="SUGGESTION">App Feature Suggestion</option>
                          <option value="MAINTENANCE">Vehicle Breakdown / Emergency Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Details</label>
                        <textarea
                          value={feedbackContent}
                          onChange={e => setFeedbackContent(e.target.value)}
                          placeholder="Describe the issue, trip ID, or recommendation in detail..."
                          className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground min-h-[120px] focus:outline-none focus:border-[var(--orange-brand)] transition-colors resize-none"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        disabled={feedbackSubmitting || !feedbackContent.trim()}
                        onClick={handleSubmitFeedback}
                        className="px-5 py-2.5 rounded-xl bg-[var(--orange-brand)] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {feedbackSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Incident Report'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Status Messages & Global Save Button ── */}
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Your driver settings have been saved and synchronized successfully!
              </div>
            )}

            {saveError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Link
                href="/driver"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Link>

              <button
                type="submit"
                id="driver-settings-save-button"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[var(--orange-brand)] text-white text-xs font-extrabold hover:opacity-90 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
