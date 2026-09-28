import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We will use a ref to store the latest fallbackPoll to avoid infinite re-renders
    new_hook = '''
  const [isDisconnected, setIsDisconnected] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fallbackRef = useRef(fallbackPoll)

  // Keep fallbackRef updated
  useEffect(() => {
    fallbackRef.current = fallbackPoll
  }, [fallbackPoll])

  useEffect(() => {
    if (!pusherClient) return

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
'''
    
    # Replace the hook body
    content = re.sub(r'const \[isDisconnected, setIsDisconnected\] = useState\(false\).*?}, \[isDisconnected, fallbackPoll\]\)', new_hook.strip(), content, flags=re.DOTALL)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('lib/pusher-client.ts')
