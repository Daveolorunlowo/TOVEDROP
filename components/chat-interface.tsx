"use client"

import { useState, useEffect, useRef } from 'react'
import { Send, MapPin, CheckCircle2 } from 'lucide-react'
import { pusherClient } from '@/lib/pusher-client'
import { addToOfflineQueue } from '@/lib/offline-queue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Message = {
  id: string
  content: string
  senderId: string
  createdAt: Date
  sender: {
    id: string
    name: string | null
  }
  status?: 'sending' | 'failed' | 'sent'
}

export function ChatInterface({ 
  tripId, 
  currentUserId,
  initialMessages,
  driverArrivedAt,
  isDriver
}: { 
  tripId: string, 
  currentUserId: string,
  initialMessages: Message[],
  driverArrivedAt: Date | null,
  isDriver: boolean
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [arrived, setArrived] = useState(!!driverArrivedAt)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe(`trip-${tripId}`)
    
    channel.bind('new-message', (data: Message) => {
      setMessages(prev => {
        // Remove optimistic message if it exists
        const filtered = prev.filter(m => m.id !== 'optimistic-' + data.content)
        return [...filtered, data]
      })
    })

    channel.bind('driver-arrived', () => {
      setArrived(true)
    })

    return () => {
      if (pusherClient) pusherClient.unsubscribe(`chat-${tripId}`)
    }
  }, [tripId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    const optimisticMsg: Message = {
      id: 'optimistic-' + newMessage,
      content: newMessage,
      senderId: currentUserId,
      createdAt: new Date(),
      sender: { id: currentUserId, name: 'You' },
      status: 'sending'
    }

    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')
    setLoading(true)

    try {
      if (!navigator.onLine) {
        addToOfflineQueue(`/api/trips/${tripId}/messages`, 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({ content: optimisticMsg.content }))
      } else {
        const res = await fetch(`/api/trips/${tripId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: optimisticMsg.content })
        })
        if (res.ok) {
          const savedMsg = await res.json()
          // Update status to sent, although Pusher should bring the real message
          setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'sent' } : m))
        }
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m))
    } finally {
      setLoading(false)
    }
  }

  const handleArrived = async () => {
    if (arrived) return
    try {
      await fetch(`/api/trips/${tripId}/arrive`, {
        method: 'POST'
      })
      setArrived(true)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-xl bg-surface-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-foreground">Trip Chat</h3>
          {arrived && (
            <span className="text-xs font-medium text-green-500 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Driver has arrived
            </span>
          )}
        </div>
        
        {isDriver && !arrived && (
          <Button 
            size="sm" 
            onClick={handleArrived}
            className="bg-green-600 hover:bg-green-700 text-foreground"
          >
            <MapPin className="w-4 h-4 mr-1.5" />
            I've Arrived
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-purple-brand text-foreground rounded-br-sm' 
                      : 'bg-secondary/10 text-foreground rounded-bl-sm'
                  } ${msg.status === 'sending' ? 'opacity-50' : ''} ${msg.status === 'failed' ? 'border border-red-500 bg-red-500/10 text-red-500' : ''}`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                {msg.status === 'sending' && <span className="text-[10px] text-muted-foreground mt-1">Sending...</span>}
                {msg.status === 'failed' && <span className="text-[10px] text-red-500 mt-1">Failed</span>}
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
        <Input 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={!newMessage.trim() || loading} size="icon" className="bg-purple-brand hover:bg-purple-brand/90 text-foreground shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
