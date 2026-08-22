"use client"

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  MapPin,
  Users,
  Car,
  ShieldCheck,
  CheckCircle2,
  Star,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useBookRideNavigation } from '@/hooks/useBookRideNavigation'
import { cn } from '@/lib/utils'
import { DROP_PACKAGES } from '@/lib/config'

/* ─────────────────────────────────────────────
   Drop coin icon
───────────────────────────────────────────── */
function DropCoin({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-hidden="true"
      style={{ transition: 'transform 0.6s ease' }}
    >
      <circle cx="10" cy="10" r="9" fill="url(#dc1)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
      <defs>
        <linearGradient id="dc1" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--orange-brand)" />
          <stop offset="100%" stopColor="var(--orange-brand)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Intersection Observer hook
───────────────────────────────────────────── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────── */
function useCounter(end: number, duration = 1800, started = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, started])
  return count
}

function useIncrement(base: number, started = false) {
  const [val, setVal] = useState(base)
  useEffect(() => {
    if (!started) return
    const id = setInterval(() => setVal(v => v + 1), 4200)
    return () => clearInterval(id)
  }, [started])
  return val
}

/* ─────────────────────────────────────────────
   Phone Mockup
───────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative w-full h-full" aria-hidden="true">

      {/* Ghost phone behind */}
      <div
        className="absolute w-52 rounded-[2.5rem] border-[2px] border-white/8 bg-bg-deep/80 overflow-hidden"
        style={{ top: '60px', right: '30px', opacity: 0.45, transform: 'rotate(8deg) scale(0.88)', height: '380px', filter: 'blur(1.5px)', zIndex: 1 }}
      >
        <div className="h-full bg-gradient-to-b from-[var(--surface-card)] to-[var(--bg-deep)]" />
      </div>

      {/* Floating driver card */}
      <div
        className="absolute z-[8] bg-surface-card border border-white/12 rounded-2xl p-3 shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
        style={{ width: '160px', top: '130px', left: '-20px', transform: 'rotate(-5deg)', animation: 'float-driver 5.5s ease-in-out infinite' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-[10px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))' }}>AO</div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-foreground truncate">Ade Okafor</p>
            <p className="text-[10px] text-purple-brand font-medium">✓ Verified Driver</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-purple-brand text-purple-brand" />
          <span className="text-[11px] text-foreground font-semibold">4.8</span>
        </div>
      </div>

      {/* Floating status pill */}
      <div
        className="absolute z-20 bg-bg-deep/90 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
        style={{ top: '10px', right: '50px', transform: 'rotate(3deg)', animation: 'float-notif 4.5s ease-in-out 0.5s infinite' }}
      >
        <span className="relative flex w-2 h-2 shrink-0">
          <span className="absolute inset-0 rounded-full bg-purple-brand animate-ping opacity-75" />
          <span className="relative rounded-full w-2 h-2 bg-purple-brand" />
        </span>
        <span className="text-[11px] text-foreground font-medium whitespace-nowrap">3 drivers near you</span>
      </div>

      {/* Main phone */}
      <div
        className="relative z-10 w-56 rounded-[2.5rem] border-[3px] border-white/15 bg-bg-deep shadow-[0_40px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
        style={{ animation: 'float 4s ease-in-out infinite', height: '420px', marginLeft: 'auto' }}
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[10px] text-foreground/50 font-medium">9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-1.5 rounded-sm bg-white/40" />
            <div className="w-1 h-1.5 rounded-sm bg-orange-brand" />
          </div>
        </div>
        <div className="px-4 pt-1 pb-3 border-b border-white/5">
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest mb-0.5">TOVEDROP</p>
          <p className="text-xs font-bold text-foreground">Booking Confirmed</p>
        </div>
        <div className="relative mx-3 mt-3 h-28 rounded-xl overflow-hidden bg-surface-card">
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mapgrid" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--orange-brand)" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapgrid)" />
          </svg>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M 30 90 Q 70 50 130 30" fill="none" stroke="var(--purple-brand)" strokeWidth="1.5" strokeDasharray="4 2" style={{ animation: 'dash-travel 3s linear infinite' }} />
          </svg>
          <div className="absolute left-7 bottom-5 w-2 h-2 rounded-full bg-white border border-white/60" />
          <div className="absolute right-8 top-5 w-2 h-2 rounded-full bg-orange-brand shadow-[0_0_6px_rgba(217,119,6,0.8)]" />
        </div>
        <div className="mx-3 mt-3 bg-[#1A1A30] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-[10px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))' }}>EO</div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">Emeka Obi</p>
            <p className="text-[10px] text-foreground/40">Toyota Corolla · LAG-123AA</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="w-2.5 h-2.5 fill-purple-brand text-purple-brand" />
            <span className="text-[10px] text-foreground/70">4.9</span>
          </div>
        </div>
        <div className="mx-3 mt-2 mb-3 flex items-center justify-center gap-2 bg-orange-brand/10 border border-orange-brand/20 rounded-full py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-brand animate-pulse" />
          <span className="text-[11px] text-orange-brand font-semibold">Driver en route · 4 min</span>
        </div>
        {/* Drops indicator */}
        <div className="mx-3 flex items-center justify-between bg-[#1A1A30] rounded-xl px-4 py-2.5">
          <span className="text-[10px] text-foreground/40">Cost</span>
          <div className="flex items-center gap-1">
            <DropCoin size={12} />
            <span className="text-[12px] font-bold text-orange-brand">1 Drop</span>
          </div>
        </div>
      </div>

      {/* Floating rating badge */}
      <div
        className="absolute z-20 bg-surface-card border border-white/12 rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        style={{ bottom: '80px', left: '0', animation: 'float-badge 6s ease-in-out 1s infinite' }}
      >
        <Star className="w-3.5 h-3.5 fill-purple-brand text-purple-brand shrink-0" />
        <span className="text-[12px] font-semibold text-foreground">4.9</span>
        <span className="text-[11px] text-foreground/45">· 200+ verified drivers</span>
      </div>

      {/* Floating trip card */}
      <div
        className="absolute z-20 bg-surface-card border-l-2 border-orange-brand border-t border-r border-b border-white/10 rounded-xl px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        style={{ bottom: '20px', right: '20px', transform: 'rotate(-3deg)', animation: 'float-badge 7s ease-in-out 2s infinite' }}
      >
        <p className="text-[10px] text-foreground/40 font-medium">Tomorrow · 8:00 AM</p>
        <p className="text-[12px] font-bold text-foreground mt-0.5">Campus → City Mall</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Hero Section
