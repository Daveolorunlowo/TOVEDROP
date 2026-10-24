'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean>(false)
  const [showRestored, setShowRestored] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOffline = () => {
      setIsOffline(true)
      setShowRestored(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowRestored(true)
      const timer = setTimeout(() => {
        setShowRestored(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    // Set initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showRestored) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center p-2.5">
      {isOffline ? (
        <div className="pointer-events-auto bg-amber-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-300 border border-amber-400/40">
          <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          <span>You are currently offline. TOVEDROP is in offline mode.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Retry Connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto bg-emerald-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-4 duration-300 border border-emerald-400/40">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Connection restored! Syncing with server...</span>
        </div>
      )}
    </div>
  )
}
