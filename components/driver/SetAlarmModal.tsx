'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  Bell,
  Volume2,
  VolumeX,
  Vibrate,
  Check,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  MapPin,
  Sparkles,
  Calendar
} from 'lucide-react'
import { startContinuousAlarm, stopAllAlarms } from '@/lib/alarm-sounds'
import { formatTripSchedule } from '@/lib/trip-schedule'

interface SetAlarmModalProps {
  trip: any
  isOpen: boolean
  onClose: () => void
  onAlarmSaved?: (savedReminder?: any) => void
}

const PRESET_MINUTES = [
  { value: 5, label: '5 mins', desc: 'Urgent departure ⚡' },
  { value: 10, label: '10 mins', desc: 'Recommended ⭐', popular: true },
  { value: 15, label: '15 mins', desc: 'Pre-trip buffer 🚗' },
  { value: 30, label: '30 mins', desc: 'Early headstart ⏱️' },
  { value: 45, label: '45 mins', desc: 'Long distance prep 🔔' },
  { value: 60, label: '60 mins', desc: '1 hour notice 📅' },
]

const ALARM_SOUNDS = [
  { id: 'loud', name: 'Insanely Loud Blast', desc: 'Maximum penetration' },
  { id: 'siren', name: 'Emergency Siren', desc: 'Continuous wail' },
  { id: 'urgent', name: 'High-Gain Dual Beep', desc: 'Sharp electronic pulse' },
  { id: 'radar', name: 'Radar Pulse', desc: 'Repeating sonar ping' },
  { id: 'chime', name: 'Ascending Chime', desc: 'Bright harmonic tones' },
]

