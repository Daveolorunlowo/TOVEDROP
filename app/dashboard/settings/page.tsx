'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RiderSettingsPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Fetch current user settings via a simple API call we'll add to get the current session user
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        // We'll need a dedicated endpoint to fetch the user profile, but for now we can fetch it via a generic user endpoint
        // Wait, session doesn't have phone number by default in next-auth.
        // Let's fetch from a new endpoint /api/user/profile
        fetch('/api/user/profile')
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setPhoneNumber(data.user.phoneNumber || '')
              setWhatsappEnabled(data.user.whatsappNotificationsEnabled ?? true)
            }
            setLoading(false)
          })
      })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          whatsappNotificationsEnabled: whatsappEnabled
        })
      })
      
      if (!res.ok) throw new Error('Failed to save settings')
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage('Error saving settings.')
    } finally {
      setSaving(false)
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
            <div className="h-10 bg-[#1e1e1e] rounded-md w-full"></div>
            <div className="h-10 bg-[#1e1e1e] rounded-md w-full"></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Phone Number (for WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Required to receive instant ride updates via WhatsApp.
                  </p>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-border mt-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">WhatsApp Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive important trip updates on WhatsApp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold bg-primary text-black transition-transform active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {message && <p className="text-sm text-green-500 font-medium">{message}</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
