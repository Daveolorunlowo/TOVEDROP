'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ShieldAlert, DownloadCloud, Trash2, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyRequestPage() {
  const [form, setForm] = useState({ email: '', type: 'DOWNLOAD_DATA', details: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/portal/privacy-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        alert('Failed to submit request. Please try again.')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep text-foreground">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-xl mx-auto px-6">
          <Link href="/privacy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Privacy Policy
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Data Subject Request</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Exercise your data rights. You can request an export of all personal data we hold about you, or request a complete account and data deletion in accordance with NDPR guidelines.
            </p>
          </div>

          {success ? (
            <div className="glass-card p-8 rounded-2xl text-center border border-green-500/20">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Request Received</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We have received your {form.type === 'DOWNLOAD_DATA' ? 'Data Export' : 'Data Deletion'} request for {form.email}. 
                Our compliance team will process this and email you within 30 days.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-sm font-semibold text-orange-brand hover:underline"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 rounded-2xl space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-[#111] border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-orange-brand transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Request Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`cursor-pointer flex flex-col p-4 rounded-xl border transition-colors ${form.type === 'DOWNLOAD_DATA' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#111] border-border text-muted-foreground hover:border-white/20'}`}>
                    <input type="radio" name="type" value="DOWNLOAD_DATA" checked={form.type === 'DOWNLOAD_DATA'} onChange={() => setForm({...form, type: 'DOWNLOAD_DATA'})} className="sr-only" />
                    <DownloadCloud className={`w-5 h-5 mb-2 ${form.type === 'DOWNLOAD_DATA' ? 'text-blue-400' : 'text-[#555]'}`} />
                    <span className="font-semibold text-sm">Export Data</span>
                    <span className="text-[10px] mt-1 opacity-80">Get a copy of your info</span>
                  </label>

                  <label className={`cursor-pointer flex flex-col p-4 rounded-xl border transition-colors ${form.type === 'DELETE_ACCOUNT' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#111] border-border text-muted-foreground hover:border-white/20'}`}>
                    <input type="radio" name="type" value="DELETE_ACCOUNT" checked={form.type === 'DELETE_ACCOUNT'} onChange={() => setForm({...form, type: 'DELETE_ACCOUNT'})} className="sr-only" />
                    <Trash2 className={`w-5 h-5 mb-2 ${form.type === 'DELETE_ACCOUNT' ? 'text-red-400' : 'text-[#555]'}`} />
                    <span className="font-semibold text-sm">Delete Account</span>
                    <span className="text-[10px] mt-1 opacity-80">Permanent erasure</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={form.details}
                  onChange={e => setForm({...form, details: e.target.value})}
                  className="w-full bg-[#111] border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-orange-brand transition-colors h-24 resize-none"
                  placeholder="Any specific data you're looking for?"
                />
              </div>

              {form.type === 'DELETE_ACCOUNT' && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong>Warning:</strong> Account deletion is permanent. Once completed, your profile, ride history, and drops balance cannot be recovered.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.email}
                className="w-full py-4 rounded-xl font-bold text-sm bg-orange-brand text-foreground hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Formal Request
              </button>
            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
