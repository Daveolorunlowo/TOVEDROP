"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { LoadingButton } from '@/components/shared/LoadingButton'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'

import { Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) {
        setError('Invalid email or password.')
        setIsLoading(false)
      } else {
        if (intent === 'book') {
          router.push('/book')
          return
        }
        
        const session = await getSession()
        if (session?.user) {
          router.push(getRoleRedirectPath(session.user.role as string, (session.user as any).driverStatus as string | null))
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-deep px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-10">
        <Link href="/" className="text-white text-2xl font-bold flex items-center" aria-label="Go back">
          {'<'}
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-8">Welcome Back</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email or Phone Number</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="you@example.com" 
              required
              className={error ? 'border-destructive' : ''}
              autoComplete="email" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required
              className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-status-danger-bg border border-destructive/50 text-destructive text-sm p-3 rounded-md mt-2 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span> {error}
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-border-default bg-card accent-primary" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-primary text-[13px] hover:underline">
              Forgot password?
            </Link>
          </div>

          <LoadingButton
            type="submit"
            className="w-full mt-4"
            size="lg"
            isLoading={isLoading}
            loadingText="Logging in..."
          >
            Log In
          </LoadingButton>
        </form>

        <div className="mt-auto pt-8 text-center">
          <p className="text-[13px] text-text-secondary">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-deep" />}>
      <LoginContent />
    </Suspense>
  )
}

