'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react'

interface ComfortableTimePickerProps {
  dateStr: string
  timeStr: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  minHoursAhead?: number // default 2 hours
  error?: string
}

// Convert 24h "HH:mm" to 12h parts
function parse24to12(time24: string) {
  if (!time24 || !time24.includes(':')) {
    const now = new Date()
    const h = now.getHours()
    const m = Math.ceil(now.getMinutes() / 15) * 15
    return {
      hour12: h % 12 === 0 ? 12 : h % 12,
      minute: m >= 60 ? 0 : m,
      ampm: h >= 12 ? 'PM' : 'AM' as 'AM' | 'PM'
    }
  }
  const [hStr, mStr] = time24.split(':')
  const h = parseInt(hStr, 10) || 0
  const m = parseInt(mStr, 10) || 0
  return {
    hour12: h % 12 === 0 ? 12 : h % 12,
    minute: m,
    ampm: (h >= 12 ? 'PM' : 'AM') as 'AM' | 'PM'
  }
}

// Convert 12h parts to "HH:mm"
function format12to24(hour12: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12
  if (ampm === 'PM') h += 12
  const hStr = String(h).padStart(2, '0')
  const mStr = String(minute).padStart(2, '0')
  return `${hStr}:${mStr}`
}

// Format "HH:mm" to user-friendly "2:30 PM"
export function formatTimeFriendly(time24: string): string {
  if (!time24) return ''
  const { hour12, minute, ampm } = parse24to12(time24)
  const mStr = String(minute).padStart(2, '0')
  return `${hour12}:${mStr} ${ampm}`
}

