import PusherClient from 'pusher-js'
import { useEffect, useState, useRef } from 'react'

export const pusherClient = process.env.NEXT_PUBLIC_PUSHER_KEY
  ? new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      }
    )
  : null

/**
 * useResilientChannel
 * Binds to a Pusher channel, but if the connection drops or fails,
 * it triggers a fallback polling callback every 5 seconds.
 */
export function useResilientChannel(
  channelName: string, 
  eventName: string, 
  onEvent: (data: any) => void,
  fallbackPoll?: () => void
) {
  const [isDisconnected, setIsDisconnected] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const fallbackRef = useRef(fallbackPoll)
  const onEventRef = useRef(onEvent)

  // Keep refs updated without triggering re-binds
  useEffect(() => {
    fallbackRef.current = fallbackPoll
    onEventRef.current = onEvent
  }, [fallbackPoll, onEvent])

  useEffect(() => {
    if (!pusherClient) return

    // 1. Bind to the event
    const channel = pusherClient.subscribe(channelName)
    
    // Use an internal wrapper to always call the latest onEvent without re-binding
    const eventHandler = (data: any) => {
      if (onEventRef.current) onEventRef.current(data)
    }
    
    channel.bind(eventName, eventHandler)

    // 2. Monitor connection state
    const handleStateChange = (states: any) => {
      if (states.current === 'unavailable' || states.current === 'failed' || states.current === 'disconnected') {
        setIsDisconnected(true)
      } else if (states.current === 'connected') {
        setIsDisconnected(false)
      }
    }

    pusherClient.connection.bind('state_change', handleStateChange)

    return () => {
      channel.unbind(eventName, eventHandler)
      pusherClient.unsubscribe(channelName)
      pusherClient.connection.unbind('state_change', handleStateChange)
    }
  }, [channelName, eventName])

  // 3. Trigger fallback polling when disconnected
  useEffect(() => {
    if (isDisconnected && fallbackRef.current) {
      // Immediate poll
      fallbackRef.current()
      // Then interval
      pollIntervalRef.current = setInterval(() => {
        if (fallbackRef.current) fallbackRef.current()
      }, 5000)
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [isDisconnected])

  return { isDisconnected }
}
