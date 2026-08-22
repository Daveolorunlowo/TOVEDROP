'use client'

import { useState, useEffect } from 'react'
import { Bell, Pin, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PaginationControls } from '@/components/shared/PaginationControls'

function UpdateBadge({ category }: { category: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    NEW_FEATURE:  { label: 'New Feature',  color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    IMPROVEMENT:  { label: 'Improvement',  color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.1)' },
    BUG_FIX:      { label: 'Bug Fix',      color: 'var(--muted-foreground)', bg: 'var(--border)' },
    ANNOUNCEMENT: { label: 'Announcement', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    MAINTENANCE:  { label: 'Maintenance',  color: 'var(--muted-foreground)', bg: 'var(--border)' },
  }
  const s = map[category] || { label: category.replace('_', ' '), color: 'var(--muted-foreground)', bg: 'var(--border)' }
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex items-center shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function UpdateAccordion({ update, index }: { update: any, index: number }) {
  // Pinned items or short items open by default
  const [isOpen, setIsOpen] = useState(update.isPinned || update.body.length < 100)

  return (
    <div 
      className="bg-background rounded-xl border border-border hover:border-border transition-colors animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div 
        className="p-5 cursor-pointer flex flex-col gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-start justify-between gap-4">
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

        <div className="flex items-start justify-between gap-4 mt-2">
          <h2 className="text-[17px] font-bold text-foreground leading-tight">
            {update.title}
          </h2>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-in fade-in duration-200">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pt-2 border-t border-border/50">
            {update.body}
          </div>
        </div>
      )}
    </div>
  )
}

export function UpdatesClient({
  updates,
  page,
  totalPages,
  totalItems,
  itemsPerPage
}: {
  updates: any[]
  page: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}) {
  
  useEffect(() => {
    const updateIds = updates.map(u => u.id)
    if (updateIds.length > 0) {
      fetch('/api/updates/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateIds })
      }).catch(console.error)
    }
  }, [updates])

  return (
    <div id="paginated-container" className="space-y-4 scroll-mt-24">
      {updates.length === 0 ? (
        <div className="bg-background p-8 rounded-xl border border-border text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-[#555]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No updates yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for news and features.</p>
        </div>
      ) : (
        updates.map((update, i) => (
          <UpdateAccordion key={update.id} update={update} index={i} />
        ))
      )}

      {totalItems > 0 && (
        <div className="pt-4">
          <PaginationControls 
            currentPage={page} 
            totalPages={totalPages} 
            totalItems={totalItems} 
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  )
}
