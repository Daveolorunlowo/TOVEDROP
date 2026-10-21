'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function AlertSection({ title, alerts, color }: { title: string, alerts: any[], color: string }) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  if (alerts.length === 0) return null

  const colorStyles: Record<string, { card: string; title: string; score: string }> = {
    red: {
      card: 'bg-red-500/5 border-red-500/20 hover:border-red-500/40',
      title: 'text-red-600 dark:text-red-400',
      score: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
    orange: {
      card: 'bg-orange-brand/5 border-orange-brand/20 hover:border-orange-brand/40',
      title: 'text-orange-brand',
      score: 'bg-orange-brand/10 text-orange-brand border-orange-brand/20',
    },
    yellow: {
      card: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
      title: 'text-amber-600 dark:text-amber-400',
      score: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
  }

  const s = colorStyles[color] || colorStyles.yellow

  const handleAction = async (alertId: string, action: string) => {
    setProcessingId(alertId)
    try {
      const res = await fetch('/api/admin/anomalies/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Action failed')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className={`font-bold text-sm uppercase tracking-wider ${s.title}`}>{title}</h3>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-5 rounded-2xl border transition-all ${s.card} ${
              alert.status !== 'PENDING' ? 'opacity-50 grayscale' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2 gap-4">
              <h4 className="font-bold text-base text-foreground">{alert.title}</h4>
              <div className="flex items-center gap-2 shrink-0">
                {alert.status !== 'PENDING' && (
                  <span className="font-mono bg-surface-elevated px-2 py-0.5 rounded text-[10px] font-bold uppercase text-muted-foreground border border-border">
                    {alert.status}
                  </span>
                )}
                <span className={`font-mono px-2 py-0.5 rounded text-xs font-black border tabular-nums ${s.score}`}>
                  Score: {alert.riskScore}/100
                </span>
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{alert.category}</p>
            <p className="text-xs text-foreground/80 mb-4 leading-relaxed">{alert.details}</p>

            {alert.affectedUsers && JSON.parse(alert.affectedUsers).length > 0 && (
              <div className="mb-3 text-xs bg-surface-elevated/70 p-2.5 rounded-xl text-foreground font-mono break-all border border-border">
                <strong className="text-muted-foreground">Affected IDs: </strong> {JSON.parse(alert.affectedUsers).join(', ')}
              </div>
            )}

            {alert.recommendedAction && (
              <div className="mb-4 text-xs bg-surface-elevated/70 p-2.5 rounded-xl font-medium border border-border text-foreground">
                <strong className="text-orange-brand">Action: </strong> {alert.recommendedAction}
              </div>
            )}

            {alert.status === 'PENDING' && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                {color === 'red' && (
                  <>
                    <button
                      onClick={() => handleAction(alert.id, 'suspend')}
                      disabled={processingId === alert.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {processingId === alert.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Investigate & Suspend
                    </button>
                    <button
                      onClick={() => handleAction(alert.id, 'dismiss')}
                      disabled={processingId === alert.id}
                      className="bg-card text-foreground px-4 py-2 rounded-xl font-bold text-xs border border-border hover:bg-surface-elevated transition disabled:opacity-50 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {color === 'orange' && (
                  <button
                    onClick={() => handleAction(alert.id, 'dismiss')}
                    disabled={processingId === alert.id}
                    className="bg-orange-brand text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-orange-dark transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {processingId === alert.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Mark Investigated
                  </button>
                )}
                {color === 'yellow' && (
                  <button
                    onClick={() => handleAction(alert.id, 'dismiss')}
                    disabled={processingId === alert.id}
                    className="bg-surface-elevated text-foreground px-4 py-2 rounded-xl font-bold text-xs border border-border hover:bg-muted transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {processingId === alert.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Dismiss Alert
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
