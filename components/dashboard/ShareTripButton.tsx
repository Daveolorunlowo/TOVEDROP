'use client'

import { useState, useEffect } from 'react'
import { Share, X, Copy, Check } from 'lucide-react'

export function ShareTripButton({ shareToken }: { shareToken: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const shareUrl = `${origin}/trip/${shareToken}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-card"
        style={{ color: 'var(--orange-brand)', border: '1px solid var(--orange-brand)' }}
      >
        <Share className="w-3.5 h-3.5" />
        Share Trip
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>Share Trip</p>
              <button onClick={() => { setOpen(false); setCopied(false); }} className="p-1" style={{ color: 'var(--muted-foreground)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Send this link to a friend so they can see your verified driver details and track your trip status.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 px-3 py-2 rounded-md text-xs truncate" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                  {shareUrl}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 p-2 rounded-md transition-colors hover:brightness-110" 
                  style={{ background: 'var(--orange-brand)', color: 'var(--foreground)' }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`I'm on a TOVEDROP ride — here's my trip details: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-foreground transition-opacity hover:opacity-90"
                style={{ background: '#25D366' }}
              >
                Share via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
