"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2, Lock, Zap } from 'lucide-react'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'
import '@/app/dashboard/buy-drops/buy-drops.css'

function useCountUp(target: number, dur = 1000) {
  const [val, setVal] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    if (prev.current === target) return
    const s = prev.current, t0 = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setVal(Math.floor(s + (target - s) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
      else { setVal(target); prev.current = target }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return val
}

const TIER_ACCENT: Record<string, string> = {
  starter: 'border-blue-500/30',
  popular: 'border-orange-500/30',
  campus_pro: 'border-violet-500/30',
  semester: 'border-amber-500/30',
}

const TIER_TAG: Record<string, { bg: string; label: string }> = {
  starter: { bg: 'bg-blue-500/10 text-blue-400', label: 'Starter' },
  popular: { bg: 'bg-orange-500/10 text-orange-400', label: 'Popular' },
  campus_pro: { bg: 'bg-violet-500/10 text-violet-400', label: 'Pro' },
  semester: { bg: 'bg-amber-500/10 text-amber-400', label: 'Elite' },
}

export function BuyDropsClient({
  initialDropsBalance,
  isFirstTime,
}: {
  initialDropsBalance: number
  isFirstTime: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [balance, setBalance] = useState(initialDropsBalance)
  const [selected, setSelected] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [celebData, setCelebData] = useState<{ drops: number; saved: number | null }>({ drops: 0, saved: null })
  const bursts = useRef<Array<{ x: number; y: number; r: number }>>([])

  useEffect(() => { setBalance(initialDropsBalance) }, [initialDropsBalance])

  useEffect(() => {
    const payment = searchParams.get('payment')
    const added = searchParams.get('added')
    const saved = searchParams.get('saved')
    if (payment === 'success' && added) {
      bursts.current = Array.from({ length: 14 }).map(() => {
        const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 100
        return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (Math.random() - 0.5) * 720 }
      })
      setCelebData({ drops: parseInt(added), saved: saved ? parseInt(saved) : null })
      setCelebrating(true)
      setBalance(prev => prev + parseInt(added))
    }
  }, [searchParams])

  const dismiss = () => {
    setCelebrating(false)
    const p = new URLSearchParams(searchParams.toString())
    p.delete('payment'); p.delete('added'); p.delete('saved')
    router.replace(`/dashboard/buy-drops?${p.toString()}`, { scroll: false })
    router.refresh()
  }

  useEffect(() => {
    if (celebrating) { const t = setTimeout(dismiss, 7000); return () => clearTimeout(t) }
  }, [celebrating])

  const animBal = useCountUp(balance, 1200)
  const selectedPkg = DROP_PACKAGES.find(p => p.id === selected)

  const checkout = async () => {
    if (!selected || checking) return
    setChecking(true); setError('')
    const pkg = DROP_PACKAGES.find(p => p.id === selected)
    if (!pkg) return
    try {
      const res = await fetch('/api/drops/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, amount: pkg.naira }),
      })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      setRedirecting(true)
      setTimeout(() => {
        let s = null
        if (data.discountApplied) s = pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE
        window.location.href = `/dashboard/buy-drops?payment=success&added=${pkg.drops}${s ? '&saved=' + s : ''}`
      }, 1000)
    } catch {
      setError('Transaction failed. Try again.')
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-44">

        {/* ── HEADER ── */}
        <header className="mb-14 sm:mb-20 rise">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <div className="max-w-lg">
              <h1 className="text-5xl sm:text-6xl font-black leading-[0.92] tracking-tight text-white mb-4">
                Buy Drops<span className="text-orange-500">.</span>
              </h1>
              <p className="text-base text-white/35 font-medium leading-relaxed">
                Each drop unlocks one ride — no surge, no expiry, no hidden fees. Pick a pack and you're set.
              </p>
            </div>

            {/* Wallet */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-7 py-5 sm:min-w-[260px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-2">Your Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-5xl font-black text-white tracking-tighter leading-none">
                  {animBal}
                </span>
                <span className="text-sm font-bold text-orange-500">drops</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="relative flex h-2 w-2">
                  <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── SECTION LABEL ── */}
        <div className="flex items-center justify-between mb-6 rise" style={{ animationDelay: '80ms' }}>
          <h2 className="text-lg font-bold text-white/50">Select a pack</h2>
          {isFirstTime && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                {FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100}% off — first purchase
              </span>
            </div>
          )}
        </div>

        {/* ── PACKAGE GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          {DROP_PACKAGES.map((pkg, idx) => {
            const isActive = selected === pkg.id
            const price = isFirstTime ? pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : pkg.naira
            const tag = TIER_TAG[pkg.id] || TIER_TAG.starter
            const accent = TIER_ACCENT[pkg.id] || ''

            return (
              <div
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`
                  rise relative rounded-2xl border cursor-pointer overflow-hidden
                  transition-all duration-250
                  ${isActive
                    ? `${accent} bg-white/[0.06] ring-1 ring-white/[0.08]`
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'}
                  ${selected && !isActive ? 'opacity-40 scale-[0.98]' : ''}
                `}
                style={{ animationDelay: `${120 + idx * 70}ms` }}
              >
                <div className="p-6 sm:p-8 flex flex-col min-h-[220px]">
                  {/* Top: tag + badge + selector */}
                  <div className="flex items-start justify-between mb-auto">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${tag.bg}`}>
                        {tag.label}
                      </span>
                      {pkg.badge && (
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${isActive ? 'border-orange-500 bg-orange-500' : 'border-white/15'}
                    `}>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mt-6">
                    <h3 className="text-2xl font-black tracking-tight text-white mb-4">
                      {pkg.drops} Drops
                    </h3>

                    {/* PRICE */}
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">
                        ₦{price.toLocaleString()}
                      </span>
                      {isFirstTime && (
                        <span className="text-sm font-bold text-white/20 line-through">
                          ₦{pkg.naira.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs font-medium text-white/20">
                        ₦{(price / pkg.drops).toFixed(0)} per ride
                      </span>
                      {isFirstTime && (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md tracking-wider">
                          Save ₦{(pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                {isActive && <div className="h-[2px] bg-orange-500" />}
              </div>
            )
          })}
        </div>

        {/* ── INFO ── */}
        <div className="rise grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left border-t border-white/[0.05] pt-10" style={{ animationDelay: '450ms' }}>
          {[
            { q: 'Do drops expire?', a: 'Never. Use them whenever.' },
            { q: 'What does 1 Drop cover?', a: 'One ride booking. The transport fare is paid separately to the driver.' },
            { q: 'Can I get a refund?', a: 'Unused drops are refundable within 30 days.' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-xs font-bold text-white/30 mb-1.5">{item.q}</p>
              <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STICKY CHECKOUT ── */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50 transition-all duration-400
        ${selected ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.08]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center gap-4">
            {selectedPkg && (
              <div className="flex-1 flex items-center gap-4 w-full sm:w-auto">
                <div>
                  <p className="text-sm font-bold text-white/50">{selectedPkg.drops} Drops — {selectedPkg.name}</p>
                  <p className="font-mono text-3xl font-black text-white tracking-tighter leading-none mt-0.5">
                    ₦{(isFirstTime ? selectedPkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : selectedPkg.naira).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

            <button
              onClick={checkout}
              disabled={checking}
              className={`
                w-full sm:w-auto sm:min-w-[220px] py-4 px-8 rounded-xl
                text-sm font-bold uppercase tracking-wider
                flex items-center justify-center gap-2
                transition-all duration-200
                ${checking
                  ? 'bg-white/10 text-white/40 cursor-wait'
                  : 'bg-white text-black hover:bg-orange-500 hover:text-black active:scale-[0.98]'}
              `}
            >
              {checking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing</>
              ) : (
                <>Purchase <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── REDIRECT ── */}
      {redirecting && (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center flex-col">
          <div className="w-16 h-16 relative mb-8">
            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <Lock className="absolute inset-0 m-auto w-5 h-5 text-white/60" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/30">Redirecting to Paystack</p>
        </div>
      )}

      {/* ── CELEBRATION ── */}
      {celebrating && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-5">
          <div className="bg-[#111] border border-white/[0.08] p-10 rounded-2xl max-w-md w-full text-center relative overflow-hidden">

            {bursts.current.map((c, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  background: ['#f97316', '#22c55e', '#f59e0b', '#fff'][i % 4],
                  '--tx': `${c.x}px`, '--ty': `${c.y}px`, '--tr': `${c.r}deg`,
                  animation: 'burst 2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                  transform: 'translate(-50%, -50%)',
                } as React.CSSProperties}
              />
            ))}

            <div className="relative z-10">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 scale-in-center">
                <CheckCircle2 className="w-8 h-8 text-black" />
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight mb-2">You're set!</h2>
              <p className="text-base text-white/40 font-medium mb-8">
                <strong className="text-orange-500 font-black">{celebData.drops} Drops</strong> added to your wallet
              </p>

              {celebData.saved && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold px-4 py-3 rounded-xl mb-8">
                  🎉 You saved ₦{celebData.saved.toLocaleString()} with your first-timer discount!
                </div>
              )}

              <button
                onClick={dismiss}
                className="w-full py-4 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all"
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
