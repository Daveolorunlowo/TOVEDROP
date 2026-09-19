"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2, ArrowRight, CheckCircle2, ShieldCheck, CreditCard,
  Zap, Lock, ChevronRight, Flame, Star, Crown, Rocket
} from 'lucide-react'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'
import '@/app/dashboard/buy-drops/buy-drops.css'

/* ═══════════════════════════════════════════════════════
   DESIGN SYSTEM CONSTANTS
   ═══════════════════════════════════════════════════════ */

const TIER_CONFIG: Record<string, {
  icon: React.ElementType
  gradient: string
  glowColor: string
  tagline: string
  accentBorder: string
}> = {
  starter:    { icon: Zap,    gradient: 'from-blue-600 to-cyan-400',    glowColor: 'rgba(59,130,246,0.4)',  tagline: 'Perfect first ride',    accentBorder: 'border-blue-500/40' },
  popular:    { icon: Flame,  gradient: 'from-orange-600 to-amber-400', glowColor: 'rgba(249,115,22,0.4)',  tagline: 'Best price per drop',   accentBorder: 'border-orange-500/40' },
  campus_pro: { icon: Star,   gradient: 'from-violet-600 to-purple-400',glowColor: 'rgba(139,92,246,0.4)',  tagline: 'Campus commuter pack',  accentBorder: 'border-violet-500/40' },
  semester:   { icon: Crown,  gradient: 'from-amber-500 to-yellow-300', glowColor: 'rgba(245,158,11,0.5)',  tagline: 'Lock in the semester',  accentBorder: 'border-amber-500/40' },
}

/* ═══════════════════════════════════════════════════════
   UTILITY HOOKS
   ═══════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1000) {
  const [current, setCurrent] = useState(target)
  const prev = useRef(target)

  useEffect(() => {
    if (prev.current === target) return
    const start = prev.current
    const t0 = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCurrent(Math.floor(start + (target - start) * ease))
      if (p < 1) raf = requestAnimationFrame(tick)
      else { setCurrent(target); prev.current = target }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return current
}

/* ═══════════════════════════════════════════════════════
   COMPONENT: Drop Coin SVG
   ═══════════════════════════════════════════════════════ */

