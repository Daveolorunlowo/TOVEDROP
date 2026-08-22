'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function ClientAutoRefresher() {
  const router = useRouter()
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    // Increment timer every second
    const tickInterval = setInterval(() => {
      setSecondsAgo(s => s + 1)
    }, 1000)

    // Refresh data every 20 seconds
    const refreshInterval = setInterval(() => {
      router.refresh()
      setSecondsAgo(0) // Reset after triggering refresh
    }, 20000)

    return () => {
      clearInterval(tickInterval)
      clearInterval(refreshInterval)
    }
  }, [router])

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-surface-elevated px-2 py-1 rounded-full border border-border-subtle shadow-sm">
      <RefreshCw className={`w-3 h-3 ${secondsAgo === 0 ? 'animate-spin text-orange-brand' : ''}`} />
      <span>Updated {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}</span>
    </div>
  )
}
