"use client"
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Check, User, FileText, CalendarDays, Upload, ChevronRight, ChevronLeft, Shield, Zap } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { cn } from '@/lib/utils'
import { signIn } from 'next-auth/react'

const STEPS = [
  { number: 1, label: 'Personal Info', icon: User },
  { number: 2, label: 'Documents', icon: FileText },
  { number: 3, label: 'Availability', icon: CalendarDays },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const AREAS = ['Main Campus', 'Legon Area', 'East Legon', 'Airport Area', 'Osu / Ring Road', 'Tema', 'Adenta', 'Achimota']

export default function ApplyPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    password: '',
    bio: '',
    license: '',
    make: '',
    year: '',
    plate: '',
    notes: '',
  })
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!formData.fullname.trim()) errs.fullname = 'Full name is required.'
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.'
    if (!formData.email.includes('@')) errs.email = 'Valid email is required.'
    if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    return errs
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (!formData.license.trim()) errs.license = 'License number is required.'
    if (!formData.make.trim()) errs.make = 'Vehicle make/model is required.'
    if (!formData.plate.trim()) errs.plate = 'Plate number is required.'
    return errs
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    let errs: Record<string, string> = {}
    if (step === 1) errs = validateStep1()
    if (step === 2) errs = validateStep2()
    if (step === 3) {
      if (selectedDays.length === 0) errs.days = 'Please select at least one day.'
    }
    setErrors(errs)
    
    if (Object.keys(errs).length === 0) {
      if (step < 3) {
        setStep((s) => s + 1)
      } else {
        setProcessing(true)
        try {
          const res = await fetch('/api/driver/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.fullname,
              email: formData.email,
              password: formData.password,
              phone: formData.phone,
              area: selectedAreas.join(', '),
              bio: formData.bio,
              licenseNumber: formData.license,
              vehicleMake: formData.make,
              vehicleModel: formData.year,
              vehiclePlate: formData.plate,
              vehicleColor: "Unknown"
            })
          })
          const data = await res.json()
          if (res.ok) {
            await signIn('credentials', { 
              email: formData.email, 
              password: formData.password, 
              redirect: false 
            })
            setSubmitted(true)
            if (data.autoApproved) {
              setAutoApproved(true)
            }
          } else {
            alert(data.message || 'Failed to submit application')
          }
        } catch (err) {
          alert('An error occurred')
        } finally {
          setProcessing(false)
        }
      }
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-secondary mb-2">
              {autoApproved ? "You're approved! Welcome to TOVEDROP" : "Application Submitted!"}
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {autoApproved 
                ? "Your driver account is active. Log in with your email and password to start accepting rides immediately." 
                : "Thank you for applying to join our trusted driver community. Our team will review your documents within 2–3 business days and contact you via email with next steps."}
            </p>
            <a href={autoApproved ? "/driver" : "/"} className={buttonVariants({ className: "bg-primary hover:bg-primary/90 text-white font-semibold" })}>
              {autoApproved ? "Log in & go to Dashboard" : "Back to Home"}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              Become a Driver
            </span>
            <h1 className="text-3xl font-extrabold text-secondary text-balance">
              Join our trusted driver community
            </h1>
            <p className="mt-2 text-muted-foreground">
              Earn income on your own schedule. We&apos;ll get you vetted and ready in days.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-2">
              {STEPS.map((s, idx) => {
                const isDone = s.number < step
                const isActive = s.number === step
                return (
                  <div key={s.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full transition-all shrink-0',
                          isDone || isActive ? 'bg-orange-brand' : 'bg-surface-elevated border border-border-default'
                        )}
                      />
                      <span className={cn(
                        'mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] hidden sm:block whitespace-nowrap',
                        isActive ? 'text-text-primary' : isDone ? 'text-orange-brand' : 'text-text-muted'
                      )}>
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={cn(
                        'flex-1 h-[3px] mx-2 mb-4 sm:mb-5 rounded-full',
                        s.number < step ? 'bg-orange-brand' : 'bg-surface-elevated'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form card */}
          <div className="bg-surface-card border border-border-default rounded-2xl p-8 relative">
            
            <form onSubmit={handleNext} className="space-y-5" noValidate>

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-secondary mb-0.5">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">Tell us a bit about yourself.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Full Name</Label>
                    <Input id="fullname" name="fullname" value={formData.fullname} onChange={handleInputChange} placeholder="Emeka Nwosu" className={errors.fullname ? 'border-red-500' : ''} />
                    {errors.fullname && <p className="text-xs text-red-600">{errors.fullname}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Phone Number</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+233 24 000 0000" className={errors.phone ? 'border-red-500' : ''} />
                    {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Email Address</Label>
                    <Input id="email" name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="you@email.com" className={errors.email ? 'border-red-500' : ''} />
                    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Password</Label>
                    <Input id="password" name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="Min 8 characters" className={errors.password ? 'border-red-500' : ''} />
                    {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Short Bio <span className="font-normal normal-case tracking-normal">(optional)</span></Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell students a bit about yourself and your driving experience..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Documents */}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-secondary mb-0.5">Documents & Vehicle</h2>
                    <p className="text-sm text-muted-foreground">All documents are reviewed by our team and kept secure.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="license" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Driver&apos;s License Number</Label>
                    <Input id="license" name="license" value={formData.license} onChange={handleInputChange} placeholder="GHA-DL-00000000" className={errors.license ? 'border-red-500' : ''} />
                    {errors.license && <p className="text-xs text-red-600">{errors.license}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="make" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Vehicle Make & Model</Label>
                      <Input id="make" name="make" value={formData.make} onChange={handleInputChange} placeholder="Toyota Corolla" className={errors.make ? 'border-red-500' : ''} />
                      {errors.make && <p className="text-xs text-red-600">{errors.make}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="year" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Year</Label>
                      <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="2019" type="number" min={2000} max={2025} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plate" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">License Plate Number</Label>
                    <Input id="plate" name="plate" value={formData.plate} onChange={handleInputChange} placeholder="GR-1234-22" className={errors.plate ? 'border-red-500' : ''} />
                    {errors.plate && <p className="text-xs text-red-600">{errors.plate}</p>}
                  </div>

                  {/* Upload areas */}
                  {[
                    { label: "Driver's License (photo)", name: 'licenseFile' },
                    { label: 'Vehicle Insurance', name: 'insuranceFile' },
                    { label: 'Roadworthy Certificate', name: 'roadworthyFile' },
                  ].map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">{field.label}</Label>
                      <label
                        htmlFor={field.name}
                        className="flex flex-col items-center justify-center gap-2 border border-border-default bg-surface-elevated rounded-xl p-4 cursor-pointer hover:border-purple-brand/40 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-text-muted" />
                        <span className="text-sm font-medium text-text-primary">
                          Click to upload or drag &amp; drop
                        </span>
                        <span className="text-xs text-text-muted">PNG, JPG or PDF · max 5MB</span>
                        <input id={field.name} name={field.name} type="file" className="sr-only" accept="image/*,.pdf" />
                      </label>
                    </div>
                  ))}
                </>
              )}

              {/* Step 3: Availability */}
              {step === 3 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-secondary mb-0.5">Availability</h2>
                    <p className="text-sm text-muted-foreground">When can students book you for trips?</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Available Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setSelectedDays((d) =>
                              d.includes(day) ? d.filter((x) => x !== day) : [...d, day]
                            )
                          }
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                            selectedDays.includes(day)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-card text-foreground border-border hover:border-primary/40'
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                    {errors.days && <p className="text-xs text-red-600">{errors.days}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="startTime" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">From (time)</Label>
                      <Input id="startTime" name="startTime" type="time" defaultValue="06:00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endTime" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">To (time)</Label>
                      <Input id="endTime" name="endTime" type="time" defaultValue="20:00" />
                    </div>
                  </div>



                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">Additional Notes <span className="font-normal normal-case tracking-normal">(optional)</span></Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="e.g. I can only take airport runs on weekends"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Nav buttons */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    className="border-secondary text-secondary hover:bg-secondary hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  size="lg"
                >
                  {step < 3 ? (
                    <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                  ) : processing ? (
                    <>Submitting...</>
                  ) : (
                    <>Submit Application <Check className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Questions? Email us at{' '}
            <a href="mailto:drivers@tovedrop.com" className="text-primary hover:underline">
              drivers@tovedrop.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