function DropCoin({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="url(#dc_grad)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="dc_grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function BuyDropsClient({
  initialDropsBalance,
  isFirstTime,
}: {
  initialDropsBalance: number
  isFirstTime: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [balance, setBalance] = useState(initialDropsBalance)
  const [selected, setSelected] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [celebData, setCelebData] = useState<{ drops: number; saved: number | null }>({ drops: 0, saved: null })
  const bursts = useRef<Array<{ x: number; y: number; r: number }>>([])

  useEffect(() => { setBalance(initialDropsBalance) }, [initialDropsBalance])

  // Handle payment success callback
  useEffect(() => {
    const payment = searchParams.get('payment')
    const added = searchParams.get('added')
    const saved = searchParams.get('saved')

    if (payment === 'success' && added) {
      bursts.current = Array.from({ length: 16 }).map(() => {
        const angle = Math.random() * Math.PI * 2
        const dist = 80 + Math.random() * 100
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, r: (Math.random() - 0.5) * 720 }
      })
      setCelebData({ drops: parseInt(added), saved: saved ? parseInt(saved) : null })
      setCelebrating(true)
      setBalance(prev => prev + parseInt(added))
    }
  }, [searchParams])

  const dismissCelebration = () => {
    setCelebrating(false)
    const p = new URLSearchParams(searchParams.toString())
    p.delete('payment'); p.delete('added'); p.delete('saved')
    router.replace(`/dashboard/buy-drops?${p.toString()}`, { scroll: false })
    router.refresh()
  }

  useEffect(() => {
    if (celebrating) {
      const t = setTimeout(dismissCelebration, 7000)
      return () => clearTimeout(t)
    }
  }, [celebrating])

  const animBal = useCountUp(balance, 1200)

  // Checkout handler
  const handleCheckout = async () => {
    if (!selected || checking) return
    setChecking(true); setError('')
    const pkg = DROP_PACKAGES.find(p => p.id === selected)
    if (!pkg) return

    try {
      const res = await fetch('/api/drops/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, amount: pkg.naira }),
      })
      if (!res.ok) throw new Error('API failed')
      const data = await res.json()
      setRedirecting(true)
      setTimeout(() => {
        let savedAmt = null
        if (data.discountApplied) savedAmt = pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE
        window.location.href = `/dashboard/buy-drops?payment=success&added=${pkg.drops}${savedAmt ? '&saved=' + savedAmt : ''}`
      }, 1000)
    } catch {
      setError('Something went wrong. Please try again.')
      setChecking(false)
    }
  }

  const selectedPkg = DROP_PACKAGES.find(p => p.id === selected)

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden relative selection:bg-orange-500/30">

      {/* ── Ambient background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/8 rounded-full blur-[120px] float-slow" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[100px] float-medium" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[80px] float-fast" />
      </div>

      {/* ── Noise texture overlay ── */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-40">

        {/* ════════════════════════════════════════════════
           SECTION 1: HERO — Wallet + Value Prop
           ════════════════════════════════════════════════ */}
        <section className="mb-16 sm:mb-20">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5">
                <Rocket className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Drop Store</span>
              </div>
              <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.95] tracking-[-0.03em]">
                Get Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                  Drops.
                </span>
              </h1>
              <p className="text-white/40 text-base sm:text-lg font-medium mt-4 max-w-md leading-relaxed">
                Secure rides on demand. Every drop unlocks one seamless booking — no surge, no hassle, just go.
              </p>
            </div>

            {/* Wallet card */}
            <div className={`
              relative w-full sm:w-auto sm:min-w-[320px] p-6 rounded-2xl overflow-hidden
              border transition-all duration-700
              ${celebrating
                ? 'border-green-500/40 bg-green-500/[0.06] shadow-[0_0_60px_rgba(34,197,94,0.15)]'
                : 'border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl'}
            `}>
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Your Wallet</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-[2px] shadow-[0_0_24px_rgba(249,115,22,0.35)]">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex items-center justify-center">
                      <DropCoin size={28} />
                    </div>
                  </div>
                  <div>
                    <span className="text-5xl font-black tabular-nums tracking-tighter text-white leading-none">
                      {animBal}
                    </span>
                    <span className="block text-xs font-bold text-orange-400/80 tracking-wider mt-1">DROPS AVAILABLE</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 live-pulse" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active & Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 opacity-30">
            {[
              { icon: ShieldCheck, text: '256-bit encrypted' },
              { icon: Lock, text: 'Paystack secured' },
              { icon: Zap, text: 'Instant activation' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <t.icon className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white">{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
           SECTION 2: DROP PACKAGES — The Grid
           ════════════════════════════════════════════════ */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Choose Your Pack</h2>
              <p className="text-white/30 text-sm font-medium mt-1">1 Drop = 1 Ride. No expiry. No catches.</p>
            </div>
            {isFirstTime && (
              <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-xs font-black text-green-400 uppercase tracking-wider">
                  {(FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100)}% First-time Discount
                </span>
              </div>
            )}
          </div>

          {/* Mobile first-time badge */}
          {isFirstTime && (
            <div className="sm:hidden flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl mb-6">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-xs font-black text-green-400 uppercase tracking-wider">
                {(FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100)}% First-time Discount Active
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {DROP_PACKAGES.map((pkg, idx) => {
              const tier = TIER_CONFIG[pkg.id] || TIER_CONFIG.starter
              const TierIcon = tier.icon
              const isActive = selected === pkg.id
              const price = isFirstTime ? pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : pkg.naira
              const isFeatured = pkg.id === 'popular' || pkg.id === 'semester'

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className={`
                    card-enter relative rounded-[20px] border cursor-pointer overflow-hidden group
                    transition-all duration-300 ease-out
                    ${isFeatured ? 'sm:row-span-1' : ''}
                    ${isActive
                      ? `${tier.accentBorder} bg-white/[0.06] shadow-[0_0_40px_${tier.glowColor}] scale-[1.01]`
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'}
                    ${selected && !isActive ? 'opacity-40 scale-[0.97] saturate-50' : ''}
                  `}
                  style={{
                    animationDelay: `${idx * 80}ms`,
                  }}
                >
                  {/* Badge ribbon */}
                  {pkg.badge && (
                    <div className={`absolute top-0 right-0 z-20 bg-gradient-to-r ${tier.gradient} text-black text-[9px] font-black uppercase tracking-[0.15em] px-5 py-2 rounded-bl-2xl shadow-lg`}>
                      {pkg.badge}
                    </div>
                  )}

                  {/* Card content */}
                  <div className="relative z-10 p-6 sm:p-7 flex flex-col min-h-[200px]">
                    {/* Top row: Icon + selector */}
                    <div className="flex items-start justify-between mb-auto">
                      <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isActive
                          ? `bg-gradient-to-br ${tier.gradient} shadow-[0_0_20px_${tier.glowColor}]`
                          : 'bg-white/[0.05] group-hover:bg-white/[0.08]'}
                      `}>
                        <TierIcon className={`w-6 h-6 ${isActive ? 'text-black' : 'text-white/60 group-hover:text-white/80'}`} />
                      </div>

                      <div className={`
                        w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${isActive
                          ? `bg-gradient-to-br ${tier.gradient} border-transparent scale-110`
                          : 'border-white/15 bg-transparent group-hover:border-white/30'}
                      `}>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>
                    </div>

                    {/* Bottom: name, price, tagline */}
                    <div className="mt-6">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-1">{tier.tagline}</p>

                      <h3 className="text-2xl sm:text-[1.75rem] font-black tracking-tight text-white mb-3">
                        {pkg.drops} Drops
                      </h3>

                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">
                          ₦{price.toLocaleString()}
                        </span>
                        {isFirstTime && (
                          <span className="text-base font-bold text-white/25 line-through">
                            ₦{pkg.naira.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs font-bold text-white/20 uppercase tracking-wider">
                          ₦{(price / pkg.drops).toFixed(0)} per ride
                        </span>
                        {isFirstTime && (
                          <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Save ₦{(pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ambient glow on selection */}
                  <div className={`
                    absolute inset-0 rounded-[20px] pointer-events-none transition-opacity duration-500
                    bg-gradient-to-t from-transparent via-transparent to-white/[0.03]
                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `} />
                </div>
              )
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
           SECTION 3: CHECKOUT — Sticky Bottom CTA
           ════════════════════════════════════════════════ */}
        <div className={`
          fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out
          ${selected ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}>
          <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/[0.08] px-5 sm:px-8 py-5">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4">
              {/* Order summary */}
              {selectedPkg && (
                <div className="flex-1 flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TIER_CONFIG[selectedPkg.id]?.gradient || 'from-orange-500 to-red-500'} flex items-center justify-center shrink-0`}>
                    <DropCoin size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">{selectedPkg.drops} Drops — {selectedPkg.name}</p>
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none mt-0.5">
                      ₦{(isFirstTime ? selectedPkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : selectedPkg.naira).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-red-400 text-xs font-bold text-center sm:text-left w-full sm:w-auto">{error}</p>
              )}

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={checking}
                className={`
                  relative w-full sm:w-auto sm:min-w-[280px] py-4 sm:py-5 px-8 rounded-2xl
                  text-base sm:text-lg font-black uppercase tracking-[0.1em]
                  flex items-center justify-center gap-3 overflow-hidden
                  transition-all duration-300 btn-shine
                  ${checking
                    ? 'bg-white/10 text-white/60 cursor-wait'
                    : 'bg-white text-black hover:bg-gray-100 active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.12)]'}
                `}
              >
                {checking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Buy Now
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
           SECTION 4: SOCIAL PROOF & TRUST
           ════════════════════════════════════════════════ */}
        <section className="text-center py-12 border-t border-white/[0.04]">
          <p className="text-white/15 text-xs font-bold uppercase tracking-[0.2em] mb-6">Trusted by students everywhere</p>
          <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
            {[
              { val: '2,000+', label: 'Drops Purchased' },
              { val: '500+', label: 'Active Riders' },
              { val: '4.9★', label: 'User Rating' },
              { val: '0', label: 'Hidden Fees' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{s.val}</p>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════
         OVERLAYS
         ════════════════════════════════════════════════ */}

      {/* Redirect overlay */}
      {redirecting && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center flex-col animate-in fade-in duration-500">
          <div className="w-20 h-20 relative mb-10">
            <div className="absolute inset-0 border-[3px] border-white/10 rounded-full" />
            <div className="absolute inset-0 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            <Lock className="absolute inset-0 m-auto w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Securing Payment</h2>
          <p className="text-sm text-white/30 font-medium">Redirecting to Paystack...</p>
        </div>
      )}

      {/* Celebration overlay */}
      {celebrating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center animate-in fade-in duration-500 p-5">
          <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-[2rem] max-w-md w-full text-center shadow-[0_0_120px_rgba(249,115,22,0.15)] relative overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-green-500/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-orange-500/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Confetti bursts */}
            {bursts.current.map((c, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full"
                style={{
                  background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#22c55e' : '#f59e0b',
                  boxShadow: `0 0 8px ${i % 3 === 0 ? 'rgba(249,115,22,0.6)' : i % 3 === 1 ? 'rgba(34,197,94,0.6)' : 'rgba(245,158,11,0.6)'}`,
                  '--tx': `${c.x}px`,
                  '--ty': `${c.y}px`,
                  '--tr': `${c.r}deg`,
                  animation: 'burst 2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                  transform: 'translate(-50%, -50%)',
                } as React.CSSProperties}
              />
            ))}

            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)] scale-in-center">
                <CheckCircle2 className="w-10 h-10 text-black" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">You&apos;re In.</h2>
              <p className="text-base text-white/40 font-medium mb-8">
                <strong className="text-orange-500 font-black">{celebData.drops} Drops</strong> added to your wallet
              </p>

              {celebData.saved && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold px-5 py-3 rounded-xl mb-8">
                  🎉 You saved ₦{celebData.saved.toLocaleString()} with your first-timer discount!
                </div>
              )}

              <button
                onClick={dismissCelebration}
                className="w-full py-4 bg-white text-black text-base font-black uppercase tracking-wider rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                Start Riding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
