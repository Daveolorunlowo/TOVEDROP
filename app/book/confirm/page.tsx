'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Star,
  Car,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Footer } from '@/components/footer'
import { BookingProgress } from '@/components/booking-progress'

const TRIP = {
  pickup: 'Main Gate, Bowen University',
  destination: 'Murtala Muhammed International Airport',
  date: 'Wednesday, 30 July 2025',
  time: '07:30 AM',
}

const DRIVER = {
  name: 'Emeka Nwosu',
  rating: 4.9,
  trips: 312,
  vehicle: 'Toyota Corolla (Sedan)',
}

export default function ConfirmPage() {
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return (
      <div className="flex flex-col min-h-screen">

        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-secondary mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your trip with <strong>{DRIVER.name}</strong> has been confirmed.
              1 Drop has been deducted from your balance.
            </p>
            <div className="bg-card border border-border rounded-2xl p-5 text-left mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                {TRIP.date} at {TRIP.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {TRIP.pickup} → {TRIP.destination}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard" className={buttonVariants({ variant: "default", className: "bg-primary hover:bg-primary/90 text-foreground font-semibold" })}>
                View in My Trips
              </Link>
              <Link href="/" className={buttonVariants({ variant: "outline", className: "border-secondary text-secondary hover:bg-secondary hover:text-foreground" })}>
                Back to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <BookingProgress currentStep={3} />

          <h1 className="text-2xl font-extrabold text-secondary mb-1">Review your booking</h1>
          <p className="text-sm text-muted-foreground mb-7">
            Double-check the details before confirming.
          </p>

          <div className="space-y-4">
            {/* Trip summary */}
            <div className="bg-surface-elevated border border-border-default rounded-2xl p-5 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted mb-3">
                Trip Details
              </h2>
              <div className="flex flex-col">
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-brand" />
                    <span className="text-xs text-muted">Pickup</span>
                  </div>
                  <span className="text-sm font-medium text-primary text-right">{TRIP.pickup}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-orange-brand" />
                    <span className="text-xs text-muted">Destination</span>
                  </div>
                  <span className="text-sm font-medium text-primary text-right">{TRIP.destination}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted" />
                    <span className="text-xs text-muted">Date</span>
                  </div>
                  <span className="text-sm font-medium text-primary text-right">{TRIP.date}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted" />
                    <span className="text-xs text-muted">Time</span>
                  </div>
                  <span className="text-sm font-medium text-primary text-right">{TRIP.time}</span>
                </div>
              </div>
            </div>

            {/* Driver summary */}
            <div className="bg-surface-elevated border border-border-default rounded-2xl p-5 shadow-sm">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted mb-3">
                Your Driver
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="text-sm font-bold" style={{ background: 'var(--surface-card)', color: 'var(--text-secondary)' }}>
                      EN
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-status-success border-2 border-surface-elevated">
                    <CheckCircle className="w-2.5 h-2.5 text-foreground" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-primary">{DRIVER.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-1.5 text-sm text-primary">
                      <Star className="w-3 h-3 fill-orange-brand text-orange-brand" />
                      <span className="font-semibold">{DRIVER.rating}</span>
                      <span className="text-[10px] text-muted ml-0.5 tracking-wide uppercase">Rating</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-primary">
                      <Car className="w-3 h-3 text-muted" />
                      <span className="text-[10px] text-muted ml-0.5 tracking-wide uppercase">{DRIVER.vehicle}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment notice */}
            <div className="bg-status-success/10 border border-status-success/20 rounded-2xl p-5 flex gap-3">
              <CheckCircle className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-status-success mb-1">Booking Fee Paid via Drops</p>
                <p className="text-sm text-status-success/80 leading-relaxed">
                  1 Drop covers your booking fee. You'll pay your driver directly for the ride itself, as usual.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link 
              href="/book/drivers" 
              className={buttonVariants({ 
                variant: "outline", 
                className: "border-border-default text-secondary hover:border-purple-brand/40 hover:text-foreground bg-surface-card sm:w-auto flex items-center gap-2 justify-center" 
              })}
            >
              <ArrowLeft className="w-4 h-4" /> Change Driver
            </Link>
            <Button
              onClick={() => setConfirmed(true)}
              size="lg"
              className="bg-purple-brand hover:bg-purple-brand/90 text-foreground font-semibold flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Confirm Booking
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
