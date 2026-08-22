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
        <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {trips.map((trip, i) => {
            const isLast = i === trips.length - 1
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
                className={cn("flex flex-col gap-3 px-4 py-4 transition-all")}
                style={{ 
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  borderLeft: subtab === 'upcoming' && statusLevel === 2 ? '3px solid var(--orange-brand)' : '3px solid transparent',
                  background: subtab === 'upcoming' && statusLevel === 2 ? 'rgba(217,119,6,0.02)' : 'transparent',
                  opacity: processing === trip.id ? 0.5 : 1
                }}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 shrink-0 shadow-sm border border-border">
                      <AvatarFallback className="text-[10px] font-bold bg-surface-elevated text-muted-foreground">
                        {initials(trip.rider.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${trip.status === 'CANCELLED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {trip.rider.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{trip.pickup}</span>
                        <span className="text-[10px] text-muted-foreground/60">→</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{trip.destination}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{trip.date} · {trip.time}</p>
                    </div>
                  </div>
                  
                  {subtab === 'upcoming' && (
                    <div className="shrink-0 flex flex-col items-end">
                      {statusLevel === 0 && (
                        <span className="text-[11px] font-medium text-muted-foreground">In {timeStr}</span>
                      )}
                      {statusLevel === 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-orange-brand"></span>
                          <span className="text-xs font-semibold text-orange-brand">In {timeStr}</span>
                        </div>
                      )}
                      {statusLevel === 2 && (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-orange-brand">Trip starting soon</span>
                          <span className="text-xs font-bold text-foreground">{timeStr}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {subtab === 'past' && (
                    <div className="shrink-0">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                        trip.status === 'COMPLETED' ? 'bg-foreground/10 text-foreground' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  )}
                </div>

                {subtab === 'upcoming' && (
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <button
                      onClick={() => downloadICS(trip, scheduledAt)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded bg-surface-elevated hover:bg-white/5 border border-border transition-colors text-foreground"
                    >
                      <Calendar className="w-3 h-3" />
                      Add to Calendar
                    </button>
                    {minsUntil > 15 ? (
                      <button
                        onClick={() => setTransferringTrip(trip)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-colors hover:bg-white/5 text-muted-foreground border border-border"
                      >
                        Transfer Trip
                      </button>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/60 mr-1 max-w-[80px] text-right leading-tight">Transfer unavailable — too close to pickup</span>
                    )}
                    <button
                      onClick={() => setActiveChatTrip(trip)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-colors hover:bg-white/5 text-green-500 border border-green-500/20"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Message
                    </button>
                    <button
                      disabled={processing === trip.id}
                      onClick={() => handleComplete(trip.id)}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 transition-all hover:bg-green-500/20 disabled:opacity-50"
                    >
                      {processing === trip.id ? '…' : 'Mark Complete'}
                    </button>
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
