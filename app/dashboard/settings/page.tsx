'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { subscribeToPushNotifications } from '@/lib/push-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/sign-out-button'
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
 setMessage('✓✓ Push notifications enabled!')
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
 <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl pb-20 mt-4">
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
 <div className="flex items-center gap-4">
 <ThemeToggle />
 <SignOutButton
 variant="outline"
 className="text-foreground text-sm font-medium border border-border bg-transparent hover:bg-border rounded-lg px-4 py-2 whitespace-nowrap"
 />
 </div>
 </div>
 <p className="text-base text-muted-foreground">Manage your preferences and notifications.</p>
 </div>

 {loading ? (
 <div className="animate-pulse flex flex-col gap-6">
 <div className="h-16 bg-card rounded-xl w-full"></div>
 <div className="h-16 bg-card rounded-xl w-full"></div>
 </div>
 ) : (
 <div className="space-y-8">
 <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <Bell className="w-6 h-6 text-primary" />
 <h2 className="font-semibold text-xl">Notifications</h2>
 </div>
 
 <div className="space-y-6">
 <div className="flex items-center justify-between py-2 border-border">
 <div className="flex flex-col gap-1">
 <p className="text-base font-medium text-foreground">Device Push Notifications</p>
 <p className="text-sm text-muted-foreground pr-4">Receive important trip alerts directly on your device</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input 
 type="checkbox" 
 className="sr-only peer"
 checked={pushEnabled}
 onChange={handleTogglePush}
 />
 <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
 </label>
 </div>
 </div>
 </div>
 
 {message && (
 <p className={`text-base font-medium px-2 ${message.startsWith('✓') ? 'text-green-500' : permissionDenied ? 'text-red-500' : 'text-muted-foreground'}`}>
 {message}
 </p>
 )}
 {permissionDenied && !message && (
 <p className="text-sm text-red-500 px-2">
 Notifications are blocked in your browser. To enable, go to your browser or phone settings and allow notifications for this site.
 </p>
 )}

 <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <MessageSquare className="w-6 h-6 text-primary" />
 <h2 className="font-semibold text-xl">Help & Feedback</h2>
 </div>
 
 <div className="space-y-6">
 <p className="text-base text-muted-foreground mb-6">Have an issue with a trip, or an idea to make Tovedrop better? Let us know.</p>
 
 {feedbackSuccess ? (
 <div className="bg-card border border-border p-8 rounded-xl text-center">
 <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
 <h3 className="text-base font-semibold text-foreground mb-2">Feedback Received</h3>
 <p className="text-sm text-muted-foreground">Thank you for helping us improve!</p>
 </div>
 ) : (
 <form onSubmit={submitFeedback} className="space-y-5">
 <div>
 <select 
 value={feedbackType} 
 onChange={(e) => setFeedbackType(e.target.value)}
 className="w-full bg-background border border-border text-base text-foreground rounded-xl p-4 focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
 className="w-full bg-background border border-border text-base text-foreground rounded-xl p-4 min-h-[140px] focus:outline-none focus:border-primary transition-colors resize-none"
 required
 />
 </div>
 <button 
 type="submit" 
 disabled={feedbackSubmitting || !feedbackContent.trim()}
 className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl text-base transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
 >
 {feedbackSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Feedback'}
 </button>
 </form>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
