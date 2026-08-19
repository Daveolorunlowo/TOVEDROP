'use client'

import { useState, useEffect } from 'react'
import { Bell, Pin, Clock, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/shared/Skeleton'
import { formatDistanceToNow } from 'date-fns'

function UpdateBadge({ category }: { category: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    NEW_FEATURE:  { label: 'New Feature',  color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    IMPROVEMENT:  { label: 'Improvement',  color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.1)' },
    BUG_FIX:      { label: 'Bug Fix',      color: '#888', bg: '#1e1e1e' },
    ANNOUNCEMENT: { label: 'Announcement', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    MAINTENANCE:  { label: 'Maintenance',  color: '#888', bg: '#1e1e1e' },
  }
  const s = map[category] || { label: category.replace('_', ' '), color: '#888', bg: '#1e1e1e' }
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex items-center shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch('/api/updates')
        if (res.ok) {
          const data = await res.json()
          setUpdates(data.updates || [])
          
          // Mark all fetched updates as read
          const updateIds = (data.updates || []).map((u: any) => u.id)
          if (updateIds.length > 0) {
            await fetch('/api/updates/mark-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updateIds })
            })
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUpdates()
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto pt-8 pb-32 px-4">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-orange-brand" />
          Updates & Announcements
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stay in the loop with what's new on TOVEDROP.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-[#111] p-5 rounded-xl border border-border">
              <Skeleton className="w-24 h-5 mb-3" />
              <Skeleton className="w-3/4 h-6 mb-3" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          ))
        ) : updates.length === 0 ? (
          <div className="bg-[#111] p-8 rounded-xl border border-border text-center flex flex-col items-center justify-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-[#555]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No updates yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for news and features.</p>
          </div>
        ) : (
          updates.map((update, i) => (
            <div 
              key={update.id} 
              className="bg-[#111] p-5 rounded-xl border border-border hover:border-border transition-colors animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <UpdateBadge category={update.category} />
                <div className="flex items-center gap-2 shrink-0">
                  {update.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-orange-brand" />
                  )}
                  <span 
                    className="text-xs text-[#666] flex items-center gap-1.5"
                    title={new Date(update.publishedAt).toLocaleString()}
                  >
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(update.publishedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <h2 className="text-[17px] font-bold text-foreground mb-2 leading-tight">
                {update.title}
              </h2>
              
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {update.body}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