export function SetAlarmModal({
  trip,
  isOpen,
  onClose,
  onAlarmSaved
}: SetAlarmModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10)
  const [customInput, setCustomInput] = useState<string>('')
  const [isCustom, setIsCustom] = useState<boolean>(false)
  const [selectedSound, setSelectedSound] = useState<string>('loud')
  const [vibrate, setVibrate] = useState<boolean>(true)
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [existingReminder, setExistingReminder] = useState<any | null>(null)

  // Stop any preview sound when modal closes or unmounts
  useEffect(() => {
    return () => {
      stopAllAlarms()
    }
  }, [])

  // Inspect existing reminder if any on mount or trip change
  useEffect(() => {
    if (!isOpen || !trip) return

    setError(null)
    setSuccessMsg(null)

    // Check if trip already has tripReminders
    if (trip.tripReminders && trip.tripReminders.length > 0) {
      const active = trip.tripReminders[0]
      setExistingReminder(active)
      const parsed = parseInt(active.type, 10)
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedMinutes(parsed)
        if (!PRESET_MINUTES.some(p => p.value === parsed)) {
          setIsCustom(true)
          setCustomInput(String(parsed))
        } else {
          setIsCustom(false)
        }
      }
    } else {
      // Fetch fresh from API
      fetch(`/api/driver/trips/${trip.id}/alarm`)
        .then(res => res.json())
        .then(data => {
          if (data?.reminders && data.reminders.length > 0) {
            const active = data.reminders[0]
            setExistingReminder(active)
            const parsed = parseInt(active.type, 10)
            if (!isNaN(parsed) && parsed > 0) {
              setSelectedMinutes(parsed)
              if (!PRESET_MINUTES.some(p => p.value === parsed)) {
                setIsCustom(true)
                setCustomInput(String(parsed))
              } else {
                setIsCustom(false)
              }
            }
          } else {
            setExistingReminder(null)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, trip])

  if (!isOpen || !trip) return null

  // Calculate target pickup timestamp
  let scheduledAt = new Date(`${trip.date}T${trip.time}`)
  if (isNaN(scheduledAt.getTime())) {
    scheduledAt = new Date(`${trip.date} ${trip.time}`)
  }
  if (isNaN(scheduledAt.getTime())) {
    scheduledAt = new Date(trip.date)
  }

  const effectiveMinutes = isCustom
    ? parseInt(customInput, 10) || 0
    : selectedMinutes

  const alarmTime = !isNaN(scheduledAt.getTime()) && effectiveMinutes > 0
    ? new Date(scheduledAt.getTime() - effectiveMinutes * 60 * 1000)
    : null

  const now = new Date()
  const isAlarmInPast = alarmTime ? alarmTime.getTime() <= now.getTime() : false
  const minsUntilAlarm = alarmTime
    ? Math.round((alarmTime.getTime() - now.getTime()) / 60000)
    : null

  const schedule = formatTripSchedule(trip)

  // Sound preview test handler
  const handleTogglePreview = () => {
    if (isPreviewing) {
      stopAllAlarms()
      setIsPreviewing(false)
    } else {
      setIsPreviewing(true)
      startContinuousAlarm({
        type: selectedSound,
        duration: 3, // Play 3s preview
        vibrate,
        volumeBoost: true,
        onStop: () => setIsPreviewing(false)
      })
    }
  }

  // Save alarm
  const handleSaveAlarm = async () => {
    if (effectiveMinutes <= 0) {
      setError('Please select or enter a valid number of minutes.')
      return
    }

    if (isAlarmInPast) {
      setError('The calculated alarm time is already in the past. Choose fewer minutes before pickup.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccessMsg(null)

      const res = await fetch(`/api/driver/trips/${trip.id}/alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutesBefore: effectiveMinutes,
          sound: selectedSound,
          vibrate
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to set alarm')
      }

      setSuccessMsg(data.message || 'Alarm successfully set!')
      setExistingReminder(data.reminder)

      if (onAlarmSaved) {
        onAlarmSaved(data.reminder)
      }

      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Error setting alarm. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Delete alarm
  const handleDeleteAlarm = async () => {
    try {
      setDeleting(true)
      setError(null)

      const res = await fetch(`/api/driver/trips/${trip.id}/alarm`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove alarm')
      }

      setExistingReminder(null)
      setSuccessMsg('Alarm removed successfully.')

      if (onAlarmSaved) {
        onAlarmSaved(null)
      }

      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Error removing alarm.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card border-2 border-border/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--orange-brand)]/15 text-[var(--orange-brand)] border border-[var(--orange-brand)]/30">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--orange-brand)] block">
              Driver Departure Alert
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Set Pickup Alarm ⏰
            </h2>
          </div>
        </div>

        {/* Trip Quick Context Card */}
        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
              {schedule.dayName}, {schedule.shortDate} · {schedule.timeFormatted}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              {trip.rider?.name || 'Rider'}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="truncate">{trip.pickup}</span>
          </div>
        </div>

        {/* Existing Active Alarm Pill if already set */}
        {existingReminder && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-500">Active Alarm: </span>
                <span className="text-foreground font-semibold">
                  {existingReminder.type} before pickup ({new Date(existingReminder.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteAlarm}
              className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              <span>Remove</span>
            </button>
          </div>
        )}

        {/* Choose Minutes Section */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Ring Alarm How Many Minutes Before Pickup?</span>
            <span className="text-[10px] text-[var(--orange-brand)] font-bold">Unmissable loud alert</span>
          </label>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESET_MINUTES.map((preset) => {
              const isSelected = !isCustom && selectedMinutes === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setSelectedMinutes(preset.value)
                    setIsCustom(false)
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[var(--orange-brand)]/15 border-[var(--orange-brand)] text-foreground shadow-sm ring-1 ring-[var(--orange-brand)]/50'
                      : 'bg-surface-card border-border hover:border-[var(--orange-brand)]/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.popular && (
                    <span className="absolute -top-2 right-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[var(--orange-brand)] text-white shadow-xs">
                      Best
                    </span>
                  )}
                  <p className="text-sm font-black text-foreground">{preset.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{preset.desc}</p>
                </button>
              )
            })}
          </div>

          {/* Custom Minutes Toggle & Input */}
          <div className="pt-1">
            {!isCustom ? (
              <button
                type="button"
                onClick={() => {
                  setIsCustom(true)
                  setCustomInput(String(selectedMinutes))
                }}
                className="text-xs text-[var(--orange-brand)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                + Choose custom minutes (e.g. 8m, 20m, 25m)
              </button>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--orange-brand)] bg-[var(--orange-brand)]/10">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Minutes before"
                  className="w-24 px-3 py-1.5 rounded-lg bg-background border border-border text-foreground font-black text-sm focus:outline-none focus:ring-2 focus:ring-[var(--orange-brand)]"
                  autoFocus
                />
                <span className="text-xs font-bold text-foreground">minutes before pickup</span>
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Use presets
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calculated Alarm Time Preview Card */}
        {alarmTime && (
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isAlarmInPast
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isAlarmInPast ? '⚠️ TIME ALREADY PASSED' : '⏰ SCHEDULED ALARM TIME'}
              </span>
              {minsUntilAlarm !== null && !isAlarmInPast && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {minsUntilAlarm <= 1 ? 'Ringing in <1m' : `In ~${minsUntilAlarm} mins`}
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg font-black text-foreground mt-0.5">
              {alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
              <span className="text-xs font-semibold text-muted-foreground">
                ({effectiveMinutes} mins before {schedule.timeFormatted} pickup)
              </span>
            </p>
            {isAlarmInPast && (
              <p className="text-xs text-red-400 mt-1">
                Pickup is scheduled too soon for a {effectiveMinutes}-minute alarm. Please select a smaller duration.
              </p>
            )}
          </div>
        )}

        {/* Sound & Vibration Options */}
        <div className="space-y-3 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Alarm Tone & Feedback
            </span>
            {/* Test Audio Button */}
            <button
              type="button"
              onClick={handleTogglePreview}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                isPreviewing
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-surface-elevated border-border text-foreground hover:border-[var(--orange-brand)]'
              }`}
              title="Test the high-volume alarm sound"
            >
              {isPreviewing ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
                  Test Tone 🔊
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Tone Selector */}
            <select
              value={selectedSound}
              onChange={(e) => setSelectedSound(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--orange-brand)] cursor-pointer"
            >
              {ALARM_SOUNDS.map((snd) => (
                <option key={snd.id} value={snd.id}>
                  {snd.name}
                </option>
              ))}
            </select>

            {/* Vibration Toggle */}
            <button
              type="button"
              onClick={() => setVibrate(!vibrate)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                vibrate
                  ? 'bg-foreground/10 border-foreground/30 text-foreground'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Vibrate className="w-4 h-4 text-[var(--orange-brand)]" />
                Vibrate Phone
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${vibrate ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                {vibrate ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || isAlarmInPast || effectiveMinutes <= 0}
            onClick={handleSaveAlarm}
            className="flex-2 py-3 px-5 rounded-xl bg-[var(--orange-brand)] hover:opacity-90 active:scale-[0.98] text-white text-sm font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Alarm...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Set Alarm ({effectiveMinutes}m Before) ⏰</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
