"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pusherClient, useResilientChannel } from "@/lib/pusher-client"
export function TripPoller({ userId }: { userId: string }) {
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleEvent = (data: any, type: string) => {
    if (type === 'accepted') setToastMessage(`🎉 ${data.driverName || "A driver"} accepted your ride!`)
    if (type === 'completed') setToastMessage(`✅ Your ride is complete! Don't forget to leave a review.`)
    router.refresh()
  }

  useResilientChannel(`user-trips-${userId}`, 'trip-accepted', (data) => handleEvent(data, 'accepted'), () => router.refresh())
  useResilientChannel(`user-trips-${userId}`, 'trip-completed', (data) => handleEvent(data, 'completed'))

  if (!toastMessage) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-surface-elevated border-2 border-status-success text-primary px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-5 max-w-sm">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-status-success">Update</span>
        <p className="text-sm font-semibold">{toastMessage}</p>
      </div>
      <button 
        onClick={() => setToastMessage(null)}
        className="opacity-50 hover:opacity-100 transition-opacity p-1 bg-surface-card rounded-full border border-border-default text-muted hover:text-primary hover:border-text-muted shrink-0"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  )
}
