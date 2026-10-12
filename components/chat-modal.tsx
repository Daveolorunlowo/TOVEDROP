"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Loader2, CheckCircle2, MessageSquare, Clock } from "lucide-react"
import { pusherClient } from "@/lib/pusher-client"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
}

interface ChatModalProps {
  tripId: string
  currentUserId: string
  otherPartyName: string
  onClose: () => void
}

// Gentle incoming message audio chime
function playIncomingChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.setValueAtTime(880.00, now + 0.08) // A5
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch (e) {}
}

export function ChatModal({ tripId, currentUserId, otherPartyName, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestMessageTimeRef = useRef<string | null>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch history, subscribe to Pusher & resilient background polling
  useEffect(() => {
    let mounted = true

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/trips/${tripId}/messages`)
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.messages)) {
            setMessages(data.messages)
            if (data.messages.length > 0) {
              latestMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt
            }
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("Failed to load messages", err)
        if (mounted) setLoading(false)
      }
    }

    fetchHistory()

    // 1. Instant WebSocket event listener (via Pusher)
    let channel: any = null
    if (pusherClient) {
      channel = pusherClient.subscribe(`trip-${tripId}`)
      channel.bind('new-message', (newMessage: Message) => {
        if (!mounted) return
        setMessages((prev) => {
          if (prev.some(m => m.id === newMessage.id)) return prev
          // If message is from other party, play gentle chime
          if (newMessage.senderId !== currentUserId) {
            playIncomingChime()
          }
          const withoutOptimistic = prev.filter(
            m => !(m.id.startsWith('optimistic-') && m.content === newMessage.content && m.senderId === newMessage.senderId)
          )
          return [...withoutOptimistic, newMessage]
        })
        latestMessageTimeRef.current = newMessage.createdAt
      })
    }

    // 2. Resilient fast-polling fallback (every 2.5 seconds)
    // Ensures messages arrive without delay even on poor connection, sleeping WebSockets, or missing Pusher keys
    const pollInterval = setInterval(async () => {
      if (!mounted) return
      try {
        const afterParam = latestMessageTimeRef.current ? `?after=${encodeURIComponent(latestMessageTimeRef.current)}` : ''
        const res = await fetch(`/api/trips/${tripId}/messages${afterParam}`)
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.messages) && data.messages.length > 0) {
            let hasIncomingFromOther = false
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id))
              const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id))
              if (newMsgs.length === 0) return prev

              newMsgs.forEach((m: Message) => {
                if (m.senderId !== currentUserId) hasIncomingFromOther = true
              })

              const withoutOptimistic = prev.filter(
                m => !m.id.startsWith('optimistic-')
              )
              return [...withoutOptimistic, ...newMsgs]
            })

            if (hasIncomingFromOther) {
              playIncomingChime()
            }
            latestMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt
          }
        }
      } catch (err) {
        // Silent poll error
      }
    }, 2500)

    // Hide orbital nav while chat is open
    const style = document.createElement('style')
    style.innerHTML = '.orbital-nav-container { display: none !important; }'
    document.head.appendChild(style)

    return () => {
      mounted = false
      clearInterval(pollInterval)
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
      if (channel && pusherClient) {
        channel.unbind('new-message')
        pusherClient.unsubscribe(`trip-${tripId}`)
      }
    }
  }, [tripId, currentUserId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sending) return

    const messageText = inputText.trim()
    setInputText("")
    setSending(true)

    // Optimistically add message so it appears instantly for the sender (0ms perceived latency)
    const optimisticId = "optimistic-" + String(Date.now())
    const optimisticMsg: Message = {
      id: optimisticId,
      content: messageText,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const res = await fetch("/api/trips/" + tripId + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      })
      if (!res.ok) {
        const text = await res.text()
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        setInputText(messageText)
        throw new Error("Failed to send message: " + text)
      }
      const data = await res.json()
      const savedMsg: Message = data.message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? savedMsg : m))
      )
      latestMessageTimeRef.current = savedMsg.createdAt
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-[4px] animate-in fade-in duration-300">
      <div 
        className="w-full sm:max-w-md h-[85vh] sm:h-[650px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-500 ease-out shadow-2xl relative bg-card border border-border"
      >
        {/* Ambient Glow Background */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-brand/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-border bg-card/90 backdrop-blur-xl z-10 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-brand to-orange-dark flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-brand/20 ring-2 ring-background">
                {otherPartyName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-foreground tracking-tight text-[17px]">
                {otherPartyName.split(' ')[0]}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                  Real-time Chat &middot; Secured
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-muted/50 hover:bg-muted transition-all text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10 bg-background/40" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-brand" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 mb-4 rounded-full bg-orange-brand/10 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-brand/20">
                <Send className="w-7 h-7 text-orange-brand ml-0.5" />
              </div>
              <p className="text-base font-bold text-foreground mb-1.5">Start the conversation</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Say hi to coordinate your pickup with <span className="font-semibold text-foreground">{otherPartyName.split(' ')[0]}</span>.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                      isMe 
                        ? 'bg-gradient-to-br from-orange-brand to-orange-dark text-white rounded-br-sm shadow-orange-brand/15' 
                        : 'bg-card border border-border text-foreground rounded-bl-sm shadow-black/5'
                    }`}
                  >
                    <p className="text-sm font-medium break-words leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${isMe ? 'text-white/80' : 'text-muted-foreground/70'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isMe && <CheckCircle2 className="w-3 h-3 text-white/90 ml-0.5" />}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="p-3.5 sm:p-4 bg-card border-t border-border relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSend} className="relative flex items-center group">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="w-full bg-muted/50 border border-border/60 hover:border-border rounded-full pl-5 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-orange-brand/50 focus:bg-background focus:ring-2 focus:ring-orange-brand/15 transition-all placeholder:text-muted-foreground/60"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || sending}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-orange-brand text-white disabled:opacity-40 disabled:scale-95 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
