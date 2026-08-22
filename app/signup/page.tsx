"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { LoadingButton } from '@/components/shared/LoadingButton'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'strong' | null>(null)

  const checkPasswordStrength = (pwd: string) => {
    if (!pwd) {
      setPasswordStrength(null)
      return
    }
    if (pwd.length < 8) {
      setPasswordStrength('weak')
    } else if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) {
      setPasswordStrength('strong')
    } else {
      setPasswordStrength('fair')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    const form = e.target as HTMLFormElement
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const campus = (form.elements.namedItem('campus') as HTMLSelectElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const newErrors: Record<string, string> = {}
    
    if (!firstName) newErrors.firstName = 'Required'
    if (!lastName) newErrors.lastName = 'Required'
    if (!email.includes('@')) newErrors.email = 'Invalid email'
    if (!phone) newErrors.phone = 'Required'
    if (!campus) newErrors.campus = 'Please select a campus'
    if (password.length < 8) newErrors.password = 'Min. 8 characters required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName} ${lastName}`, email, password, phone, campus })
      })
      
      if (res.ok) {
        // Log in the user immediately
        const signInRes = await signIn('credentials', { email, password, redirect: false })
        if (!signInRes?.error) {
          // Send them to OTP Verify
          router.push(`/verify?phone=${encodeURIComponent(phone)}&intent=${intent || ''}`)
        } else {
          router.push('/login')
        }
      } else {
        const data = await res.json()
        setErrors({ general: data.message || 'Registration failed' })
        setIsLoading(false)
      }
    } catch (err) {
      setErrors({ general: 'An error occurred. Please try again.' })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-deep px-6 py-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-white text-2xl font-bold flex items-center" aria-label="Go back">
          {'<'}
        </Link>
        <span className="text-text-secondary text-sm font-medium">1/2</span>
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-text-secondary text-sm mb-8">Join the campus ride network</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                placeholder="Kwame" 
                className={errors.firstName ? 'border-destructive' : ''}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                placeholder="Asante" 
                className={errors.lastName ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">School Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="you@university.edu.gh" 
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex">
              <div className="flex items-center justify-center bg-card border border-border border-r-0 rounded-l-md px-3 text-white text-sm">
                +233
              </div>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                placeholder="24 123 4567" 
                className={`rounded-l-none ${errors.phone ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.phone && <span className="text-destructive text-xs">{errors.phone}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="campus">Campus</Label>
            <select 
              id="campus" 
              name="campus"
              className={`flex h-12 w-full rounded-md border border-border bg-card p-3 text-sm text-white transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary ${errors.campus ? 'border-destructive' : ''}`}
              defaultValue=""
            >
              <option value="" disabled>Select your campus</option>
              <option value="University of Ghana">University of Ghana</option>
              <option value="KNUST">KNUST</option>
              <option value="Ashesi University">Ashesi University</option>
              <option value="UCC">UCC</option>
            </select>
            {errors.campus && <span className="text-destructive text-xs">{errors.campus}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput 
              id="password" 
              name="password" 
              placeholder="Min. 8 characters"
              onChange={(e) => checkPasswordStrength(e.target.value)}
              className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.password && <span className="text-destructive text-xs">{errors.password}</span>}
            
            {/* Strength Indicator */}
            <div className="flex gap-1 mt-1">
              <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'weak' ? 'bg-destructive' : passwordStrength === 'fair' ? 'bg-[#eab308]' : passwordStrength === 'strong' ? 'bg-status-success' : 'bg-border'}`} />
              <div className={`h-1 flex-1 rounded-full ${(passwordStrength === 'fair' || passwordStrength === 'strong') ? (passwordStrength === 'fair' ? 'bg-[#eab308]' : 'bg-status-success') : 'bg-border'}`} />
              <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-status-success' : 'bg-border'}`} />
            </div>
            <div className="text-right text-[11px] text-text-secondary capitalize">
              {passwordStrength || 'Strength'}
            </div>
          </div>

          {errors.general && (
            <div className="bg-status-danger-bg border border-destructive/50 text-destructive text-sm p-3 rounded-md mt-2 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span> {errors.general}
            </div>
          )}

          <div className="flex items-start gap-3 mt-2">
            <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-border-default bg-card accent-primary" />
            <label htmlFor="terms" className="text-xs text-text-secondary leading-tight">
              I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <LoadingButton
            type="submit"
            className="w-full mt-4"
            size="lg"
            isLoading={isLoading}
            loadingText="Creating account..."
          >
            Create Account
          </LoadingButton>
        </form>

        <div className="mt-8 pt-4 pb-6 text-center">
          <p className="text-[13px] text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
