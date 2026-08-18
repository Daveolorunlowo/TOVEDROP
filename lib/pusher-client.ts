import PusherClient from 'pusher-js'
import { useEffect, useState, useRef } from 'react'

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  }
)

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

  useEffect(() => {
    // 1. Bind to the event
    const channel = pusherClient.subscribe(channelName)
    channel.bind(eventName, onEvent)

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
      channel.unbind(eventName, onEvent)
      pusherClient.unsubscribe(channelName)
      pusherClient.connection.unbind('state_change', handleStateChange)
    }
  }, [channelName, eventName, onEvent])

  // 3. Trigger fallback polling when disconnected
  useEffect(() => {
    if (isDisconnected && fallbackPoll) {
      // Immediate poll
      fallbackPoll()
      // Then interval
      pollIntervalRef.current = setInterval(fallbackPoll, 5000)
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [isDisconnected, fallbackPoll])

  return { isDisconnected }
}
