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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-brand" />
              Activity Monitor
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Viewing history for <span className="text-foreground font-medium">{user.name}</span> ({user.email})</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border px-4 gap-6 pt-2 bg-[#171717]">
          {(['trips', 'drops', 'feedbacks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
                activeTab === tab ? 'text-orange-brand' : 'text-[#666] hover:text-muted-foreground'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-brand rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#111]">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading activities...</span>
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-red-500 text-sm">Failed to load data.</div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'trips' && (
                data.trips.length === 0 ? (
                  <p className="text-[#555] text-sm text-center py-10">No recent trips found.</p>
                ) : (
                  data.trips.map(trip => (
                    <div key={trip.id} className="p-3 bg-[#171717] rounded-lg border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                          <Map className="w-4 h-4 text-orange-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {trip.riderId === user.id ? 'Requested Ride' : 'Drove for Rider'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                            {trip.pickupLocation} <span className="text-[#444] mx-1">→</span> {trip.dropoffLocation}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium px-2 py-0.5 rounded bg-card text-muted-foreground inline-block mb-1">
                          {trip.status}
                        </p>
                        <p className="text-[10px] text-[#555]">{new Date(trip.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'drops' && (
                data.drops.length === 0 ? (
                  <p className="text-[#555] text-sm text-center py-10">No recent drop transactions.</p>
                ) : (
                  data.drops.map(drop => (
                    <div key={drop.id} className="p-3 bg-[#171717] rounded-lg border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${drop.type === 'EARNED' || drop.type === 'PURCHASED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{drop.type}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{drop.description || 'No details provided'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${drop.type === 'EARNED' || drop.type === 'PURCHASED' ? 'text-green-500' : 'text-red-500'}`}>
                          {drop.type === 'EARNED' || drop.type === 'PURCHASED' ? '+' : '-'}{drop.amount} drops
                        </p>
                        <p className="text-[10px] text-[#555]">{new Date(drop.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'feedbacks' && (
                data.feedbacks.length === 0 ? (
                  <p className="text-[#555] text-sm text-center py-10">No recent feedback submitted.</p>
                ) : (
                  data.feedbacks.map(feedback => (
                    <div key={feedback.id} className="p-3 bg-[#171717] rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-orange-brand" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{feedback.category}</span>
                        <span className="text-[10px] text-[#555] ml-auto">{new Date(feedback.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground">{feedback.message}</p>
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
