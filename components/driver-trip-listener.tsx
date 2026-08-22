"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pusherClient } from "@/lib/pusher-client"

export function DriverTripListener() {
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!pusherClient) return
    const channel = pusherClient.subscribe('global-trips')
    
    channel.bind('new-trip', (data: any) => {
      setToastMessage(`A new trip request is available!`)
      router.refresh()
    })

    return () => {
      if (pusherClient) pusherClient.unsubscribe('global-trips')
    }
  }, [router])

  if (!toastMessage) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-card border-2 text-[#f5f5f5] px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-6 animate-in slide-in-from-top-5 max-w-sm" style={{ borderColor: 'var(--orange-brand)' }}>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em]" style={{ color: 'var(--orange-brand)' }}>New Trip</span>
        <p className="text-sm font-semibold">{toastMessage}</p>
      </div>
      <button 
        onClick={() => setToastMessage(null)}
        className="opacity-50 hover:opacity-100 transition-opacity p-1 rounded-full border border-border hover:border-[#555] shrink-0"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  )
}
