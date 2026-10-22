"use client"

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Lock, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Invalid Reset Link</h2>
        <p className="text-xs text-white/60 mb-6">
          This password reset link is missing a valid token or has expired.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--orange-brand)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to reset password. Link may have expired.")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth')
      }, 2500)
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Password Updated! 🎉</h2>
        <p className="text-xs text-white/60 mb-6">
          Your password has been reset successfully. Redirecting you to sign in...
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[var(--orange-brand)] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all"
        >
          Continue to Sign In
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
          New Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[var(--orange-brand)] focus:ring-1 focus:ring-[var(--orange-brand)] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[var(--orange-brand)] focus:ring-1 focus:ring-[var(--orange-brand)] transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[var(--orange-brand)] text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating password...</span>
          </>
        ) : (
          <span>Save New Password</span>
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/auth"
          className="text-[11px] font-medium text-white/50 hover:text-white transition-colors"
        >
          Remember your password? Sign in
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--orange-brand)] flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-orange-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Choose a strong password for your TOVEDROP account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <Suspense fallback={<div className="text-center py-8 text-xs text-white/50">Loading reset form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
