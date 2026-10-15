'use client'

import React, { useState, useEffect } from 'react'
import { Check, Clock, MapPin, Navigation, Car, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react'

interface TripProgressStepperProps {
  trip: {
    id: string
    date: string
    time: string
    isScheduled: boolean
    status: string
    driverArrivedAt?: string | null
    driverDepartedAt?: string | null
    pickup: string
    destination: string
    isOverdue?: boolean
    riderCompensatedAt?: string | null
    driver?: {
      name?: string | null
    } | null
  }
}

export function TripProgressStepper({ trip }: TripProgressStepperProps) {
  const [now, setNow] = useState(Date.now())

  // Refresh every 15 seconds to update live ETA
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  // Calculate ETA / schedule countdown
  const getEtaInfo = () => {
    if (trip.status === 'COMPLETED') {
      return { label: 'Trip Completed', text: 'Arrived Safely', statusType: 'completed' as const }
    }
    if (trip.driverDepartedAt) {
      return { label: 'In Transit', text: 'Cruising to Drop-off 🚗💨', statusType: 'departed' as const }
    }
    if (trip.driverArrivedAt) {
      return { label: 'Driver Arrived', text: 'Waiting for you at pickup 📍', statusType: 'arrived' as const }
    }

    if (!trip.isScheduled) {
      return { label: 'Instant Pickup', text: 'Driver arriving in ~4-8 mins ⚡', statusType: 'imminent' as const }
    }

    let target = new Date(`${trip.date}T${trip.time}:00`).getTime()
    if (isNaN(target)) target = new Date(`${trip.date} ${trip.time}`).getTime()
    if (isNaN(target)) return { label: 'Scheduled', text: `${trip.time}`, statusType: 'scheduled' as const }

    const diffMs = target - now
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMs <= 0) {
      const lateMins = Math.abs(diffMins)
      if (lateMins > 15) {
        return { label: 'Overdue Guarantee', text: `${lateMins}m late (+1 Free Drop applied) 🎁`, statusType: 'overdue' as const }
      }
      return { label: 'Due Right Now', text: `Due right now (${lateMins}m grace period) 🚨`, statusType: 'urgent' as const }
    }
    if (diffMins <= 15) {
      return { label: 'Pickup Imminent', text: `Arriving in ~${diffMins} mins ⏰`, statusType: 'urgent' as const }
    }
    const h = Math.floor(diffMins / 60)
    const m = diffMins % 60
    return {
      label: 'Scheduled Ride',
      text: `In ${h}h ${m > 0 ? `${m}m` : ''} (${trip.time})`,
      statusType: 'scheduled' as const
    }
  }

  const eta = getEtaInfo()

  // 4 Core Stages:
  // 1: Confirmed (Driver accepted commitment)
  // 2: En Route (Heading to pickup)
  // 3: Arrived (Driver at pickup spot)
  // 4: In Transit (Taking off to destination)
  // 5: Completed

  const currentStep = trip.status === 'COMPLETED'
    ? 5
    : trip.driverDepartedAt
    ? 4
    : trip.driverArrivedAt
    ? 3
    : trip.status === 'CONFIRMED'
    ? 2
    : 1

  const steps = [
    {
      num: 1,
      title: 'Ride Committed',
      desc: `${trip.driver?.name?.split(' ')[0] || 'Driver'} locked in time & spot`,
      icon: ShieldCheck,
      isDone: currentStep >= 1,
      isActive: currentStep === 1
    },
    {
      num: 2,
      title: 'Heading to Pickup',
      desc: trip.driverArrivedAt ? 'Reached location' : eta.text,
      icon: Car,
      isDone: currentStep >= 2,
      isActive: currentStep === 2
    },
    {
      num: 3,
      title: 'At Pickup Point',
      desc: trip.driverArrivedAt
        ? `Waiting at ${trip.pickup.split(',')[0]}`
        : `Meeting at ${trip.pickup.split(',')[0]}`,
      icon: MapPin,
      isDone: currentStep >= 3,
      isActive: currentStep === 3
    },
    {
      num: 4,
      title: 'Cruising to Destination',
      desc: trip.driverDepartedAt
        ? `En route to ${trip.destination.split(',')[0]}`
        : `Drop-off at ${trip.destination.split(',')[0]}`,
      icon: Navigation,
      isDone: currentStep >= 4,
      isActive: currentStep === 4
    }
  ]

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* ── Header: Live Status & Countdown Badge ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
              eta.statusType === 'arrived'
                ? 'bg-emerald-500 text-white'
                : eta.statusType === 'departed'
                ? 'bg-[var(--orange-brand)] text-white'
                : eta.statusType === 'overdue'
                ? 'bg-amber-500 text-black'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {eta.statusType === 'arrived' ? (
              <MapPin className="w-4 h-4 animate-bounce" />
            ) : eta.statusType === 'departed' ? (
              <Navigation className="w-4 h-4 animate-pulse" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {eta.label}
            </p>
            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
              {eta.text}
            </h3>
          </div>
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-elevated border border-border text-foreground shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                eta.statusType === 'arrived'
                  ? 'bg-emerald-500 animate-ping'
                  : eta.statusType === 'departed'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="font-mono text-[11px]">
              {trip.status === 'CONFIRMED' ? 'LIVE TRACKING' : trip.status}
            </span>
          </span>
        </div>
      </div>

      {/* ── 4-Stage Campus Stepper Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
        {steps.map((s) => {
          const Icon = s.icon
          const isDone = s.isDone
          const isActive = s.isActive

          return (
            <div
              key={s.num}
              className={`p-3.5 rounded-xl border transition-all flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2.5 ${
                isActive
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                  : isDone
                  ? 'bg-surface-elevated border-border/80'
                  : 'bg-background/50 border-border/40 opacity-60'
              }`}
            >
              {/* On mobile: Icon is shrink-0 on the left. On sm+: Icon on left, number on right */}
              <div className="flex items-center justify-between sm:w-full shrink-0 sm:shrink">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm animate-pulse'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {isDone && !isActive ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <span className="hidden sm:inline text-[10px] font-mono font-bold text-muted-foreground">
                  0{s.num}
                </span>
              </div>

              {/* Title & Description — min-w-0 flex-1 expands to fill mobile row width */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-extrabold ${
                    isActive
                      ? 'text-emerald-400'
                      : isDone
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2 sm:line-clamp-none">
                  {s.desc}
                </p>
              </div>

              {/* Step number badge on mobile right side */}
              <span className="sm:hidden text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground shrink-0">
                0{s.num}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
