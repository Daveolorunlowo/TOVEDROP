"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Loader2, CheckCircle2 } from "lucide-react"
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

 return () => {
 mounted = false
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
 <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
 <div 
 className="w-full sm:max-w-md h-[85vh] sm:h-[650px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-500 ease-out shadow-2xl relative"
 style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
 >
 {/* Ambient Glow Background */}
 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />

 {/* Header */}
 <div className="relative flex items-center justify-between px-6 py-5 border-b border-border bg-foreground/5 backdrop-blur-xl z-10">
 <div className="flex items-center gap-3">
 <div className="relative">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-foreground font-bold text-lg shadow-lg shadow-orange-500/20">
 {otherPartyName.charAt(0).toUpperCase()}
 </div>
 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#111] rounded-full animate-pulse" />
 </div>
 <div>
 <h3 className="font-bold text-foreground tracking-tight text-lg">
 {otherPartyName.split(' ')[0]}
 </h3>
 <p className="text-[11px] text-green-400 font-medium tracking-wide">
 Online ?' Secured
 </p>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="p-2.5 rounded-full bg-foreground/5 hover:bg-foreground/5 transition-all text-foreground/70 hover:text-foreground"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Message List */}
 <div className="flex-1 overflow-y-auto p-5 space-y-6 relative z-10" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }}>
 {loading ? (
 <div className="h-full flex items-center justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
 </div>
 ) : messages.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-700">
 <div className="w-16 h-16 mb-4 rounded-full bg-foreground/5 flex items-center justify-center border border-border shadow-[0_0_30px_rgba(249,115,22,0.1)]">
 <Send className="w-6 h-6 text-orange-500" />
 </div>
 <p className="text-base font-bold text-foreground mb-1">Start the conversation</p>
 <p className="text-sm text-foreground/50">Say hi to coordinate your pickup with {otherPartyName.split(' ')[0]}!</p>
 </div>
 ) : (
 messages.map((msg, idx) => {
 const isMe = msg.senderId === currentUserId
 return (
 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out`} style={{ animationFillMode: 'both', animationDelay: `${Math.min(idx * 50, 500)}ms` }}>
 <div 
 className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm ${
 isMe 
 ? 'bg-gradient-to-br from-orange-500 to-red-600 text-foreground rounded-tr-sm shadow-orange-500/20' 
 : 'bg-foreground/5 border border-border text-foreground rounded-tl-sm'
 }`}
 >
 <p className="text-[15px] font-medium break-words leading-relaxed">{msg.content}</p>
 <div className={`flex items-center gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
 <p className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-foreground/70' : 'text-foreground/40'}`}>
 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 {isMe && <CheckCircle2 className="w-3 h-3 text-foreground/70" />}
 </div>
 </div>
 </div>
 )
 })
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input Area */}
 <div className="p-4 sm:p-5 bg-background border-t border-border relative z-10">
 <form onSubmit={handleSend} className="relative flex items-center">
 <input 
 type="text" 
 value={inputText}
 onChange={(e) => setInputText(e.target.value)}
 placeholder="Type a message..." 
 className="w-full bg-foreground/5 border border-border rounded-full pl-6 pr-14 py-4 text-sm text-foreground focus:outline-none focus:border-orange-500 focus:bg-foreground/5 transition-all placeholder:text-foreground/40 shadow-inner"
 />
 <button 
 type="submit"
 disabled={!inputText.trim() || sending}
 className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] active:scale-95 transition-all"
 >
 {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
 </button>
 </form>
 </div>
 </div>
 </div>
 )
}
