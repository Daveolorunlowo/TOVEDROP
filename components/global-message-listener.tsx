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
    if (!pusherClient) return

    const channelName = `user-trips-${session.user.id}`
    const fallbackChannelName = `user-${session.user.id}`
    
    const handleIncoming = (data: any) => {
      // Play soft notification sound
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(659.25, ctx.currentTime)
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
          gain.gain.setValueAtTime(0.12, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.35)
        }
      } catch (e) {}

      // Show toast
      setToast({
        senderName: data.senderName || 'User',
        content: data.content,
        tripId: data.tripId
      })

      // Auto dismiss after 6s
      setTimeout(() => setToast(null), 6000)
    }

    const channel = pusherClient.subscribe(channelName)
    const fallbackChannel = pusherClient.subscribe(fallbackChannelName)

    channel.bind('incoming-message', handleIncoming)
    fallbackChannel.bind('incoming-message', handleIncoming)

    return () => {
      if (pusherClient) {
        channel.unbind('incoming-message', handleIncoming)
        fallbackChannel.unbind('incoming-message', handleIncoming)
        pusherClient.unsubscribe(channelName)
        pusherClient.unsubscribe(fallbackChannelName)
      }
    }
  }, [session?.user?.id])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-[150] w-full max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div 
        className="relative overflow-hidden rounded-xl p-4 shadow-2xl backdrop-blur-xl"
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
                className="shrink-0 p-1 rounded-full hover:bg-foreground/5 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {toast.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
