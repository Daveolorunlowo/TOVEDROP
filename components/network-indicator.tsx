"use client"

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setIsReconnecting(true)
      
      const timer = setTimeout(() => {
        setIsReconnecting(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsReconnecting(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !isReconnecting) return null

  return (
    <div className="fixed top-2.5 left-0 right-0 z-[100000] pointer-events-none flex justify-center px-4 animate-in slide-in-from-top-4 duration-300">
      <div 
        className={cn(
          "pointer-events-auto px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md",
          !isOnline 
            ? "bg-amber-600/95 text-white border-amber-400/40" 
            : "bg-emerald-600/95 text-white border-emerald-400/40"
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>You're offline · TOVEDROP is in offline mode</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              title="Retry connection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 shrink-0" />
            <span>Back online! Syncing latest data...</span>
          </>
        )}
      </div>
    </div>
  )
}
