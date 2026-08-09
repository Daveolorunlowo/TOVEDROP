'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Send, ThumbsUp, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { cn } from '@/lib/utils'

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export default function RatePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/trips/${tripId}`)
      .then(res => res.json())
      .then(data => {
        if (data.trip) {
          if (data.trip.status !== 'COMPLETED' || data.trip.review) {
            router.push('/dashboard')
          } else {
            setTrip(data.trip)
          }
        } else {
          setError('Trip not found')
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Error loading trip')
        setLoading(false)
      })
  }, [tripId, router])

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating before submitting.')
      return
    }
    setError('')
    
    // Optimistic Update
    setSubmitted(true)
    
    try {
      const res = await fetch(`/api/trips/${tripId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, note })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Error submitting rating')
      }
    } catch (err: any) {
      // Rollback on failure
      setSubmitted(false)
      setError(err.message || 'Error submitting rating. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{error || 'Trip not found'}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ThumbsUp className="w-9 h-9 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-secondary mb-2">
              Thanks for your feedback!
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your rating helps maintain quality and trust on TOVEDROP.
              Drivers with consistently high ratings are featured more prominently.
            </p>
            <div className="flex gap-2 justify-center mb-3">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm font-semibold text-secondary mb-6">
              You rated {trip.driver?.name || 'your driver'} {rating} star{rating !== 1 ? 's' : ''} — {LABELS[rating]}
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-semibold w-full">
              <a href="/dashboard">Back to My Trips</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
              Rate Your Driver
            </p>
            <h1 className="text-2xl font-extrabold text-text-primary">How was your trip?</h1>
          </div>

          <div className="bg-surface-card border border-border-default rounded-2xl p-8">

            {/* Driver info */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
              <div className="relative shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="text-sm font-bold" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>
                    {trip.driver?.name ? trip.driver.name.substring(0, 2).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-status-success border-2 border-surface-card">
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <div>
                <p className="font-bold text-text-primary text-lg">{trip.driver?.name || 'Unknown Driver'}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mt-0.5">Trip {trip.id.substring(0, 8)}</p>
              </div>
            </div>

            {/* Star selector */}
            <div className="text-center mb-6 bg-surface-elevated border border-border-default rounded-xl p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-4">Tap to rate</p>
              <div
                className="flex items-center justify-center gap-3"
                role="radiogroup"
                aria-label="Star rating"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star !== 1 ? 's' : ''} — ${LABELS[star]}`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => { setRating(star); setError('') }}
                    className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-colors',
                        (hovered || rating) >= star
                          ? 'fill-orange-brand text-orange-brand'
                          : 'text-text-muted/30'
                      )}
                    />
                  </button>
                ))}
              </div>
              {(hovered > 0 || rating > 0) && (
                <p className="mt-3 text-sm font-semibold text-secondary transition-all">
                  {LABELS[hovered || rating]}
                </p>
              )}
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>

            {/* Note */}
            <div className="mb-6">
              <label htmlFor="note" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-2">
                Leave a note <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How was the ride? Was the driver on time, polite, and professional?"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{note.length}/300</p>
            </div>

            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full bg-purple-brand hover:bg-purple-brand/90 text-white font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Rating
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Ratings are visible to other riders but anonymous to the driver.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
