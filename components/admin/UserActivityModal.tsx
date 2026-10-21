'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Navigation, Activity, MessageSquare, MapPin, Map, CreditCard } from 'lucide-react'

export function UserActivityModal({ user, onClose }: { user: any, onClose: () => void }) {
  const [data, setData] = useState<{ trips: any[], drops: any[], feedbacks: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'trips' | 'drops' | 'feedbacks'>('trips')

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${user.id}/activity`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch activity', error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [user.id])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-brand" />
              Activity Monitor
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Viewing history for <span className="text-foreground font-semibold">{user.name}</span> ({user.email})
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border px-5 gap-6 pt-2 bg-surface-elevated/40">
          {(['trips', 'drops', 'feedbacks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
                activeTab === tab ? 'text-orange-brand' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-brand rounded-t-full shadow-sm" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-orange-brand" />
              <span className="text-xs font-medium">Loading activity stream...</span>
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-red-500 text-xs">Failed to load user activity data.</div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'trips' && (
                data.trips.length === 0 ? (
                  <p className="text-muted-foreground text-xs text-center py-12">No recent trips found for this user.</p>
                ) : (
                  data.trips.map(trip => (
                    <div key={trip.id} className="p-3.5 bg-surface-elevated/70 rounded-xl border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center shrink-0">
                          <Map className="w-4 h-4 text-orange-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">
                            {trip.riderId === user.id ? 'Requested Ride' : 'Drove for Rider'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[220px] sm:max-w-[340px]">
                            {trip.pickupLocation} <span className="text-orange-brand mx-1">→</span> {trip.dropoffLocation}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-muted-foreground inline-block mb-1">
                          {trip.status}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{new Date(trip.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'drops' && (
                data.drops.length === 0 ? (
                  <p className="text-muted-foreground text-xs text-center py-12">No recent drop transactions recorded.</p>
                ) : (
                  data.drops.map(drop => {
                    const isPositive = drop.type === 'EARNED' || drop.type === 'PURCHASED'
                    return (
                      <div key={drop.id} className="p-3.5 bg-surface-elevated/70 rounded-xl border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">{drop.type}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{drop.description || 'No details provided'}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : '-'}{drop.amount} drops
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(drop.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })
                )
              )}

              {activeTab === 'feedbacks' && (
                data.feedbacks.length === 0 ? (
                  <p className="text-muted-foreground text-xs text-center py-12">No recent feedback submitted.</p>
                ) : (
                  data.feedbacks.map(feedback => (
                    <div key={feedback.id} className="p-3.5 bg-surface-elevated/70 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-orange-brand" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{feedback.category}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{new Date(feedback.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{feedback.message}</p>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
