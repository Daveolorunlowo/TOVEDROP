'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, MessageSquare, CheckCircle, Car } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { ChatModal } from '@/components/chat-modal'
import { TransferTripModal } from '@/components/driver/TransferTripModal'
import { cn } from '@/lib/utils'

const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

function downloadICS(trip: any, scheduledAt: number) {
  const dtStart = new Date(scheduledAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dtEnd = new Date(scheduledAt + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' // Assume 30 min duration
  const summary = `TOVEDROP: Ride for ${trip.rider?.name}`
  const description = `Pickup: ${trip.pickup}\\nDestination: ${trip.destination}${trip.notes ? '\\nNotes: ' + trip.notes : ''}`
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\\r\\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `tovedrop-ride-${trip.id}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function DriverTripListClient({
  initialTrips,
  subtab,
  driverId,
  page,
  totalPages,
  totalItems,
  itemsPerPage
}: {
  initialTrips: any[]
  subtab: 'upcoming' | 'past'
  driverId: string
  page: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}) {
  const router = useRouter()
  const [trips, setTrips] = useState(initialTrips)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeChatTrip, setActiveChatTrip] = useState<any | null>(null)
  const [transferringTrip, setTransferringTrip] = useState<any | null>(null)

  useEffect(() => {
    setTrips(initialTrips)
  }, [initialTrips])

  const handleComplete = async (tripId: string) => {
    setProcessing(tripId)
    try {
      const res = await fetch(`/api/trips/${tripId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setTrips(prev => prev.filter(t => t.id !== tripId))
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.message || 'Failed to complete trip.')
      }
    } catch (e) {
      console.error(e)
      alert('Error marking trip as complete.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div id="paginated-container" className="space-y-6 scroll-mt-24">
      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-surface-elevated rounded-lg border border-border-subtle max-w-[300px]">
        <Link 
          href="?tab=trips&subtab=upcoming" 
          scroll={false}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors ${
            subtab === 'upcoming' ? 'bg-orange-brand text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming
        </Link>
        <Link 
          href="?tab=trips&subtab=past" 
          scroll={false}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors ${
            subtab === 'past' ? 'bg-orange-brand text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Past
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center justify-center py-16 text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <Car className="w-12 h-12 mb-4 opacity-20 text-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No {subtab} trips found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip, i) => {
            const scheduledAt = new Date(`${trip.date} ${trip.time}`).getTime()
            const now = Date.now()
            const msUntil = scheduledAt - now
            const minsUntil = Math.floor(msUntil / 60000)

            let statusLevel = 0 // 0 = far, 1 = soon, 2 = very soon/active
            let timeStr = `${minsUntil} min${minsUntil !== 1 ? 's' : ''}`
            
            if (minsUntil > 60) {
              const h = Math.floor(minsUntil / 60)
              const m = minsUntil % 60
              timeStr = `${h}h ${m}m`
            } else if (minsUntil <= 15 && minsUntil > 0) {
              statusLevel = 1
            } else if (minsUntil <= 0) {
              statusLevel = 2
              timeStr = `Started`
            }

            return (
              <div
                key={trip.id}
                className={cn("relative flex flex-col p-5 rounded-2xl border transition-all duration-300", 
                  subtab === 'upcoming' && statusLevel === 2 
                    ? 'border-orange-brand/50 bg-orange-brand/5 shadow-[0_0_20px_rgba(249,115,22,0.05)]'
                    : 'border-border-default bg-surface-card hover:border-border hover:shadow-sm'
                )}
                style={{ opacity: processing === trip.id ? 0.5 : 1 }}
              >
                {/* Header: Rider & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border/50 shadow-sm">
                      <AvatarFallback className="bg-surface-elevated text-sm font-bold text-foreground">
                        {initials(trip.rider.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`font-bold ${trip.status === 'CANCELLED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {trip.rider.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {trip.date} • {trip.time}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  {subtab === 'upcoming' && (
                    <div className="text-right flex flex-col items-end">
                      {statusLevel === 0 && (
                        <div className="bg-surface-elevated border border-border text-muted-foreground text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                          In {timeStr}
                        </div>
                      )}
                      {statusLevel === 1 && (
                        <div className="flex items-center gap-1.5 bg-orange-brand/10 border border-orange-brand/20 text-orange-brand text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-brand animate-pulse"></span>
                          In {timeStr}
                        </div>
                      )}
                      {statusLevel === 2 && (
                        <div className="flex flex-col items-end">
                          <span className="bg-orange-brand text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-1">
                            STARTING SOON
                          </span>
                          <span className="text-xs font-bold text-orange-brand">{timeStr}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {subtab === 'past' && (
                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      trip.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {trip.status}
                    </div>
                  )}
                </div>

                {/* Route */}
                <div className="bg-surface-elevated/50 rounded-xl p-3 mb-4 flex items-center gap-3 border border-border/50">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-brand border-2 border-background shadow-sm z-10" />
                    <div className="w-[1.5px] h-6 bg-border" />
                    <div className="w-2 h-2 rounded-sm bg-purple-brand border-2 border-background shadow-sm z-10" />
                  </div>
                  <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground mb-4">{trip.pickup}</p>
                    <p className="text-sm font-medium truncate text-foreground">{trip.destination}</p>
                  </div>
                </div>

                {/* Actions */}
                {subtab === 'upcoming' && (
                  <div className="mt-auto pt-2 flex flex-col gap-2">
                    {/* Primary Actions (Row 1) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveChatTrip(trip)}
                        className="flex-[0.4] flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg transition-colors bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-orange-brand" />
                        Chat
                      </button>
                      <button
                        disabled={processing === trip.id}
                        onClick={() => handleComplete(trip.id)}
                        className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {processing === trip.id ? 'Processing…' : 'Mark Complete'}
                      </button>
                    </div>

                    {/* Secondary Actions (Row 2) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadICS(trip, scheduledAt)}
                        className="flex-[0.4] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg py-2 transition-colors border border-transparent hover:border-border"
                        title="Add to Calendar"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      
                      <div className="flex-1">
                        {minsUntil > 15 ? (
                          <button
                            onClick={() => setTransferringTrip(trip)}
                            className="w-full text-[11px] font-semibold py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-surface-elevated border border-transparent hover:border-border"
                          >
                            Transfer to another driver
                          </button>
                        ) : (
                          <p className="text-[10px] text-muted-foreground/50 text-center px-2 py-2">
                            Transfer unavailable (too close)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalItems > 0 && (
        <PaginationControls 
          currentPage={page} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          itemsPerPage={itemsPerPage}
        />
      )}

      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={driverId}
          otherPartyName={activeChatTrip.rider?.name ?? 'Rider'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}

      {transferringTrip && (
        <TransferTripModal
          trip={transferringTrip}
          onClose={() => setTransferringTrip(null)}
        />
      )}
    </div>
  )
}
