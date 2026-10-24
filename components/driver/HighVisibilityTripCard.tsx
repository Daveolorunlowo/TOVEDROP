'use client'

import React from 'react'
import { MapPin, Navigation, Clock, AlertTriangle, Check, Volume2, User, ExternalLink, MessageCircle, Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { formatTripSchedule } from '@/lib/trip-schedule'

interface HighVisibilityTripCardProps {
  trip: any
  isConfirmed?: boolean
  processing?: boolean
  clashInfo?: { clashes: boolean; reason?: string; timeDifferenceMinutes?: number }
  onAccept?: (trip: any) => void
  onDecline?: (tripId: string) => void
  onArrive?: (tripId: string) => void
  onDepart?: (tripId: string) => void
  onComplete?: (tripId: string) => void
  onOpenChat?: (trip: any) => void
  onSetAlarm?: (trip: any) => void
}

function getCountdownBadge(dateStr: string, timeStr: string, isScheduled: boolean) {
  if (!isScheduled) {
    return { text: '⚡ PICKUP NOW', isUrgent: true, label: 'Instant Departure' }
  }

  let target = new Date(`${dateStr}T${timeStr}:00`).getTime()
  if (isNaN(target)) target = new Date(`${dateStr} ${timeStr}`).getTime()
  if (isNaN(target)) return { text: timeStr, isUrgent: false, label: 'Scheduled' }

  const diffMs = target - Date.now()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMs <= 0 || diffMins <= 5) {
    return { text: '🚨 DUE RIGHT NOW', isUrgent: true, label: 'Depart Immediately' }
  }
  if (diffMins <= 15) {
    return { text: `⏰ IN ${diffMins} MINS`, isUrgent: true, label: 'Pickup Imminent' }
  }
  if (diffMins < 60) {
    return { text: `⏰ IN ${diffMins} MINS`, isUrgent: false, label: 'Upcoming' }
  }
  const h = Math.floor(diffMins / 60)
  const m = diffMins % 60
  return {
    text: `📅 IN ${h}H ${m > 0 ? `${m}M` : ''}`,
    isUrgent: false,
    label: `Scheduled for ${timeStr}`
  }
}

