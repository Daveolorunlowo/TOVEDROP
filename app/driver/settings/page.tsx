'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { subscribeToPushNotifications } from '@/lib/push-client'

export default function DriverSettingsPage() {
  const router = useRouter()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if browser has push permissions already
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true)
    }
    setLoading(false)
  }, [])

  const handleTogglePush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    if (checked) {
      setMessage('Requesting permission...')
      const success = await subscribeToPushNotifications()
      if (success) {
        setPushEnabled(true)
        setMessage('Push notifications enabled!')
      } else {
        setPushEnabled(false)
        setMessage('Failed to enable push notifications. Check browser permissions.')
      }
    } else {
      // In a full implementation, you would call an API to delete the subscription.
      // For now, we just flip the UI toggle.
      setPushEnabled(false)
      setMessage('Push notifications disabled locally.')
    }
    setTimeout(() => setMessage(''), 4000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center mb-8">
          <Link href="/driver" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-10 bg-[#1e1e1e] rounded-md w-full"></div>
            <div className="h-10 bg-[#1e1e1e] rounded-md w-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Device Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive important trip alerts directly on your device</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={pushEnabled}
                      onChange={handleTogglePush}
                    />
                    <div className="w-9 h-5 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            {message && <p className="text-sm font-medium text-foreground">{message}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
