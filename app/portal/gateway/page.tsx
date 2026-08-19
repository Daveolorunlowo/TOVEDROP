'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, ShieldAlert, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PasswordInput } from '@/components/shared/PasswordInput'

type Step = 'credentials' | 'code'

export default function PortalGatewayPage() {
  const router = useRouter()

  // Step 1 state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Step 2 state
  const [code, setCode] = useState('')
  const [step, setStep] = useState<Step>('credentials')

  // Shared state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/portal/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Invalid credentials')
        return
      }

      // Step 1 passed — move to code entry and start 60s resend cooldown
      setStep('code')
      startCooldown(60)
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/portal/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Invalid code')
        return
      }

      // Code verified — now establish the NextAuth session
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Session could not be established. Please start over.')
        setStep('credentials')
        return
      }

      router.push('/admin')
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/portal/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429 && data.waitSeconds) {
          startCooldown(data.waitSeconds)
          setError(data.message)
        } else {
          setError(data.message || 'Failed to resend code')
        }
        return
      }

      setCode('')
      startCooldown(60)
    } catch {
      setError('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-1">
          TOVEDROP
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Admin Access
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm border rounded-2xl p-8"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Warning notice */}
        <div
          className="flex items-start gap-2.5 rounded-lg p-3 mb-6"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: '#ef4444', opacity: 0.8 }}>
            This area is restricted to authorized administrators only. Unauthorized access attempts are logged.
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleStep1} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="admin@tovedrop.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Password
              </label>
              <PasswordInput
                id="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="••••••••"
                showIcon={false}
              />
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--purple-brand)', color: '#fff' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-5">
            <div className="text-center pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--text-muted)' }}>
                Verification Code
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                A 6-digit code was sent to{' '}
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{email}</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Check your terminal / dev console for the code.
              </p>
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                6-Digit Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg px-3 py-2.5 text-sm text-center font-mono tracking-[0.3em] outline-none transition-colors"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '1.25rem',
                  letterSpacing: '0.4em',
                }}
                placeholder="000000"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--purple-brand)', color: '#fff' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verifying...' : 'Verify & Access Panel'}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setCode('') }}
                className="text-[11px] opacity-40 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] transition-opacity',
                  resendCooldown > 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-60 hover:opacity-100'
                )}
                style={{ color: 'var(--text-muted)' }}
              >
                <RotateCcw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom trace */}
      <p className="mt-8 text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
        All access attempts are recorded
      </p>
    </div>
  )
}
