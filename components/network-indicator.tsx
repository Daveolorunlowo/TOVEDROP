"use client"

import { useState, useEffect } from 'react'
import { WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setIsReconnecting(true)
      
      // Show "Reconnected" briefly, then hide
      setTimeout(() => {
        setIsReconnecting(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
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
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2",
        !isOnline ? "bg-red-500/90 text-foreground" : "bg-green-500/90 text-foreground"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Poor connection detected. You are currently offline.</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Back online! Syncing data...</span>
        </>
      )}
    </div>
  )
}