───────────────────────────────────────────── */
function HeroSection() {
  const [btnHover, setBtnHover] = useState(false)
  const handleBookRideClick = useBookRideNavigation()

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-bg-deep"
      aria-label="Hero"
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 1,
        }}
        aria-hidden="true"
      />

      {/* City grid lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.055 }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id="citygrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#citygrid)" />
      </svg>

      {/* Amber radial bloom — right */}
      <div className="absolute pointer-events-none" style={{ top: '10%', right: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(217,119,6,0.09) 0%, transparent 65%)', borderRadius: '50%' }} aria-hidden="true" />
      {/* Cyan bloom — left */}
      <div className="absolute pointer-events-none" style={{ bottom: '15%', left: '-8%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)', borderRadius: '50%' }} aria-hidden="true" />

      {/* Curved sweep lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M -100 600 Q 400 -100 1100 400" stroke="var(--orange-brand)" strokeWidth="1.5" fill="none" />
        <path d="M -200 800 Q 500 100 1300 500" stroke="var(--orange-brand)" strokeWidth="1" fill="none" />
        <path d="M 200 -100 Q 800 400 600 900" stroke="var(--purple-brand)" strokeWidth="1" fill="none" />
      </svg>
      {/* Animated signal path */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.18 }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M 0 500 Q 400 100 900 450 Q 1100 600 1400 300"
          fill="none"
          stroke="var(--orange-brand)"
          strokeWidth="1.5"
          strokeDasharray="8 12"
          style={{ animation: 'dash-travel 20s linear infinite' }}
          pathLength="100"
        />
      </svg>


      {/* Vertical side label */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2" aria-hidden="true">
        <div className="w-px h-16 bg-white/10" />
        <span className="text-foreground/20 font-semibold" style={{ fontSize: '9px', letterSpacing: '0.18em', writingMode: 'vertical-rl', textTransform: 'uppercase' }}>EST. 2024 · CAMPUS RIDES</span>
        <div className="w-px h-16 bg-white/10" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>


            {/* Headline */}
            <h1 className="font-extrabold text-foreground leading-[1.04] text-balance" style={{ fontSize: 'clamp(40px, 6.5vw, 76px)', letterSpacing: '-0.03em' }}>
              <span style={{ fontWeight: 300, display: 'block' }}>Your trusted ride,</span>
              <span style={{ display: 'block' }}>perfectly{' '}
                <span style={{
                  background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 24px rgba(217,119,6,0.4))',
                }}>organized.</span>
              </span>
            </h1>

            {/* Red editorial period */}
            <div className="mt-1" aria-hidden="true">
              <span className="font-extrabold text-orange-brand/20 select-none" style={{ fontSize: 'clamp(60px, 9vw, 120px)', lineHeight: 0.6, letterSpacing: '-0.04em' }}>...</span>
            </div>

            <p className="mt-6 text-foreground/50 leading-relaxed max-w-sm" style={{ fontSize: '15px' }}>
              All drivers are trusted. The goal is<br />
              to make transportation easier,<br />
              and organized for the campus.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <button
                onClick={handleBookRideClick}
                className="relative inline-flex items-center gap-2.5 font-bold text-[14px] text-foreground px-7 py-3.5 rounded-full overflow-hidden group transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))',
                  boxShadow: '0 4px 24px rgba(217,119,6,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
              >
                <span className="relative flex w-2 h-2 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />
                  <span className="relative rounded-full w-2 h-2 bg-white" />
                </span>
                Book a Ride · 1 Drop
                <ArrowRight className="w-4 h-4 transition-transform duration-200" style={{ transform: btnHover ? 'translateX(4px)' : 'translateX(0)' }} />
              </button>

              <Link
                href="/apply"
                className="inline-flex items-center gap-2 font-semibold text-[14px] text-foreground/85 hover:text-foreground px-6 py-3.5 rounded-full border transition-all duration-200 hover:border-white/45"
                style={{ borderColor: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.04)' }}
              >
                Become a Driver
              </Link>
            </div>

            {/* Trust chips */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              {[
                { label: 'Verified Drivers', rotate: '-1.2deg' },
                { label: '100% Student Network', rotate: '0.8deg' },
                { label: '1 Drop = 1 Booking', rotate: '-0.5deg', isDrops: true },
                { label: 'Get 3 Free Drops on Sign Up', rotate: '1deg', isCyan: true },
              ].map(({ label, rotate, isDrops, isCyan }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground hover:border-white/25 transition-all duration-200 cursor-default"
                  style={{ transform: `rotate(${rotate})`, transition: 'transform 0.2s, color 0.2s, border-color 0.2s' }}
                >
                  {isDrops && <DropCoin size={13} />}
                  {isCyan && <span className="w-1.5 h-1.5 rounded-full bg-purple-brand inline-block" />}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="relative h-[520px] lg:h-[580px] flex items-center justify-end" style={{ marginRight: '-60px' }}>
            <PhoneMockup />
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
          <path d="M0 60 L0 30 Q360 -10 720 30 Q1080 70 1440 20 L1440 60 Z" fill="#0F0F20" />
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: rotate(8deg) translateY(0px); }
          50% { transform: rotate(8deg) translateY(-14px); }
        }
        @keyframes float-notif {
          0%, 100% { transform: rotate(3deg) translateY(0px); }
          50% { transform: rotate(3deg) translateY(-8px); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-driver {
          0%, 100% { transform: rotate(-5deg) translateY(0px); }
          50% { transform: rotate(-5deg) translateY(-12px); }
        }
        @keyframes dash-travel {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  )
}

/* ─────────────────────────────────────────────
   How It Works
───────────────────────────────────────────── */
function HowItWorksSection() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const [straightened, setStraightened] = useState([false, false, false])

  useEffect(() => {
    const observers = stepRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setStraightened(prev => { const n = [...prev]; n[i] = true; return n })
            obs.disconnect()
          }
        },
        { threshold: 0.3 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  const steps = [
    { num: '01', Icon: MapPin, title: 'Request', desc: 'Enter pickup, destination, date, and time. Tell us exactly where and when you need to be.', tilt: 1.5 },
    { num: '02', Icon: Users, title: 'Match', desc: 'Browse pre-vetted drivers. Check ratings, vehicle type, and trip history before you confirm.', tilt: -1 },
    { num: '03', Icon: Car, title: 'Ride', desc: 'Use 1 Drop to cover your booking fee. You still pay your driver directly for the ride itself.', tilt: 0.8 },
  ]

  return (
    <section className="bg-[#0F0F20] py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" aria-hidden="true"
        style={{ background: 'var(--bg-deep)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center mb-20">
          <p className="text-[11px] font-semibold text-orange-brand uppercase tracking-widest mb-3">The Process</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance" style={{ letterSpacing: '-0.02em' }}>
            How TOVEDROP Works
          </h2>
          <div className="mx-auto mt-3 w-12 h-1 rounded-full bg-orange-brand" />
        </div>

        <div className="relative">
          <svg
            className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none hidden lg:block"
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 50% 60 C 30% 180, 70% 300, 50% 440 C 30% 580, 70% 700, 50% 820"
              fill="none"
              stroke="var(--purple-brand)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              style={{ animation: 'dash-travel 4s linear infinite', opacity: 0.3 }}
              pathLength="100"
            />
          </svg>

          <div className="flex flex-col gap-16 lg:gap-20">
            {steps.map((step, i) => {
              const isRight = i % 2 === 1
              return (
                <div
                  key={step.num}
                  ref={el => { stepRefs.current[i] = el }}
                  className={cn('relative flex', isRight ? 'lg:justify-end' : 'lg:justify-start')}
                >
                  <span
                    className="absolute top-1/2 -translate-y-1/2 font-extrabold text-foreground select-none pointer-events-none"
                    style={{ fontSize: '200px', lineHeight: 1, opacity: 0.04, left: isRight ? 'auto' : '-0.1em', right: isRight ? '-0.1em' : 'auto', letterSpacing: '-0.04em' }}
                    aria-hidden="true"
                  >
                    {step.num}
                  </span>
                  <div
                    className="relative z-10 bg-surface-card border-t-[3px] rounded-2xl p-8 w-full lg:w-[420px] shadow-[0_8px_40px_rgba(0,0,0,0.3)] transition-all duration-700"
                    style={{
                      borderTopColor: 'var(--orange-brand)',
                      transform: straightened[i] ? 'rotate(0deg)' : `rotate(${step.tilt}deg)`,
                      opacity: straightened[i] ? 1 : 0.6,
                    }}
                  >
                    <p className="text-xs font-semibold text-orange-brand uppercase tracking-widest mb-4">{step.num} /</p>
                    <div className="w-11 h-11 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center mb-4">
                      <step.Icon className="w-5 h-5 text-orange-brand" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-foreground/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Drops Pricing Section
───────────────────────────────────────────── */
function DropsSection() {
  const { ref, visible } = useFadeIn(0.1)

  const packages = DROP_PACKAGES.map((pkg) => {
    let coins = 3
    if (pkg.drops > 10) coins = 6
    if (pkg.drops > 20) coins = 8
    if (pkg.drops >= 100) coins = 10

    let accent = 'border-white/8'
    let size = 'normal'
    if (pkg.name === 'Popular') {
      accent = 'border-orange-brand/60'
      size = 'large'
    } else if (pkg.name === 'Semester') {
      accent = 'border-purple-brand/40'
    }

    return {
      name: pkg.name,
      price: `₦${pkg.naira.toLocaleString()}`,
      drops: pkg.drops,
      bookings: pkg.drops,
      badge: pkg.badge || null,
      coins,
      accent,
      size
    }
  })

  return (
    <section className="bg-[#080814] py-28 relative overflow-hidden">
      {/* Skew top */}
      <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none" aria-hidden="true"
        style={{ background: '#0F0F20', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)' }} />

      {/* Amber radial bloom behind Popular card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/2 pointer-events-none" aria-hidden="true"
        style={{ width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(217,119,6,0.07) 0%, transparent 60%)', borderRadius: '50%' }} />

      <div ref={ref} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className={cn('text-center mb-16 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <p className="text-[11px] font-semibold text-orange-brand uppercase tracking-widest mb-4">In-Platform Currency</p>
          <h2 className="text-foreground font-extrabold leading-[1.05] text-balance" style={{ fontSize: 'clamp(32px, 5vw, 58px)', letterSpacing: '-0.025em' }}>
            Book with
          </h2>
          <h2
            className="font-extrabold leading-[1.05]"
            style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 28px rgba(217,119,6,0.35))',
            }}
          >
            Drops.
          </h2>
          <p className="mt-4 text-foreground/40 max-w-sm mx-auto text-sm leading-relaxed">
            Buy Drops once. Use them to book rides.<br />You still pay your driver directly for the trip.
          </p>
        </div>

        {/* Bento grid */}
        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 items-end transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
          {packages.map((pkg, i) => {
            const isPopular = pkg.name === 'Popular'
            return (
              <div
                key={pkg.name}
                className={cn(
                  'relative rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 cursor-default group',
                  pkg.accent,
                  isPopular
                    ? 'bg-[#181810] shadow-[0_0_48px_rgba(217,119,6,0.18)] -mt-4 pb-7'
                    : 'bg-surface-card hover:border-orange-brand/30 hover:shadow-[0_0_24px_rgba(217,119,6,0.08)]'
                )}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={isPopular
                      ? { background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))', color: 'var(--foreground)' }
                      : { background: 'var(--purple-brand)', color: 'var(--foreground)' }
                    }
                  >
                    {pkg.badge}
                  </div>
                )}

                <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest">{pkg.name}</p>
                <p className="text-lg font-semibold text-foreground/40">{pkg.price}</p>

                {/* Drop count */}
                <div>
                  <span className="font-extrabold tabular-nums" style={{ fontSize: isPopular ? '56px' : '42px', letterSpacing: '-0.04em', color: 'var(--orange-brand)', lineHeight: 1 }}>
                    {pkg.drops}
                  </span>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--purple-brand)' }}>Drops</p>
                  <p className="text-[11px] text-foreground/30 mt-0.5">= {pkg.bookings} bookings</p>
                </div>

                {/* Coin row */}
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: Math.min(pkg.coins, 10) }).map((_, j) => (
                    <div key={j} className="group-hover:animate-bounce" style={{ animationDelay: `${j * 60}ms`, animationDuration: '0.5s' }}>
                      <DropCoin size={14} />
                    </div>
                  ))}
                  {pkg.coins > 10 && <span className="text-[10px] text-foreground/30">+more</span>}
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-foreground transition-all duration-200 hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))', boxShadow: isPopular ? '0 4px 20px rgba(217,119,6,0.35)' : undefined }}
                >
                  Buy Now
                </button>
              </div>
            )
          })}
        </div>

        {/* Bottom note */}
        <div className={cn('mt-10 text-center transition-all duration-700', visible ? 'opacity-100' : 'opacity-0')}>
          <p className="text-sm text-foreground/30 flex items-center justify-center gap-2">
            <DropCoin size={14} />
            <span>New users get <strong className="text-orange-brand">3 free Drops</strong> on sign up — no purchase needed</span>
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Trust & Safety
───────────────────────────────────────────── */
function TrustSection() {
  const { ref, visible } = useFadeIn(0.15)

  const trustPoints = [
    { Icon: ShieldCheck, title: 'Driver Vetting', desc: 'Every driver is manually screened. We verify identity, vehicle, and student affiliation before approval.' },
    { Icon: Users, title: 'Student-Only Network', desc: 'TOVEDROP is exclusively for university students and vetted campus-linked drivers.' },
    { Icon: Star, title: 'Ratings After Every Trip', desc: 'Riders rate every trip. Low-rated drivers are removed from the platform.' },
    { Icon: CheckCircle2, title: 'Pre-Scheduled Only', desc: 'No surge pricing, no last-minute scrambles. Book ahead and travel with certainty.' },
  ]

  return (
    <section className="bg-[#0C0C1E] py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" aria-hidden="true"
        style={{ background: '#080814', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)' }} />

      {/* Giant shield outline */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <svg width="520" height="600" viewBox="0 0 520 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
          <path d="M260 20 L480 100 L480 300 C480 440 370 540 260 580 C150 540 40 440 40 300 L40 100 Z" stroke="white" strokeWidth="2" fill="none" />
          <path d="M260 60 L440 130 L440 300 C440 415 345 505 260 540 C175 505 80 415 80 300 L80 130 Z" stroke="var(--purple-brand)" strokeWidth="1.2" fill="none" />
          <path d="M180 290 L235 345 L350 220" stroke="var(--purple-brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      <div ref={ref} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className={cn('text-center mb-16 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <p className="text-[11px] font-semibold text-purple-brand uppercase tracking-widest mb-3">Safety First</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance" style={{ letterSpacing: '-0.02em' }}>
            Built on{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--purple-brand), #0891B2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>verified.</span>
          </h2>
          <p className="mt-3 text-foreground/45 max-w-md mx-auto text-sm leading-relaxed">
            Every person on TOVEDROP — rider or driver — has been verified.
            <br />No strangers. No guesswork. Just trusted campus connections.
          </p>
          <div className="mx-auto mt-4 w-12 h-1 rounded-full bg-purple-brand" />
        </div>

        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
          {trustPoints.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="bg-[#080814] border border-white/5 rounded-2xl p-6 hover:border-purple-brand/30 hover:shadow-[0_8px_32px_rgba(6,182,212,0.1)] transition-all duration-300 cursor-default"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-brand/10 border border-purple-brand/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-purple-brand" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
              <p className="text-xs text-foreground/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Stats — Bento grid
───────────────────────────────────────────── */
function StatsSection() {
  const { ref, visible } = useFadeIn(0.15)
  const trips = useCounter(4200, 1800, visible)
  const students = useCounter(1800, 1600, visible)

  return (
    <section className="bg-[#080814] py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" aria-hidden="true"
        style={{ background: '#0C0C1E', clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 100%)' }} />

      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className={cn('text-center mb-12 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <p className="text-[11px] font-semibold text-orange-brand uppercase tracking-widest mb-3">By the Numbers</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance" style={{ letterSpacing: '-0.02em' }}>
            Growing Every Week
          </h2>
          <div className="mx-auto mt-3 w-12 h-1 rounded-full bg-orange-brand" />
        </div>

        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>

          {/* Trips completed — wide */}
          <div className="col-span-2 bg-surface-card border border-white/5 rounded-2xl p-7 flex flex-col justify-between overflow-hidden relative group hover:border-orange-brand/25 hover:shadow-[0_0_32px_rgba(217,119,6,0.08)] transition-all duration-300 cursor-default" style={{ minHeight: '180px' }}>
            <div className="relative z-10">
              <p className="text-[11px] font-semibold text-foreground/30 uppercase tracking-widest mb-2">Trips Completed</p>
              <p className="text-5xl font-extrabold text-foreground tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                {trips.toLocaleString()}<span className="text-orange-brand">+</span>
              </p>
            </div>
            <svg className="absolute bottom-0 right-0 w-48 h-32 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="20" cy="100" r="5" fill="var(--orange-brand)" />
              <circle cx="80" cy="60" r="4" fill="var(--orange-brand)" />
              <circle cx="140" cy="30" r="4" fill="var(--purple-brand)" />
              <circle cx="180" cy="80" r="5" fill="var(--orange-brand)" />
              <path d="M20 100 Q50 60 80 60 Q110 60 140 30 Q160 10 180 80" stroke="var(--orange-brand)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            </svg>
          </div>

          {/* Students */}
          <div className="bg-[#0E0E24] border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative group hover:border-orange-brand/25 hover:shadow-[0_0_32px_rgba(217,119,6,0.08)] transition-all duration-300 cursor-default" style={{ minHeight: '180px' }}>
            <div>
              <p className="text-[11px] font-semibold text-foreground/30 uppercase tracking-widest mb-2">Students</p>
              <p className="text-4xl font-extrabold text-foreground tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                {students}<span className="text-orange-brand">+</span>
              </p>
            </div>
            <div className="flex -space-x-2 mt-3">
              {['var(--orange-brand)','#3B82F6','var(--purple-brand)','var(--orange-brand)','#8B5CF6'].map((c, j) => (
                <div key={j} className="w-7 h-7 rounded-full border-2 border-[#0E0E24] flex items-center justify-center text-foreground text-[9px] font-bold shrink-0" style={{ background: c }}>
                  {String.fromCharCode(65 + j)}
                </div>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-[#0A0A18] border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative group hover:border-purple-brand/25 hover:shadow-[0_0_32px_rgba(6,182,212,0.08)] transition-all duration-300 cursor-default" style={{ minHeight: '180px' }}>
            <div>
              <p className="text-[11px] font-semibold text-foreground/30 uppercase tracking-widest mb-2">Avg Rating</p>
              <p className="text-4xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                4.9<span className="text-purple-brand text-2xl">★</span>
              </p>
            </div>
            <div className="flex gap-1 mt-3">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-4 h-4 fill-purple-brand text-purple-brand" />
              ))}
            </div>
          </div>

          {/* Pay with Drops */}
          <div className="col-span-2 lg:col-span-4 bg-[#0A0A18] border border-white/5 rounded-2xl px-7 py-5 flex items-center justify-between group hover:border-orange-brand/25 hover:shadow-[0_0_32px_rgba(217,119,6,0.08)] transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3">
              <DropCoin size={28} />
              <div>
                <p className="text-[11px] font-semibold text-foreground/30 uppercase tracking-widest mb-1">Platform Fee</p>
                <p className="text-3xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
                  1 Drop · 1 Ride
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/35 max-w-xs text-right hidden sm:block leading-relaxed">
              No card at checkout. Buy Drops once and use them for every booking.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}



/* ─────────────────────────────────────────────
   Driver CTA
───────────────────────────────────────────── */
function DriverCTASection() {
  const { ref, visible } = useFadeIn(0.15)
  const [hovered, setHovered] = useState(false)

  return (
    <section ref={ref} className="bg-[#060611] py-24 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--orange-brand) 50%, transparent 100%)' }}
        aria-hidden="true"
      />
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" aria-hidden="true"
        style={{ background: '#0C0C1E', clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 100%)' }} />

      {/* Speedometer SVG */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none" aria-hidden="true">
        <svg width="360" height="360" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.07 }}>
          <path d="M 60 300 A 180 180 0 0 1 300 300" stroke="var(--orange-brand)" strokeWidth="2" fill="none" />
          <path d="M 90 290 A 140 140 0 0 1 270 290" stroke="white" strokeWidth="1" fill="none" />
          <path d="M 120 280 A 100 100 0 0 1 240 280" stroke="var(--purple-brand)" strokeWidth="1" fill="none" />
          {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t, i) => {
            const angle = Math.PI + t * Math.PI
            const x1 = 180 + 160 * Math.cos(angle)
            const y1 = 300 + 160 * Math.sin(angle)
            const x2 = 180 + 148 * Math.cos(angle)
            const y2 = 300 + 148 * Math.sin(angle)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1.5" />
          })}
          <line x1="180" y1="300" x2="90" y2="130" stroke="var(--orange-brand)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="180" cy="300" r="8" fill="var(--orange-brand)" />
          <circle cx="180" cy="300" r="4" fill="#060611" />
          {[60, 110, 160, 220, 280, 320].map((x, i) => (
            <circle key={i} cx={x} cy={340} r={i % 2 === 0 ? 3 : 2} fill={i % 2 === 0 ? 'var(--orange-brand)' : 'var(--purple-brand)'} opacity={0.6} />
          ))}
          <path d="M60 340 L320 340" stroke="white" strokeWidth="0.8" strokeDasharray="4 6" opacity={0.4} />
        </svg>
      </div>

      <div
        className={cn(
          'relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-700',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}
      >
        <div>
          <p className="text-[11px] font-semibold text-orange-brand uppercase tracking-widest mb-4">Join the Fleet</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight text-balance" style={{ letterSpacing: '-0.025em' }}>
            Drive with TOVEDROP
          </h2>
          <p className="mt-5 text-foreground/55 leading-relaxed max-w-md">
            Join our vetted driver community and get consistent bookings from
            verified university students. Flexible hours, fair earnings.
          </p>
          <p className="mt-3 text-sm text-purple-brand font-medium">
            Drops are for riders only. Drivers join free.
          </p>

          <Link
            href="/apply"
            className="mt-8 inline-flex items-center justify-center gap-2 font-bold text-sm px-7 py-3.5 rounded-full w-full sm:w-auto transition-all duration-200"
            style={{
              background: hovered
                ? 'linear-gradient(135deg, var(--orange-brand) 0%, var(--orange-brand) 100%)'
                : 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))',
              color: 'var(--foreground)',
              boxShadow: hovered ? '0 4px 28px rgba(217,119,6,0.5)' : '0 4px 24px rgba(217,119,6,0.3)',
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            Apply to Drive <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="bg-surface-card border border-white/8 rounded-2xl p-6 w-72 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-foreground font-bold text-base shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))' }}>EO</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Emeka Obi</p>
                <p className="text-xs text-foreground/45">Verified Driver · Lagos</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ value: '4.9', label: 'Rating' }, { value: '218', label: 'Bookings' }, { value: '₦450k', label: 'Earned' }].map((stat) => (
                <div key={stat.label} className="bg-bg-deep/80 rounded-xl py-3">
                  <p className="text-base font-extrabold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-foreground/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      {/* Fixed top glow strip */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[9997] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(217,119,6,0.7) 40%, rgba(6,182,212,0.5) 60%, transparent 100%)' }}
        aria-hidden="true"
      />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <DropsSection />
        <TrustSection />
        <StatsSection />

        <DriverCTASection />
      </main>
      <Footer />
    </div>
  )
}
