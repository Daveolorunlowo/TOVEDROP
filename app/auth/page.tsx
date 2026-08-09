"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'

function DropCoin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="url(#authdc)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
      <defs>
        <linearGradient id="authdc" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--orange-brand)" />
          <stop offset="100%" stopColor="var(--orange-brand)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const newErrors: Record<string, string> = {}
    if (tab === 'signup') {
      const name = (form.elements.namedItem('name') as HTMLInputElement)?.value
      if (!name || name.trim().length < 2) newErrors.name = 'Please enter your full name.'
    }
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
    if (!email?.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please use a valid email address.'
    }
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters.'
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      if (tab === 'signup') {
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: (form.elements.namedItem('name') as HTMLInputElement)?.value, email, password })
        }).then((res) => {
          if (res.ok) {
            signIn('credentials', { email, password, redirect: false }).then(() => {
              router.push('/welcome')
            })
          } else {
            res.json().then((data) => setErrors({ email: data.message || 'Registration failed' }))
          }
        })
      } else {
        signIn('credentials', { email, password, redirect: false }).then(async (res) => {
          if (res?.error) {
            setErrors({ email: 'Invalid email or password' })
          } else {
            const session = await getSession()
            if (session?.user) {
              router.push(getRoleRedirectPath(session.user.role as string, session.user.driverStatus as string | null))
            } else {
              router.push('/dashboard')
            }
          }
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-extrabold inline-block" style={{ letterSpacing: '-0.02em' }}>
              <span className="text-[#1A1A2E]">TOVE</span><span className="text-orange-brand">DROP</span>
            </Link>
            <p className="mt-2 text-muted-foreground text-sm">
              {tab === 'login' ? 'Welcome back to your campus ride platform' : 'Join the trusted student ride network'}
            </p>
            {tab === 'signup' && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-orange-brand/10 border border-orange-brand/25 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-orange-brand">
                <DropCoin size={13} />
                Get 3 free Drops on sign up
              </div>
            )}
          </div>

          <div className="bg-surface-card rounded-2xl border border-border-default p-8">
            <div className="flex rounded-xl bg-surface-elevated p-1 mb-7">
              {(['login', 'signup'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setErrors({}) }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    tab === t ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {tab === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" name="name" type="text" placeholder="Ada Okafor"
                      className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      autoComplete="name" />
                  </div>
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder="you@example.com"
                    className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    autoComplete="email" />
                </div>
                {tab === 'signup' && !errors.email && (
                  <p className="text-xs text-muted-foreground">We'll use this to send you ride updates.</p>
                )}
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'}
                    placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              {tab === 'login' && (
                <div className="text-right">
                  <Link href="#" className="text-xs text-orange-brand hover:underline font-medium">Forgot password?</Link>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full text-white font-semibold mt-1"
                style={{ background: 'linear-gradient(135deg, var(--purple-brand), var(--purple-light))' }}>
                {tab === 'login' ? 'Log In' : 'Create Account'}
              </Button>
            </form>



            {tab === 'signup' && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                By signing up you agree to our{' '}
                <Link href="#" className="text-orange-brand hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="#" className="text-orange-brand hover:underline">Privacy Policy</Link>.
              </p>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {tab === 'login' ? (
              <>Don&apos;t have an account?{' '}<button onClick={() => setTab('signup')} className="text-orange-brand font-semibold hover:underline">Sign up free</button></>
            ) : (
              <>Already have an account?{' '}<button onClick={() => setTab('login')} className="text-orange-brand font-semibold hover:underline">Log in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
