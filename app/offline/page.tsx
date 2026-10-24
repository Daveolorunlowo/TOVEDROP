'use client'

import React from 'react'
import Link from 'next/link'
import { WifiOff, RefreshCw, Home, Car, Calendar } from 'lucide-react'

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[var(--orange-brand)]/15 border-2 border-[var(--orange-brand)]/30 flex items-center justify-center text-[var(--orange-brand)] shadow-2xl">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Offline Mode Active
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          No Internet Connection 📡
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          It looks like your connection dropped. Don't worry! TOVEDROP has cached your previous trips and dashboard data locally.
        </p>
      </div>

      <div className="mt-8 flex flex-col w-full max-w-xs gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="w-full py-3.5 px-5 rounded-2xl bg-[var(--orange-brand)] hover:opacity-90 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            href="/dashboard"
            className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[var(--orange-brand)]" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/driver"
            className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span>Driver Portal</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
