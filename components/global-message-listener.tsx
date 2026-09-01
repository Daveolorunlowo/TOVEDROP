"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { pusherClient } from "@/lib/pusher-client"
import { MessageSquare, X } from "lucide-react"

export function GlobalMessageListener() {
  const { data: session } = useSession()
  const [toast, setToast] = useState<{ senderName: string; content: string; tripId: string } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const channelName = `user-trips-${session.user.id}`
    if (!pusherClient) return;
    const channel = pusherClient.subscribe(`user-${session.user.id}`)
    
    channel.bind('incoming-message', (data: any) => {
      // Show toast
      setToast({
        senderName: data.senderName || 'User',
        content: data.content,
        tripId: data.tripId
      })

      // Auto dismiss after 5s
      setTimeout(() => setToast(null), 5000)
    })

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [session?.user?.id])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-[150] w-full max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div 
        className="relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
        style={{ 
          background: 'rgba(23, 23, 23, 0.85)', 
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
        }}
      >

        
        <div className="flex items-start gap-4 relative z-10">
          <div 
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'rgba(217, 119, 6, 0.15)' }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: 'var(--orange-brand)' }} />
          </div>
          
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {toast.senderName}
              </p>
              <button 
                onClick={() => setToast(null)}
                className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#aaa' }}>
              {toast.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
