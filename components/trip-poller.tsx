"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function TripPoller({ pendingTripIds }: { pendingTripIds: string[] }) {
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (pendingTripIds.length === 0) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trips/check?ids=${pendingTripIds.join(",")}`)
        if (res.ok) {
          const data = await res.json()
          const updatedTrips = data.trips || []
          
          let statusChanged = false
          for (const trip of updatedTrips) {
            if (trip.status === "CONFIRMED") {
              setToastMessage(`🎉 ${trip.driver?.name || "A driver"} accepted your ride!`)
              statusChanged = true
            }
          }
          
          if (statusChanged) {
            router.refresh()
          }
        }
      } catch (err) {
        console.error("Failed to poll trips")
      }
    }, 15000) // Poll every 15 seconds

    return () => clearInterval(interval)
  }, [pendingTripIds, router])

  if (!toastMessage) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-surface-elevated border-2 border-status-success text-text-primary px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-5 max-w-sm">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-status-success">Update</span>
        <p className="text-sm font-semibold">{toastMessage}</p>
      </div>
      <button 
        onClick={() => setToastMessage(null)}
        className="opacity-50 hover:opacity-100 transition-opacity p-1 bg-surface-card rounded-full border border-border-default text-text-muted hover:text-text-primary hover:border-text-muted shrink-0"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  )
}
