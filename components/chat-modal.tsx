"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Loader2 } from "lucide-react"
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

export function ChatModal({ tripId, currentUserId, otherPartyName, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch history and subscribe
  useEffect(() => {
    let mounted = true

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/trips/${tripId}/messages`)
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setMessages(data.messages || [])
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("Failed to load messages", err)
        if (mounted) setLoading(false)
      }
    }

    fetchHistory()

    const channel = pusherClient.subscribe(`trip-${tripId}`)
    channel.bind('new-message', (newMessage: Message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
    })

    return () => {
      mounted = false
      pusherClient.unsubscribe(`trip-${tripId}`)
    }
  }, [tripId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sending) return

    const messageText = inputText.trim()
    setInputText("")
    setSending(true)

    try {
      const res = await fetch(`/api/trips/${tripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      })
      if (!res.ok) {
        throw new Error("Failed to send")
      }
    } catch (err) {
      console.error(err)
      // If it fails, put the text back so they can try again
      setInputText(messageText)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md h-[80vh] sm:h-[600px] bg-surface-elevated flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-5"
        style={{ border: '1px solid #222' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-surface-card">
          <div>
            <h3 className="font-bold text-text-primary" style={{ letterSpacing: '-0.01em' }}>
              Chat with {otherPartyName.split(' ')[0]}
            </h3>
            <p className="text-[10px] text-status-success font-semibold uppercase tracking-wider">
              Secure Connection
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-base">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <p className="text-sm font-medium text-text-primary mb-1">No messages yet</p>
              <p className="text-xs text-text-muted">Say hi to coordinate your pickup!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe 
                        ? 'bg-[var(--orange-brand)] text-black rounded-tr-sm' 
                        : 'bg-surface-card border border-border-default text-text-primary rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm font-medium break-words leading-relaxed">{msg.content}</p>
                    <p className={`text-[9px] font-semibold uppercase tracking-wider mt-1.5 ${isMe ? 'text-black/60' : 'text-text-muted'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border-default bg-surface-card">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 bg-surface-base border border-border-default rounded-full px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-[var(--orange-brand)] transition-colors placeholder:text-text-muted"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--orange-brand)] text-black shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
