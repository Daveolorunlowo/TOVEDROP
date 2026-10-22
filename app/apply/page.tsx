"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Check, User, Car, FileText, CalendarDays, Upload, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { cn } from '@/lib/utils'

const STEPS = [
  { number: 1, label: 'Personal', icon: User },
  { number: 2, label: 'Vehicle', icon: Car },
  { number: 3, label: 'Verification', icon: FileText },
  { number: 4, label: 'Availability', icon: CalendarDays },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ApplyPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)
  const [processing, setProcessing] = useState(false)

  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    password: '',
    license: '',
    make: '',
    color: '',
    plate: '',
  })

  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [idFile, setIdFile] = useState<File | null>(null)
  const [kycStatus, setKycStatus] = useState<string | null>(null)

  // Pre-fill user data if already logged in
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullname: session.user?.name || prev.fullname,
        email: session.user?.email || prev.email,
        phone: (session.user as any)?.phoneNumber || prev.phone,
      }))
    }
  }, [session])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.'
    
    // Only require name/email/password if guest
    if (!session?.user) {
      if (!formData.fullname.trim()) errs.fullname = 'Full name is required.'
      if (!formData.email.includes('@')) errs.email = 'Valid email is required.'
      if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    }
    return errs
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (!formData.make.trim()) errs.make = 'Vehicle make and model is required.'
    if (!formData.plate.trim()) errs.plate = 'License plate is required.'
    return errs
  }

  const validateStep3 = () => {
    const errs: Record<string, string> = {}
    if (!formData.license.trim()) errs.license = "Driver's license number is required."
    if (!idFile) errs.idFile = 'Please upload a photo of your ID or Driver License.'
    return errs
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    let errs: Record<string, string> = {}

    if (step === 1) errs = validateStep1()
    if (step === 2) errs = validateStep2()
    if (step === 3) errs = validateStep3()
    if (step === 4) {
      if (selectedDays.length === 0) errs.days = 'Select at least one day.'
    }

    setErrors(errs)

    if (Object.keys(errs).length === 0) {
      if (step < 4) {
        setStep(step + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      // Step 4 final submission
      setProcessing(true)
      try {
        const res = await fetch('/api/driver/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: session?.user?.name || formData.fullname,
            email: session?.user?.email || formData.email,
            password: formData.password || undefined,
            phone: formData.phone,
            area: 'Campus & Hostels',
            availability: selectedDays.join(', '),
            licenseNumber: formData.license,
            vehicleMake: formData.make,
            vehicleModel: '',
            vehicleColor: formData.color || 'Standard',
            vehiclePlate: formData.plate,
            isVerified: kycStatus === 'VERIFIED'
          })
        })

        const data = await res.json()
        if (res.ok) {
          if (!session?.user && formData.password) {
            await signIn('credentials', { 
              email: formData.email, 
              password: formData.password, 
              redirect: false 
            })
          }
          setSubmitted(true)
          if (data.autoApproved) {
            setAutoApproved(true)
          }
        } else {
          alert(data.message || 'Failed to submit application')
        }
      } catch (err) {
        alert('An error occurred during application submission')
      } finally {
        setProcessing(false)
      }
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
          <div className="max-w-md w-full text-center bg-surface-card border border-border-default rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground mb-2">
              {autoApproved ? "You're Approved! 🎉" : "Application Received!"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              {autoApproved 
                ? "Your driver account is active. You can now access your Driver Dashboard to start accepting rides." 
                : "Thank you for applying. Our admin team will review your credentials and activate your driver account shortly."}
            </p>
            <a 
              href={autoApproved ? "/driver" : "/dashboard"} 
              className={buttonVariants({ className: "w-full bg-orange-brand hover:bg-orange-dark text-white font-bold text-xs py-3 rounded-xl shadow-md" })}
            >
              {autoApproved ? "Go to Driver Dashboard" : "Return to Dashboard"}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">

          {/* Clean Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Join Our Driver Community
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Earn on your campus schedule. Safe, student-vetted rides.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between mb-8 px-2 max-w-sm mx-auto">
            {STEPS.map((s, idx) => {
              const isDone = s.number < step
              const isActive = s.number === step
              return (
                <div key={s.number} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm',
                        isDone && 'bg-emerald-500 text-white',
                        isActive && 'bg-orange-brand text-white ring-4 ring-orange-brand/20',
                        !isDone && !isActive && 'bg-surface-elevated text-muted-foreground border border-border-default'
                      )}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.number}
                    </div>
                    <span className="text-[10px] font-semibold mt-1 text-muted-foreground uppercase tracking-wider">
                      {s.label}
                    </span>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div 
                      className={cn(
                        'flex-1 h-[2px] mx-2 -mt-4 transition-colors',
                        s.number < step ? 'bg-orange-brand' : 'bg-border-default'
                      )} 
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Clean Form Card */}
          <div className="bg-surface-card border border-border-default rounded-2xl p-6 sm:p-8 shadow-xl">
            <form onSubmit={handleNext} className="space-y-4" noValidate>

              {/* ── STEP 1: Personal Info ── */}
              {step === 1 && (
                <>
                  <div className="border-b border-border-default/60 pb-3 mb-2">
                    <h2 className="text-sm font-bold text-foreground">Personal Information</h2>
                    <p className="text-xs text-muted-foreground">Contact details for ride notifications.</p>
                  </div>

                  {session?.user ? (
                    <div className="p-3 rounded-xl bg-surface-elevated border border-border-default flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">{session.user.name}</p>
                        <p className="text-[11px] text-muted-foreground">{session.user.email}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Verified Student
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="fullname" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                        <Input 
                          id="fullname" 
                          name="fullname" 
                          value={formData.fullname} 
                          onChange={handleInputChange} 
                          placeholder="e.g. Emeka Nwosu" 
                          className={errors.fullname ? 'border-red-500' : ''} 
                        />
                        {errors.fullname && <p className="text-[11px] text-red-500">{errors.fullname}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email"
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="you@email.com" 
                          className={errors.email ? 'border-red-500' : ''} 
                        />
                        {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Password</Label>
                        <PasswordInput 
                          id="password" 
                          name="password" 
                          value={formData.password} 
                          onChange={handleInputChange} 
                          placeholder="Min 8 characters" 
                          className={errors.password ? 'border-red-500' : ''} 
                          showIcon={false} 
                        />
                        {errors.password && <p className="text-[11px] text-red-500">{errors.password}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phone Number (WhatsApp Active)</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="+234 80 000 0000" 
                      className={errors.phone ? 'border-red-500' : ''} 
                    />
                    {errors.phone && <p className="text-[11px] text-red-500">{errors.phone}</p>}
                  </div>
                </>
              )}

              {/* ── STEP 2: Vehicle Info ── */}
              {step === 2 && (
                <>
                  <div className="border-b border-border-default/60 pb-3 mb-2">
                    <h2 className="text-sm font-bold text-foreground">Vehicle Details</h2>
                    <p className="text-xs text-muted-foreground">What vehicle will you use for campus rides?</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="make" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vehicle Make & Model</Label>
                    <Input 
                      id="make" 
                      name="make" 
                      value={formData.make} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Toyota Corolla / Keke / Camry" 
                      className={errors.make ? 'border-red-500' : ''} 
                    />
                    {errors.make && <p className="text-[11px] text-red-500">{errors.make}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="plate" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">License Plate</Label>
                      <Input 
                        id="plate" 
                        name="plate" 
                        value={formData.plate} 
                        onChange={handleInputChange} 
                        placeholder="e.g. LAG-123-AB" 
                        className={errors.plate ? 'border-red-500' : ''} 
                      />
                      {errors.plate && <p className="text-[11px] text-red-500">{errors.plate}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="color" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vehicle Color</Label>
                      <Input 
                        id="color" 
                        name="color" 
                        value={formData.color} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Silver, Black" 
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 3: Verification Documents ── */}
              {step === 3 && (
                <>
                  <div className="border-b border-border-default/60 pb-3 mb-2">
                    <h2 className="text-sm font-bold text-foreground">Driver Verification</h2>
                    <p className="text-xs text-muted-foreground">Required for campus trust and rider safety.</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="license" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Driver&apos;s License Number</Label>
                    <Input 
                      id="license" 
                      name="license" 
                      value={formData.license} 
                      onChange={handleInputChange} 
                      placeholder="NGA-DL-00000000" 
                      className={errors.license ? 'border-red-500' : ''} 
                    />
                    {errors.license && <p className="text-[11px] text-red-500">{errors.license}</p>}
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Student ID or Driver License Photo</Label>
                    <label
                      htmlFor="idFile"
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 border rounded-xl p-5 cursor-pointer transition-colors",
                        idFile ? "border-emerald-500 bg-emerald-500/10" : "border-border-default bg-surface-elevated hover:border-orange-brand/50"
                      )}
                    >
                      <Upload className={cn("w-6 h-6", idFile ? "text-emerald-500" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-semibold", idFile ? "text-emerald-500" : "text-foreground")}>
                        {idFile ? idFile.name : 'Click to select photo (JPEG, PNG)'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Clear photo showing your name and photo</span>
                      <input 
                        type="file" 
                        id="idFile" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setIdFile(e.target.files[0])
                          }
                        }} 
                      />
                    </label>
                    {errors.idFile && <p className="text-[11px] text-red-500">{errors.idFile}</p>}
                  </div>
                </>
              )}

              {/* ── STEP 4: Availability ── */}
              {step === 4 && (
                <>
                  <div className="border-b border-border-default/60 pb-3 mb-2">
                    <h2 className="text-sm font-bold text-foreground">Available Driving Days</h2>
                    <p className="text-xs text-muted-foreground">Which days are you open to accepting rides?</p>
                  </div>

                  <div className="space-y-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const isSelected = selectedDays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              setSelectedDays(prev =>
                                prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day]
                              )
                            }
                            className={cn(
                              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                              isSelected 
                                ? 'bg-orange-brand text-white border-orange-brand shadow-sm' 
                                : 'bg-surface-elevated text-muted-foreground border-border-default hover:text-foreground'
                            )}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                    {errors.days && <p className="text-[11px] text-red-500">{errors.days}</p>}
                  </div>
                </>
              )}

              {/* Nav / Submit Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border-default/60">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-default text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-brand hover:bg-orange-dark active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <span>{step === 4 ? 'Submit Application' : 'Next Step →'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            Questions? Contact driver support at <span className="text-foreground font-medium">support@tovedrop.com</span>
          </p>

        </div>
      </main>

      <Footer />
    </div>
  )
}
