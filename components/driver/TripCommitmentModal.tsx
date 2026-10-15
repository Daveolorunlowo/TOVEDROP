'use client'

import React from 'react'
import { MapPin, Navigation, Clock, ShieldAlert, Check, X, AlertTriangle } from 'lucide-react'

interface TripCommitmentModalProps {
  trip: any | null
  isOpen: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function getCountdownText(dateStr: string, timeStr: string, isScheduled: boolean) {
  if (!isScheduled) return 'Immediate Pick-Up'
  let target = new Date(`${dateStr}T${timeStr}:00`).getTime()
  if (isNaN(target)) target = new Date(`${dateStr} ${timeStr}`).getTime()
  if (isNaN(target)) return `${timeStr}`

  const diffMs = target - Date.now()
  if (diffMs <= 0) return 'Immediate / Right Now'
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `In ${diffMins} min${diffMins > 1 ? 's' : ''}`
  const h = Math.floor(diffMins / 60)
  const m = diffMins % 60
  return `In ${h}h ${m > 0 ? `${m}m` : ''}`
}

export function TripCommitmentModal({
  trip,
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel
}: TripCommitmentModalProps) {
  if (!isOpen || !trip) return null

  const countdown = getCountdownText(trip.date, trip.time, trip.isScheduled)

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl bg-card border-2 border-[var(--orange-brand)]/50 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[var(--orange-brand)] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            <div>
              <h3 className="text-base font-black tracking-wide uppercase">
                Lock In Ride Commitment
              </h3>
              <p className="text-xs text-white/90 font-medium">
                Verify you can reach this exact time & place
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* ── 1. GIANT TIME CAPSULE ── */}
          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 stroke-[3]" />
                REQUIRED ARRIVAL TIME
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-black shadow-sm">
                {countdown}
              </span>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight pt-1">
              {trip.isScheduled ? `${trip.time} · ${trip.date}` : `RIGHT NOW (${trip.time})`}
            </p>
          </div>

          {/* ── 2. GIANT PICKUP SPOT ── */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 stroke-[3]" />
                EXACT PICKUP SPOT (RIDER IS WAITING HERE)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-lg font-black text-foreground tracking-tight leading-snug pt-1">
              {trip.pickup}
            </p>
          </div>

          {/* ── 3. DESTINATION POINT ── */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              DROP-OFF DESTINATION
            </span>
            <p className="text-sm font-semibold text-foreground">
              {trip.destination}
            </p>
          </div>

          {/* Rider note if any */}
          {trip.notes && (
            <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground border border-border/60">
              <span className="font-bold text-foreground">Rider Note:</span> "{trip.notes}"
            </div>
          )}

          {/* ── 4. ZERO-EXCUSE COMMITMENT PLEDGE ── */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold text-red-500 uppercase tracking-wide mb-0.5">
                No-Excuse Arrival Policy
              </p>
              By tapping accept below, you confirm you have noted the exact pickup location and arrival time. Arriving more than 15 minutes late triggers automated late warnings and wallet penalties.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-1/3 py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel / Decline
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-2/3 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                'Accepting Trip...'
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  I Commit to This Time & Place
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
