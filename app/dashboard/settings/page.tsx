'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { subscribeToPushNotifications } from '@/lib/push-client'

export default function RiderSettingsPage() {
  const router = useRouter()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [feedbackType, setFeedbackType] = useState('ISSUE')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      const perm = Notification.permission
      if (perm === 'granted') setPushEnabled(true)
      if (perm === 'denied') setPermissionDenied(true)
    }
    setLoading(false)
  }, [])

  const handleTogglePush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked

    if (checked) {
      if ('Notification' in window && Notification.permission === 'denied') {
        setPermissionDenied(true)
        setMessage('Notifications are blocked. Please enable them in your browser/phone settings, then try again.')
        import('@/lib/push-client').then(m => m.showNotificationDeniedAlert())
        setTimeout(() => setMessage(''), 6000)
        return
      }

      setMessage('Requesting permission...')
      const success = await subscribeToPushNotifications()

      if (success) {
        setPushEnabled(true)
        setPermissionDenied(false)
        setMessage('✓ Push notifications enabled!')
      } else {
        setPushEnabled(false)
        // User dismissed or denied the dialog
        if ('Notification' in window && Notification.permission === 'denied') {
          import('@/lib/push-client').then(m => m.showNotificationDeniedAlert())
          setMessage('Notifications are blocked by your browser.')
        } else {
          setMessage('Could not enable notifications. Please try again.')
        }
      }
    } else {
      setPushEnabled(false)
      setMessage('Push notifications disabled.')
    }

    setTimeout(() => setMessage(''), 5000)
  }

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackContent.trim()) return
    
    setFeedbackSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, content: feedbackContent })
      })
      
      if (res.ok) {
        setFeedbackSuccess(true)
        setFeedbackContent('')
        setTimeout(() => setFeedbackSuccess(false), 5000)
      } else {
        alert('Failed to submit feedback. Please try again.')
      }
    } catch (e) {
      alert('Network error. Please try again.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-10 bg-card rounded-md w-full"></div>
            <div className="h-10 bg-card rounded-md w-full"></div>
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
            
            {message && (
              <p className={`text-sm font-medium ${message.startsWith('✓') ? 'text-green-400' : permissionDenied ? 'text-red-400' : 'text-muted-foreground'}`}>
                {message}
              </p>
            )}
            {permissionDenied && !message && (
              <p className="text-xs text-red-400">
                Notifications are blocked in your browser. To enable, go to your browser or phone settings and allow notifications for this site.
              </p>
            )}

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Help & Feedback</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Have an issue with a trip, or an idea to make Tovedrop better? Let us know.</p>
                
                {feedbackSuccess ? (
                  <div className="bg-card border border-border p-6 rounded-lg text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">Feedback Received</h3>
                    <p className="text-xs text-muted-foreground">Thank you for helping us improve!</p>
                  </div>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-4">
                    <div>
                      <select 
                        value={feedbackType} 
                        onChange={(e) => setFeedbackType(e.target.value)}
                        className="w-full bg-background border border-border text-sm text-foreground rounded-lg p-3 focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="ISSUE">Report an Issue</option>
                        <option value="SUGGESTION">Suggest a Feature</option>
                      </select>
                    </div>
                    <div>
                      <textarea 
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        placeholder={feedbackType === 'ISSUE' ? "Describe the issue you're facing..." : "What would you like to see in Tovedrop?"}
                        className="w-full bg-background border border-border text-sm text-foreground rounded-lg p-3 min-h-[120px] focus:outline-none focus:border-primary transition-colors resize-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={feedbackSubmitting || !feedbackContent.trim()}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg text-sm transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {feedbackSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Feedback'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