export function HighVisibilityTripCard({
  trip,
  isConfirmed = false,
  processing = false,
  clashInfo,
  onAccept,
  onDecline,
  onArrive,
  onDepart,
  onComplete,
  onOpenChat,
  onSetAlarm
}: HighVisibilityTripCardProps) {
  const countdown = getCountdownBadge(trip.date, trip.time, trip.isScheduled)
  const schedule = formatTripSchedule(trip)

  // Voice announcement helper
  const handleSpeakDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const pickupShort = trip.pickup.split(',')[0]
      const timeAnnounce = trip.isScheduled ? `${schedule.dayName}, ${schedule.timeFormatted}` : 'Instant pickup right now'
      const text = `Trip for ${trip.rider?.name || 'Rider'}. Pickup at ${pickupShort}. Time: ${timeAnnounce}.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      window.speechSynthesis.speak(utterance)
    } catch (err) {
      // ignore
    }
  }

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${
        countdown.isUrgent
          ? 'border-amber-500/60 bg-card ring-1 ring-amber-500/20'
          : 'border-border/80 bg-card hover:border-[var(--orange-brand)]/50'
      }`}
    >
      {/* ── 1. HIGH-CONTRAST TIME HERO HEADER ── */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          countdown.isUrgent
            ? 'bg-amber-500/15 border-amber-500/30'
            : 'bg-surface-elevated border-border/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ${
              countdown.isUrgent
                ? 'bg-amber-500 text-black animate-pulse'
                : 'bg-[var(--orange-brand)]/15 text-[var(--orange-brand)]'
            }`}
          >
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block leading-tight">
              {countdown.label}
            </span>
            <span
              className={`text-sm sm:text-base font-black tracking-tight ${
                countdown.isUrgent ? 'text-amber-500' : 'text-foreground'
              }`}
            >
              {schedule.dayName}, {schedule.shortDate} · {schedule.timeFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Read Out Loud Voice Button */}
          <button
            type="button"
            onClick={handleSpeakDetails}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Read out place & time aloud"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          {/* Time Badge */}
          <span
            className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
              countdown.isUrgent
                ? 'bg-amber-500 text-black animate-pulse'
                : 'bg-[var(--orange-brand)] text-white'
            }`}
          >
            {countdown.text}
          </span>
        </div>
      </div>

      {/* ── 2. DUAL LOCATION DISPLAY (Zero-Excuses Place Details) ── */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* EXACT PICKUP SPOT */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              EXACT PICKUP SPOT
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              Rider Waiting Here 📍
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-foreground tracking-tight leading-snug">
            {trip.pickup}
          </p>
        </div>

        {/* DROP-OFF DESTINATION */}
        <div className="p-3 rounded-xl bg-surface-elevated border border-border/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-muted-foreground" />
            DROP-OFF POINT
          </span>
          <p className="text-sm font-bold text-foreground">
            {trip.destination}
          </p>
        </div>

        {/* Rider Note if any */}
        {trip.notes && (
          <div className="px-3 py-2 rounded-lg bg-background border border-border/70 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Note:</span> {trip.notes}
          </div>
        )}

        {/* Clash Warning */}
        {clashInfo?.clashes && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>⚠️ {clashInfo.reason} ({clashInfo.timeDifferenceMinutes}m clash)</span>
          </div>
        )}

        {/* ── 3. RIDER INFO & ACTION BUTTONS ── */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/50">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                {trip.rider?.name?.slice(0, 2).toUpperCase() || 'R'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-bold text-foreground">{trip.rider?.name || 'Assigned Rider'}</p>
              <p className="text-[10px] text-muted-foreground">
                {trip.isPool ? '👥 Pool Ride' : '🚗 Solo Trip'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
            {/* If Incoming Pending Request */}
            {!isConfirmed && onAccept && (
              <>
                {onDecline && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => onDecline(trip.id)}
                    className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                )}

                <button
                  type="button"
                  disabled={processing || clashInfo?.clashes}
                  onClick={() => onAccept(trip)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    clashInfo?.clashes
                      ? 'bg-border text-muted-foreground cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98]'
                  }`}
                >
                  {processing ? (
                    'Processing...'
                  ) : clashInfo?.clashes ? (
                    'Clash ⚠️'
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      Accept ({schedule.shortDayName} · {schedule.timeFormatted})
                    </>
                  )}
                </button>
              </>
            )}

            {/* If Confirmed Trip */}
            {isConfirmed && (
              <>
                <Link
                  href={`/driver/trips/${trip.id}`}
                  className="px-3 py-1.5 rounded-lg border border-border hover:border-[var(--orange-brand)] transition-colors text-xs font-bold text-foreground flex items-center gap-1 bg-surface-elevated"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
                  Live Portal
                </Link>

                {onSetAlarm && (
                  <button
                    type="button"
                    onClick={() => onSetAlarm(trip)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      trip.tripReminders && trip.tripReminders.length > 0
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 shadow-xs'
                        : 'bg-surface-elevated border-border hover:border-amber-500/40 text-muted-foreground hover:text-foreground'
                    }`}
                    title={
                      trip.tripReminders && trip.tripReminders.length > 0
                        ? `Alarm active: ${trip.tripReminders[0].type} before pickup. Tap to adjust or cancel.`
                        : 'Set an alarm a few minutes before pickup'
                    }
                  >
                    <Bell className={`w-3.5 h-3.5 ${trip.tripReminders && trip.tripReminders.length > 0 ? 'text-amber-400 animate-pulse' : ''}`} />
                    <span>
                      {trip.tripReminders && trip.tripReminders.length > 0
                        ? `${trip.tripReminders[0].type} Alarm`
                        : 'Set Alarm'}
                    </span>
                  </button>
                )}

                {onOpenChat && (
                  <button
                    type="button"
                    onClick={() => onOpenChat(trip)}
                    className="p-2 rounded-lg border border-border text-[var(--orange-brand)] hover:bg-muted transition-colors cursor-pointer"
                    title="Chat with Rider"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}

                {!trip.driverArrivedAt && onArrive && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => onArrive(trip.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold transition-colors cursor-pointer"
                  >
                    I've Arrived 📍
                  </button>
                )}

                {!trip.driverDepartedAt && onDepart && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => onDepart(trip.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--orange-brand)] hover:opacity-90 text-white text-xs font-black shadow-xs transition-opacity cursor-pointer"
                  >
                    Depart 🚗💨
                  </button>
                )}

                {trip.driverDepartedAt && onComplete && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => onComplete(trip.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                  >
                    Mark Complete ✓
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
