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

 if (!pusherClient) return;
 const channel = pusherClient.subscribe(`trip-${tripId}`)
 channel.bind('new-message', (newMessage: Message) => {
 setMessages((prev) => {
 // Prevent duplicates
 if (prev.some(m => m.id === newMessage.id)) return prev
 return [...prev, newMessage]
 })
 })

 // Hide orbital nav while chat is open
 const style = document.createElement('style')
 style.innerHTML = '.orbital-nav-container { display: none !important; }'
 document.head.appendChild(style)

 return () => {
 mounted = false
 if (document.head.contains(style)) {
 document.head.removeChild(style)
 }
 if (pusherClient) pusherClient.unsubscribe(`trip-${tripId}`)
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
 const text = await res.text(); throw new Error(`Failed to send: ${res.status} ${text}`)
 }
 } catch (err: any) {
 console.error(err)
 // If it fails, put the text back so they can try again
 setInputText(messageText)
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
        {/* Ambient Glow Background - Adaptive */}
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
                  Online &middot; Secured
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-muted/50 hover:bg-muted transition-all text-muted-foreground hover:text-foreground active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 relative z-10 bg-background/40" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-brand" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in zoom-in-95 duration-700 delay-150">
              <div className="w-20 h-20 mb-5 rounded-full bg-orange-brand/10 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.15)] ring-1 ring-orange-brand/20">
                <Send className="w-8 h-8 text-orange-brand ml-1" />
              </div>
              <p className="text-lg font-bold text-foreground mb-2">Start the conversation</p>
              <p className="text-sm text-muted-foreground leading-relaxed">Say hi to coordinate your pickup with <span className="font-semibold text-foreground">{otherPartyName.split(' ')[0]}</span>. Your chat is encrypted and secured.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 fade-in duration-400 ease-out`} style={{ animationFillMode: 'both', animationDelay: `${Math.min(idx * 50, 400)}ms` }}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm relative ${
                      isMe 
                        ? 'bg-gradient-to-br from-orange-brand to-orange-dark text-white rounded-br-sm shadow-orange-brand/20' 
                        : 'bg-card border border-border text-foreground rounded-bl-sm shadow-black/5'
                    }`}
                  >
                    <p className="text-[15px] font-medium break-words leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-white/80' : 'text-muted-foreground/70'}`}>
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
        <div className="p-4 sm:p-5 bg-card border-t border-border relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSend} className="relative flex items-center group">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="w-full bg-muted/50 border border-border/50 hover:border-border rounded-full pl-6 pr-14 py-4 text-[15px] text-foreground focus:outline-none focus:border-orange-brand/50 focus:bg-background focus:ring-4 focus:ring-orange-brand/10 transition-all placeholder:text-muted-foreground/70"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || sending}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-orange-brand text-white disabled:opacity-40 disabled:scale-95 hover:bg-orange-dark hover:shadow-lg hover:shadow-orange-brand/30 active:scale-90 transition-all duration-200"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
