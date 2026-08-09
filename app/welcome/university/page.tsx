"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UniversityOnboarding() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [university, setUniversity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!university || university.trim().length < 2) {
      setError('Please enter a valid university name.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/university', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university: university.trim() })
      })

      if (res.ok) {
        // Update NextAuth session so middleware knows it's set
        await update({ university: university.trim() })
        router.push('/welcome')
      } else {
        const data = await res.json()
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-secondary mb-2" style={{ letterSpacing: '-0.02em' }}>
            One last thing...
          </h1>
          <p className="text-muted-foreground text-sm">
            What university do you attend? We need this to connect you with drivers in your area.
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="university">University Name</Label>
              <Input
                id="university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. Bowen University"
                className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-white font-semibold mt-4"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))' }}
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
