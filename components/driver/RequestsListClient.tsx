'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, MapPin, Clock, Users, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PaginationControls } from '@/components/shared/PaginationControls'

const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

export function RequestsListClient({
  initialRequests,
  driverId,
  page,
  totalPages,
  totalItems,
  itemsPerPage
}: {
  initialRequests: any[]
  driverId: string
  page: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}) {
  const router = useRouter()
  const [declined, setDeclined] = useState<string[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [requests, setRequests] = useState(initialRequests)

  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  const handleDecline = (tripId: string) => {
    setDeclined(prev => [...prev, tripId])
  }

  const handleAccept = async (tripId: string) => {
    setProcessing(tripId)
    try {
      const res = await fetch(`/api/trips/${tripId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        // Optimistically remove from requests and redirect to trips tab
        setRequests(prev => prev.filter(r => r.id !== tripId))
        router.push('?tab=trips&subtab=upcoming')
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Failed to accept trip')
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while accepting the trip.')
    } finally {
      setProcessing(null)
    }
  }

  const visibleRequests = requests.filter(r => !declined.includes(r.id))
  
  // Group pooled trips
  const groupedRequests: any[] = []
  const pools = new Map<string, any[]>()
  
  for (const t of visibleRequests) {
    if (t.isPool && t.poolGroupId) {
      if (!pools.has(t.poolGroupId)) pools.set(t.poolGroupId, [])
      pools.get(t.poolGroupId)!.push(t)
    } else {
      groupedRequests.push(t)
    }
  }
  
  for (const [poolId, poolRides] of Array.from(pools.entries())) {
    groupedRequests.push({
      id: poolRides[0].id, // Driver accepts the first one, backend handles all
      isPoolGroup: true,
      poolCount: poolRides.length,
      rider: { name: `Pool: ${poolRides.length} Riders` },
      pickup: poolRides[0].pickup + (poolRides.length > 1 ? " & others" : ""),
      destination: poolRides[0].destination + (poolRides.length > 1 ? " & others" : ""),
      date: poolRides[0].date,
      time: poolRides[0].time,
      notes: poolRides.map(r => r.notes).filter(Boolean).join(" | "),
      isScheduled: poolRides[0].isScheduled
    })
  }

  if (groupedRequests.length === 0) {
    return (
      <div className="rounded-xl flex flex-col items-center justify-center py-16 text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
        <Clock className="w-12 h-12 mb-4 opacity-20 text-foreground" />
        <p className="text-sm font-medium text-muted-foreground">No new requests right now.</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">Make sure your status is set to Active to receive nearby requests.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupedRequests.map((trip) => {
          const isScheduled = trip.isScheduled;
          return (
            <div 
              key={trip.id} 
              className="rounded-xl overflow-hidden shadow-sm transition-all animate-in fade-in zoom-in-95"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', opacity: processing === trip.id ? 0.5 : 1 }}
            >
              <div className="p-4 border-b border-border/50 bg-surface-elevated flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarFallback className="text-[10px] font-bold bg-background text-muted-foreground">
                      {trip.isPoolGroup ? <Users className="w-3.5 h-3.5" /> : initials(trip.rider.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{trip.rider.name}</p>
                    {trip.isPoolGroup && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {trip.poolCount} Riders
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{trip.time}</p>
                  <p className="text-[10px] text-muted-foreground">{trip.date}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pickup</p>
                    <p className="text-sm font-medium text-foreground">{trip.pickup}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-secondary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Dropoff</p>
                    <p className="text-sm font-medium text-foreground">{trip.destination}</p>
                  </div>
                </div>

                {trip.notes && (
                  <div className="bg-background rounded p-2 border border-border/50 text-xs text-muted-foreground italic">
                    "{trip.notes}"
                  </div>
                )}
              </div>

              <div className="p-3 bg-surface-elevated border-t border-border/50 flex gap-2">
                <button
                  disabled={processing === trip.id}
                  onClick={() => handleDecline(trip.id)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-white/5 border border-border transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  disabled={processing === trip.id}
                  onClick={() => handleAccept(trip.id)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-orange-brand text-primary-foreground hover:brightness-110 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {processing === trip.id ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Accept <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {totalItems > 0 && (
        <PaginationControls 
          currentPage={page} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          itemsPerPage={itemsPerPage}
        />
      )}
    </>
  )
}