export function ComfortableTimePicker({
  dateStr,
  timeStr,
  onDateChange,
  onTimeChange,
  minHoursAhead = 2,
  error
}: ComfortableTimePickerProps) {
  const [viewMode, setViewMode] = useState<'slots' | 'custom'>('slots')
  const [activePeriod, setActivePeriod] = useState<'afternoon' | 'evening' | 'morning'>('afternoon')

  // Generate today, tomorrow, and day after dates
  const quickDays = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 0; i < 4; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateKey = `${yyyy}-${mm}-${dd}`
      const label =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short' })
      const subLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      days.push({ key: dateKey, label, subLabel, dateObj: d })
    }
    return days
  }, [])

  // Calculate the earliest allowed time for the selected date
  const earliestAllowed = useMemo(() => {
    const now = new Date()
    const todayStr = quickDays[0]?.key
    const isToday = dateStr === todayStr

    if (!isToday) {
      // Future date: earliest allowed is 06:00 AM
      return { hour: 6, minute: 0, date: null }
    }

    // Today: must be at least minHoursAhead (2 hours) from now, rounded up to next 15-min slot
    const minTime = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000)
    let minMinute = Math.ceil(minTime.getMinutes() / 15) * 15
    let minHour = minTime.getHours()
    if (minMinute >= 60) {
      minHour += 1
      minMinute = 0
    }
    return { hour: minHour, minute: minMinute, date: minTime }
  }, [dateStr, quickDays, minHoursAhead])

  // Is the current selected time valid?
  const validity = useMemo(() => {
    if (!dateStr || !timeStr) return { isValid: false, message: 'Please select a pickup time' }

    const now = new Date()
    const selected = new Date(`${dateStr}T${timeStr}:00`)
    if (isNaN(selected.getTime())) return { isValid: false, message: 'Invalid time' }

    const minAllowedDate = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000)

    if (selected < now) {
      return { isValid: false, message: 'Selected time has already passed.' }
    }
    if (selected < minAllowedDate) {
      const earliestStr = `${earliestAllowed.hour % 12 || 12}:${String(earliestAllowed.minute).padStart(2, '0')} ${earliestAllowed.hour >= 12 ? 'PM' : 'AM'}`
      return {
        isValid: false,
        message: `Must be at least ${minHoursAhead} hours from now. (Earliest today: ${earliestStr})`
      }
    }

    // Time difference for friendly badge
    const diffMs = selected.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    let diffText = ''
    if (diffHours > 0) diffText += `${diffHours} hr${diffHours > 1 ? 's' : ''} `
    if (diffMins > 0) diffText += `${diffMins} min${diffMins > 1 ? 's' : ''}`
    if (!diffText) diffText = 'shortly'

    return { isValid: true, diffText: `in ~${diffText}` }
  }, [dateStr, timeStr, minHoursAhead, earliestAllowed])

  // Automatically adjust default period when switching date
  useEffect(() => {
    const isToday = dateStr === quickDays[0]?.key
    if (isToday) {
      if (earliestAllowed.hour >= 17) {
        setActivePeriod('evening')
      } else {
        setActivePeriod('afternoon')
      }
    }
  }, [dateStr, quickDays, earliestAllowed])

  // 1-Tap Quick preset helpers
  const handlePickEarliest = () => {
    const now = new Date()
    const earliest = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000)
    let m = Math.ceil(earliest.getMinutes() / 15) * 15
    let h = earliest.getHours()
    if (m >= 60) {
      h += 1
      m = 0
    }
    if (h >= 24) {
      // Moves to tomorrow
      const tomorrow = quickDays[1].key
      onDateChange(tomorrow)
      onTimeChange(`08:00`)
    } else {
      const todayStr = quickDays[0].key
      onDateChange(todayStr)
      onTimeChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  const handlePickOffsetHours = (hours: number) => {
    const now = new Date()
    const target = new Date(now.getTime() + hours * 60 * 60 * 1000)
    let m = Math.round(target.getMinutes() / 15) * 15
    let h = target.getHours()
    if (m >= 60) {
      h += 1
      m = 0
    }
    const yyyy = target.getFullYear()
    const mm = String(target.getMonth() + 1).padStart(2, '0')
    const dd = String(target.getDate()).padStart(2, '0')
    onDateChange(`${yyyy}-${mm}-${dd}`)
    onTimeChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  // Pre-generated time slot arrays for each time of day
  const slotsByPeriod = useMemo(() => {
    const generateSlots = (startH: number, endH: number) => {
      const list: { time24: string; label: string; hour: number; minute: number }[] = []
      for (let h = startH; h <= endH; h++) {
        for (const m of [0, 15, 30, 45]) {
          if (h === endH && m > 0) break
          const h24 = String(h).padStart(2, '0')
          const m24 = String(m).padStart(2, '0')
          const time24 = `${h24}:${m24}`
          const ampm = h >= 12 ? 'PM' : 'AM'
          const h12 = h % 12 === 0 ? 12 : h % 12
          const label = `${h12}:${m24} ${ampm}`
          list.push({ time24, label, hour: h, minute: m })
        }
      }
      return list
    }

    return {
      morning: generateSlots(7, 11), // 7:00 AM - 11:45 AM
      afternoon: generateSlots(12, 16), // 12:00 PM - 4:45 PM
      evening: generateSlots(17, 22) // 5:00 PM - 10:00 PM
    }
  }, [])

  // Helper to test if a slot is disabled for the selected date
  const isSlotDisabled = (h: number, m: number) => {
    const isToday = dateStr === quickDays[0]?.key
    if (!isToday) return false // All daytime slots allowed for future days
    if (h < earliestAllowed.hour) return true
    if (h === earliestAllowed.hour && m < earliestAllowed.minute) return true
    return false
  }

  // Custom 12-hour controls state
  const { hour12, minute, ampm } = parse24to12(timeStr)

  const handleCustomHour = (newHour: number) => {
    onTimeChange(format12to24(newHour, minute, ampm))
  }

  const handleCustomMinute = (newMin: number) => {
    onTimeChange(format12to24(hour12, newMin, ampm))
  }

  const handleCustomAmpm = (newAmpm: 'AM' | 'PM') => {
    onTimeChange(format12to24(hour12, minute, newAmpm))
  }

  const handleStepMinute = (delta: number) => {
    let nextMin = minute + delta
    let nextHour = hour12
    let nextAmpm = ampm

    if (nextMin >= 60) {
      nextMin = 0
      nextHour = nextHour === 12 ? 1 : nextHour + 1
      if (nextHour === 12) nextAmpm = nextAmpm === 'AM' ? 'PM' : 'AM'
    } else if (nextMin < 0) {
      nextMin = 45
      nextHour = nextHour === 1 ? 12 : nextHour - 1
      if (nextHour === 11) nextAmpm = nextAmpm === 'AM' ? 'PM' : 'AM'
    }
    onTimeChange(format12to24(nextHour, nextMin, nextAmpm))
  }

  return (
    <div className="space-y-4">
      {/* ── 1. COMFORTABLE DATE PILLS ── */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
          Select Pickup Date
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickDays.map((day) => {
            const isSelected = dateStr === day.key
            return (
              <button
                type="button"
                key={day.key}
                onClick={() => onDateChange(day.key)}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[var(--orange-brand)]/15 border-[var(--orange-brand)] text-foreground shadow-sm ring-1 ring-[var(--orange-brand)]'
                    : 'bg-surface-elevated border-border-subtle hover:border-border-default text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">{day.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-[var(--orange-brand)] stroke-[3]" />}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{day.subLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 2. 1-TAP COMFORT QUICK PRESETS ── */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Fast 1-Tap Suggestions
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePickEarliest}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
          >
            ⚡ Earliest (+2h)
          </button>
          <button
            type="button"
            onClick={() => handlePickOffsetHours(3)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-muted-foreground hover:text-foreground border border-border-subtle hover:border-border-default transition-all cursor-pointer"
          >
            +3 Hours
          </button>
          <button
            type="button"
            onClick={() => handlePickOffsetHours(5)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-muted-foreground hover:text-foreground border border-border-subtle hover:border-border-default transition-all cursor-pointer"
          >
            +5 Hours
          </button>
          <button
            type="button"
            onClick={() => {
              onTimeChange('15:00')
              setActivePeriod('afternoon')
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-muted-foreground hover:text-foreground border border-border-subtle hover:border-border-default transition-all cursor-pointer"
          >
            3:00 PM
          </button>
          <button
            type="button"
            onClick={() => {
              onTimeChange('18:00')
              setActivePeriod('evening')
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-elevated text-muted-foreground hover:text-foreground border border-border-subtle hover:border-border-default transition-all cursor-pointer"
          >
            6:00 PM
          </button>
        </div>
      </div>

      {/* ── 3. TIME PICKING MODE SELECTOR & PERIOD TABS ── */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--orange-brand)]" />
            <span className="text-xs font-bold text-foreground">Pickup Time</span>
          </div>

          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setViewMode('slots')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'slots'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Time Slots
            </button>
            <button
              type="button"
              onClick={() => setViewMode('custom')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'custom'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Custom Dial
            </button>
          </div>
        </div>

        {/* ── MODE 1: HUMAN TIME SLOTS (RECOMMENDED) ── */}
        {viewMode === 'slots' && (
          <div className="space-y-3">
            {/* Period sub-tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-elevated rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setActivePeriod('afternoon')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePeriod === 'afternoon'
                    ? 'bg-background text-[var(--orange-brand)] shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Afternoon
              </button>
              <button
                type="button"
                onClick={() => setActivePeriod('evening')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePeriod === 'evening'
                    ? 'bg-background text-[var(--orange-brand)] shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Evening
              </button>
              <button
                type="button"
                onClick={() => setActivePeriod('morning')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePeriod === 'morning'
                    ? 'bg-background text-[var(--orange-brand)] shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sunrise className="w-3.5 h-3.5" />
                Morning
              </button>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1 pr-1.5">
              {slotsByPeriod[activePeriod].map((slot) => {
                const disabled = isSlotDisabled(slot.hour, slot.minute)
                const isSelected = timeStr === slot.time24
                return (
                  <button
                    type="button"
                    key={slot.time24}
                    disabled={disabled}
                    onClick={() => onTimeChange(slot.time24)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                      disabled
                        ? 'opacity-30 border-border/40 text-muted-foreground cursor-not-allowed bg-muted/20 line-through'
                        : isSelected
                        ? 'bg-[var(--orange-brand)] text-white border-[var(--orange-brand)] shadow-sm ring-2 ring-[var(--orange-brand)]/30 scale-[1.02]'
                        : 'bg-background border-border hover:border-[var(--orange-brand)]/60 text-foreground'
                    }`}
                  >
                    {slot.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── MODE 2: CUSTOM TACTILE 12-HOUR DIAL ── */}
        {viewMode === 'custom' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Live Clock Display & 5-min Steppers */}
            <div className="flex items-center justify-center gap-4 py-2 bg-surface-elevated rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => handleStepMinute(-5)}
                className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:border-[var(--orange-brand)] transition-colors cursor-pointer"
                title="Subtract 5 minutes"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="text-2xl font-mono font-extrabold text-foreground tracking-tight">
                {hour12}:{String(minute).padStart(2, '0')}{' '}
                <span className="text-base text-[var(--orange-brand)]">{ampm}</span>
              </div>

              <button
                type="button"
                onClick={() => handleStepMinute(5)}
                className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:border-[var(--orange-brand)] transition-colors cursor-pointer"
                title="Add 5 minutes"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AM / PM Segmented Switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCustomAmpm('AM')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  ampm === 'AM'
                    ? 'bg-[var(--orange-brand)] text-white border-[var(--orange-brand)] shadow-sm'
                    : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                AM (Morning)
              </button>
              <button
                type="button"
                onClick={() => handleCustomAmpm('PM')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  ampm === 'PM'
                    ? 'bg-[var(--orange-brand)] text-white border-[var(--orange-brand)] shadow-sm'
                    : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                PM (Afternoon / Evening)
              </button>
            </div>

            {/* Hour Selector Buttons */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Hour:
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                  const isHourSelected = hour12 === h
                  return (
                    <button
                      type="button"
                      key={h}
                      onClick={() => handleCustomHour(h)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isHourSelected
                          ? 'bg-[var(--orange-brand)] text-white border-[var(--orange-brand)]'
                          : 'bg-background border-border text-foreground hover:border-border-default'
                      }`}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Minute Selector Buttons */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Minute:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 15, 30, 45].map((m) => {
                  const isMinSelected = minute === m
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => handleCustomMinute(m)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isMinSelected
                          ? 'bg-[var(--orange-brand)] text-white border-[var(--orange-brand)]'
                          : 'bg-background border-border text-foreground hover:border-border-default'
                      }`}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. LIVE SELECTION SUMMARY & VALIDATION FEEDBACK ── */}
        <div className="pt-2 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Selected Pickup:</p>
              <p className="text-sm font-bold text-foreground">
                {quickDays.find((d) => d.key === dateStr)?.label || dateStr} at{' '}
                <span className="text-[var(--orange-brand)] font-extrabold">
                  {formatTimeFriendly(timeStr)}
                </span>
              </p>
            </div>

            {validity.isValid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 self-start sm:self-auto">
                <Check className="w-3.5 h-3.5" />
                Valid ({validity.diffText})
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePickEarliest}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-colors self-start sm:self-auto cursor-pointer"
                title="Click to automatically jump to the earliest allowed time"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Fix: Tap For Earliest
              </button>
            )}
          </div>

          {/* Validation Warning */}
          {!validity.isValid && validity.message && (
            <p className="text-xs text-amber-500 font-medium mt-1.5 flex items-center gap-1">
              <span>⚠️</span>
              {validity.message}
            </p>
          )}

          {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
        </div>
      </div>
    </div>
  )
}
