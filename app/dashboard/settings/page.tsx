'use client'

import { useState, useEffect } from 'react'
import {
  Bell, MessageSquare, Loader2, CheckCircle2,
  Shield, User, ChevronRight, MapPin, Moon,
  Smartphone, Info, Star, AlertTriangle,
  HelpCircle, Lock, Eye, Trash2, Download,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { subscribeToPushNotifications } from '@/lib/push-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/sign-out-button'

// ─── Reusable sub-components ────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color = 'text-orange-brand' }: {
  icon: React.ElementType
  label: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-1 px-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  )
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {children}
    </div>
  )
}

function SettingsRow({
  icon: Icon,
  iconBg = 'bg-orange-brand/10',
  iconColor = 'text-orange-brand',
  label,
  description,
  right,
  onClick,
  danger = false,
  border = true,
}: {
  icon: React.ElementType
  iconBg?: string
  iconColor?: string
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  border?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 transition-colors text-left
        ${onClick ? 'hover:bg-muted/40 active:bg-muted cursor-pointer' : ''}
        ${border ? 'border-b border-border last:border-b-0' : ''}
      `}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {right && <div className="shrink-0 ml-2">{right}</div>}
    </Tag>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-brand transition-all" />
    </label>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function RiderSettingsPage() {
  const { data: session } = useSession()
  const user = session?.user

  // Notifications
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [pushMsg, setPushMsg] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Preferences
  const [locationSharing, setLocationSharing] = useState(true)
  const [rideReminders, setRideReminders] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Feedback
  const [feedbackType, setFeedbackType] = useState('ISSUE')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      const perm = Notification.permission
      if (perm === 'granted') setPushEnabled(true)
      if (perm === 'denied') setPermissionDenied(true)
    }
    setLoadingInit(false)
  }, [])

  const handleTogglePush = async (checked: boolean) => {
    if (checked) {
      if ('Notification' in window && Notification.permission === 'denied') {
        setPermissionDenied(true)
        setPushMsg('Notifications are blocked. Enable them in your browser settings.')
        import('@/lib/push-client').then(m => m.showNotificationDeniedAlert())
        setTimeout(() => setPushMsg(''), 6000)
        return
      }
      setPushMsg('Requesting permission...')
      const success = await subscribeToPushNotifications()
      if (success) {
        setPushEnabled(true)
        setPermissionDenied(false)
        setPushMsg('Push notifications enabled!')
      } else {
        setPushEnabled(false)
        if ('Notification' in window && Notification.permission === 'denied') {
          import('@/lib/push-client').then(m => m.showNotificationDeniedAlert())
          setPushMsg('Notifications are blocked by your browser.')
        } else {
          setPushMsg('Could not enable notifications. Please try again.')
        }
      }
    } else {
      setPushEnabled(false)
      setPushMsg('Push notifications disabled.')
    }
    setTimeout(() => setPushMsg(''), 5000)
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
        setShowFeedback(false)
        setTimeout(() => setFeedbackSuccess(false), 5000)
      } else {
        alert('Failed to submit feedback. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  if (loadingInit) {
    return (
      <div className="space-y-6 animate-pulse pb-20 mt-4 max-w-2xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-card rounded-2xl w-full border border-border" />
        ))}
      </div>
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="space-y-7 animate-in fade-in duration-300 max-w-2xl pb-24 mt-4">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preferences, notifications &amp; support</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      {/* ── Profile Card ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-orange-brand/10 via-card to-card border border-orange-brand/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-brand to-orange-dark flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base truncate">{user?.name ?? 'Rider'}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email ?? ''}</p>
          <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-brand/10 text-orange-brand border border-orange-brand/20">
            {(user as any)?.role ?? 'Rider'}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </div>

      {/* ── Notifications ─────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Bell} label="Notifications" />
        <SettingsCard>
          <SettingsRow
            icon={Smartphone}
            label="Push Notifications"
            description="Trip alerts, driver updates & important messages"
            right={<Toggle checked={pushEnabled} onChange={handleTogglePush} />}
          />
          <SettingsRow
            icon={MapPin}
            label="Ride Reminders"
            description="Get reminded before your scheduled trips"
            right={<Toggle checked={rideReminders} onChange={setRideReminders} />}
          />
        </SettingsCard>
        {pushMsg && (
          <p className={`text-xs px-2 font-medium ${pushMsg.includes('enabled') ? 'text-green-500' : permissionDenied ? 'text-destructive' : 'text-muted-foreground'}`}>
            {pushMsg}
          </p>
        )}
        {permissionDenied && !pushMsg && (
          <p className="text-xs text-destructive px-2">
            Notifications are blocked. Go to your browser or phone settings to allow them for this site.
          </p>
        )}
      </div>

      {/* ── Privacy & Data ────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Shield} label="Privacy & Data" color="text-blue-500" />
        <SettingsCard>
          <SettingsRow
            icon={MapPin}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            label="Location Sharing"
            description="Allow drivers to see your pickup location in real time"
            right={<Toggle checked={locationSharing} onChange={setLocationSharing} />}
          />
          <SettingsRow
            icon={Eye}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            label="Profile Visibility"
            description="Your name & photo are visible to matched drivers"
            right={<span className="text-xs text-muted-foreground font-medium">Drivers only</span>}
          />
          <SettingsRow
            icon={Lock}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            right={
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Coming soon
              </span>
            }
          />
          <SettingsRow
            icon={Download}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            label="Download My Data"
            description="Request a copy of all your trip data and activity"
            right={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
            onClick={() => alert('Data export coming soon!')}
          />
        </SettingsCard>
      </div>

      {/* ── Preferences ───────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={User} label="Preferences" color="text-purple-500" />
        <SettingsCard>
          <SettingsRow
            icon={Moon}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-500"
            label="Appearance"
            description="Switch between light and dark mode"
            right={<ThemeToggle />}
          />
          <SettingsRow
            icon={Bell}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-500"
            label="Marketing Emails"
            description="Promotions, news and product updates from Tovedrop"
            right={<Toggle checked={marketingEmails} onChange={setMarketingEmails} />}
          />
        </SettingsCard>
      </div>

      {/* ── Help & Feedback ───────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={HelpCircle} label="Help & Support" color="text-green-500" />
        <SettingsCard>
          <SettingsRow
            icon={Star}
            iconBg="bg-green-500/10"
            iconColor="text-green-500"
            label="Rate Tovedrop"
            description="Love using Tovedrop? Leave us a review"
            right={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
            onClick={() => alert('Redirecting to app store...')}
          />
          <SettingsRow
            icon={AlertTriangle}
            iconBg="bg-yellow-500/10"
            iconColor="text-yellow-500"
            label="Report a Problem"
            description="Something went wrong on a trip? Let us know"
            right={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
            onClick={() => { setFeedbackType('ISSUE'); setShowFeedback(true) }}
          />
          <SettingsRow
            icon={MessageSquare}
            iconBg="bg-green-500/10"
            iconColor="text-green-500"
            label="Send Feedback"
            description="Suggest a feature or share what you think"
            right={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
            onClick={() => { setFeedbackType('SUGGESTION'); setShowFeedback(true) }}
          />
          <SettingsRow
            icon={Info}
            iconBg="bg-muted"
            iconColor="text-muted-foreground"
            label="About Tovedrop"
            description="Version 1.0 · Terms · Privacy Policy"
            right={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
            onClick={() => alert('Tovedrop v1.0')}
            border={false}
          />
        </SettingsCard>
      </div>

      {/* ── Feedback Modal (inline) ────────────────────────── */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-6 duration-300 shadow-2xl">
            {feedbackSuccess ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">Thank you!</h3>
                <p className="text-sm text-muted-foreground">Your feedback helps make Tovedrop better for everyone.</p>
                <button
                  onClick={() => { setShowFeedback(false); setFeedbackSuccess(false) }}
                  className="mt-5 w-full py-3 rounded-xl bg-orange-brand text-white font-semibold text-sm hover:bg-orange-dark transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-foreground text-lg">
                    {feedbackType === 'ISSUE' ? 'Report a Problem' : 'Send Feedback'}
                  </h3>
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={submitFeedback} className="space-y-4">
                  <select
                    value={feedbackType}
                    onChange={e => setFeedbackType(e.target.value)}
                    className="w-full bg-background border border-border text-sm text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-orange-brand transition-colors cursor-pointer"
                  >
                    <option value="ISSUE">Report an Issue</option>
                    <option value="SUGGESTION">Suggest a Feature</option>
                    <option value="PRAISE">Share a Compliment</option>
                  </select>
                  <textarea
                    value={feedbackContent}
                    onChange={e => setFeedbackContent(e.target.value)}
                    placeholder={
                      feedbackType === 'ISSUE'
                        ? "Describe the issue you're facing..."
                        : feedbackType === 'SUGGESTION'
                        ? "What would you like to see in Tovedrop?"
                        : "Tell us what you love about Tovedrop!"
                    }
                    className="w-full bg-background border border-border text-sm text-foreground rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:border-orange-brand transition-colors resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={feedbackSubmitting || !feedbackContent.trim()}
                    className="w-full bg-orange-brand hover:bg-orange-dark text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Danger Zone ───────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={AlertTriangle} label="Account" color="text-destructive" />
        <SettingsCard>
          <div className="px-5 py-4">
            <SignOutButton
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-destructive border border-destructive/30 bg-transparent hover:bg-destructive/5 rounded-xl py-3 transition-colors"
            />
          </div>
          <SettingsRow
            icon={Trash2}
            iconBg="bg-destructive/10"
            iconColor="text-destructive"
            label="Delete Account"
            description="Permanently remove your account and all data"
            danger
            right={<ChevronRight className="w-4 h-4 text-destructive/50" />}
            onClick={() => alert('Please contact support to delete your account.')}
            border={false}
          />
        </SettingsCard>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-2">
        Tovedrop · v1.0 · &copy; {new Date().getFullYear()}
      </p>
    </div>
  )
}
