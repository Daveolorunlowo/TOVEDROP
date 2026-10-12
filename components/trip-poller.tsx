"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pusherClient, useResilientChannel } from "@/lib/pusher-client"

export function TripPoller({ userId }: { userId: string }) {
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleEvent = (data: any, type: string) => {
    if (type === 'accepted') {
      setToastMessage(`🎉 ${data.driverName || "A driver"} accepted your ride! Taking you to your live trip...`)
      if (data.tripId) {
        // Automatically redirect rider to the dedicated active trip experience page!
        setTimeout(() => {
          router.push(`/dashboard/trips/${data.tripId}`)
        }, 800)
        return
      }
    }
    if (type === 'departed') {
      setToastMessage(`🚗💨 ${data.driverName || 'Your driver'} is taking off with you to ${data.destination || 'your destination'}!`)
    }
    if (type === 'completed') {
      setToastMessage(`✅ Your ride is complete! Don't forget to leave a review.`)
    }
    if (type === 'transferred') {
      setToastMessage(`⚠ Your driver has been changed for your upcoming trip.`)
    }
    if (type === 'cancelled') {
      setToastMessage("🚫 A trip was cancelled.")
    }
    router.refresh()
  }

  useResilientChannel(`user-trips-${userId}`, 'trip-accepted', (data) => handleEvent(data, 'accepted'))
  useResilientChannel(`user-trips-${userId}`, 'trip-departed', (data) => handleEvent(data, 'departed'))
  useResilientChannel(`user-trips-${userId}`, 'trip-completed', (data) => handleEvent(data, 'completed'))
  useResilientChannel(`user-trips-${userId}`, 'trip-transferred', (data) => handleEvent(data, 'transferred'))
  useResilientChannel(`user-trips-${userId}`, 'trip-cancelled', (data) => handleEvent(data, 'cancelled'))

  if (!toastMessage) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border-2 border-emerald-500 text-foreground px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-4 max-w-sm">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-emerald-500">Live Update</span>
        <p className="text-sm font-semibold">{toastMessage}</p>
      </div>
      <button 
        onClick={() => setToastMessage(null)}
        className="opacity-60 hover:opacity-100 transition-opacity p-1 bg-muted rounded-full border border-border text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  )
}
