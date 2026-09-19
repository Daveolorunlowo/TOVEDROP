"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'
import '@/app/dashboard/buy-drops/buy-drops.css'

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

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

const TAG_COLORS: Record<string, string> = {
  starter: 'bg-white text-black',
  popular: 'bg-orange-500 text-black',
  campus_pro: 'bg-violet-500 text-white',
  semester: 'bg-amber-400 text-black',
}

const TAG_LABELS: Record<string, string> = {
  starter: 'ENTRY',
  popular: 'POPULAR',
  campus_pro: 'PRO',
  semester: 'ELITE',
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
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
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          MARQUEE TICKER — editorial urgency
         ═══════════════════════════════════════════ */}
      <div className="w-full overflow-hidden border-b border-white/[0.06] bg-[#0d0d0d]">
        <div className="flex whitespace-nowrap marquee-track py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="inline-flex items-center gap-8 mr-8">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-white/20">
                1 DROP = 1 RIDE
              </span>
              <span className="text-white/10">◆</span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-white/20">
                NO SURGE PRICING
              </span>
              <span className="text-white/10">◆</span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-white/20">
                NEVER EXPIRES
              </span>
              <span className="text-white/10">◆</span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-white/20">
                PAYSTACK SECURED
              </span>
              <span className="text-white/10">◆</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-44">

        {/* ═══════════════════════════════════════════
            HEADER — asymmetric brutalist hero
           ═══════════════════════════════════════════ */}
        <header className="mb-16 sm:mb-20 rise" style={{ animationDelay: '0ms' }}>
          <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-8">
            {/* Left: title */}
            <div className="max-w-xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/25 mb-4">
                「 DROP STORE 」
              </p>
              <h1 className="text-[clamp(3rem,8vw,6rem)] font-black leading-[0.88] tracking-[-0.04em] text-white">
                BUY<br />
                DROPS<span className="text-orange-500">.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/30 font-medium mt-5 max-w-sm leading-relaxed">
                Each drop is one ride — no expiry, no surge, no nonsense. Pick a pack. Go.
              </p>
            </div>

            {/* Right: wallet */}
            <div className="sm:text-right shrink-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 mb-2">
                BALANCE
              </p>
              <div className="flex sm:justify-end items-baseline gap-2">
                <span className="font-mono text-6xl sm:text-8xl font-black text-white tracking-tighter leading-none">
                  {animBal}
                </span>
                <span className="font-mono text-lg font-bold text-orange-500 tracking-wider">
                  DRPS
                </span>
              </div>
              <div className="flex sm:justify-end items-center gap-2 mt-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 border-t border-white/[0.06]" />
        </header>

        {/* ═══════════════════════════════════════════
            SECTION LABEL
           ═══════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-8 rise" style={{ animationDelay: '100ms' }}>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/20">
            SELECT PACK
          </p>
          {isFirstTime && (
            <div className="flex items-center gap-2 border border-green-500/30 px-3 py-1.5 rounded-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="font-mono text-[10px] font-bold text-green-400 uppercase tracking-[0.15em]">
                −{FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100}% FIRST BUY
              </span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            PACKAGE GRID — editorial cards
           ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] rounded-sm overflow-hidden mb-16">
          {DROP_PACKAGES.map((pkg, idx) => {
            const isActive = selected === pkg.id
            const price = isFirstTime ? pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : pkg.naira

            return (
              <div
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`
                  rise relative cursor-pointer transition-colors duration-200
                  ${isActive ? 'bg-white/[0.07]' : 'bg-[#0d0d0d] hover:bg-white/[0.04]'}
                `}
                style={{ animationDelay: `${150 + idx * 80}ms` }}
              >
                <div className="p-7 sm:p-9 flex flex-col min-h-[240px] sm:min-h-[280px]">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-auto">
                    {/* Tag pill */}
                    <div className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-[0.15em] ${TAG_COLORS[pkg.id] || 'bg-white text-black'}`}>
                      {TAG_LABELS[pkg.id] || pkg.name}
                    </div>

                    {/* Selection ring */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${isActive ? 'border-orange-500 bg-orange-500' : 'border-white/15'}
                    `}>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                    </div>
                  </div>

                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute top-7 sm:top-9 right-14 sm:right-16">
                      <span className="font-mono text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] border-b border-orange-500/40 pb-0.5">
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="mt-8">
                    <p className="font-mono text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">
                      {pkg.drops} RIDES
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none mb-1">
                      {pkg.drops} Drops
                    </h3>

                    {/* PRICE — the star of the show */}
                    <div className="flex items-baseline gap-3 mt-4">
                      <span className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">
                        ₦{price.toLocaleString()}
                      </span>
                    </div>
                    {isFirstTime && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-mono text-sm font-bold text-white/20 line-through">
                          ₦{pkg.naira.toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-green-400 border border-green-500/30 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                          SAVE ₦{(pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <p className="font-mono text-[10px] font-bold text-white/15 uppercase tracking-[0.15em] mt-4">
                      ₦{(price / pkg.drops).toFixed(0)} / RIDE
                    </p>
                  </div>
                </div>

                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500" />
                )}
              </div>
            )
          })}
        </div>

        {/* ═══════════════════════════════════════════
            FAQ / INFO — minimal
           ═══════════════════════════════════════════ */}
        <div className="rise grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left" style={{ animationDelay: '500ms' }}>
          {[
            { q: 'Do drops expire?', a: 'Never. Use them anytime.' },
            { q: 'What does 1 Drop cover?', a: 'One full ride booking — the fare is separate.' },
            { q: 'Can I get a refund?', a: 'Unused drops are refundable within 30 days.' },
          ].map((item, i) => (
            <div key={i}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-2">{item.q}</p>
              <p className="text-sm font-medium text-white/50 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STICKY CHECKOUT BAR
         ═══════════════════════════════════════════ */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50 transition-all duration-400 ease-out
        ${selected ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="bg-[#0a0a0a] border-t border-white/[0.08]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center gap-4">
            {selectedPkg && (
              <div className="flex-1 flex items-center gap-4 w-full sm:w-auto">
                <div className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.15em] shrink-0 ${TAG_COLORS[selectedPkg.id]}`}>
                  {TAG_LABELS[selectedPkg.id]}
                </div>
                <div>
                  <p className="text-sm font-bold text-white/60">{selectedPkg.drops} Drops</p>
                  <p className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none">
                    ₦{(isFirstTime ? selectedPkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : selectedPkg.naira).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-xs font-mono font-bold">{error}</p>}

            <button
              onClick={checkout}
              disabled={checking}
              className={`
                w-full sm:w-auto sm:min-w-[240px] py-4 px-8 rounded-sm
                text-sm font-black uppercase tracking-[0.15em]
                flex items-center justify-center gap-3
                transition-all duration-200
                ${checking
                  ? 'bg-white/10 text-white/40 cursor-wait'
                  : 'bg-white text-black hover:bg-orange-500 hover:text-black active:scale-[0.98]'}
              `}
            >
              {checking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING</>
              ) : (
                <>PURCHASE <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          OVERLAYS
         ═══════════════════════════════════════════ */}

      {redirecting && (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center flex-col">
          <div className="w-16 h-16 relative mb-8">
            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <Lock className="absolute inset-0 m-auto w-5 h-5 text-white/60" />
          </div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-white/40">
            REDIRECTING TO PAYSTACK
          </p>
        </div>
      )}

      {celebrating && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-5">
          <div className="bg-[#0d0d0d] border border-white/[0.08] p-10 sm:p-14 max-w-md w-full text-center relative overflow-hidden">

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
              <div className="w-16 h-16 bg-white rounded-sm flex items-center justify-center mx-auto mb-8 scale-in-center">
                <CheckCircle2 className="w-8 h-8 text-black" />
              </div>

              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-3">
                TRANSACTION COMPLETE
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
                +{celebData.drops}
              </h2>
              <p className="text-base text-white/30 font-medium mb-8">
                drops added to your wallet
              </p>

              {celebData.saved && (
                <div className="border border-green-500/30 text-green-400 font-mono text-xs font-bold px-4 py-3 mb-8 uppercase tracking-wider">
                  SAVED ₦{celebData.saved.toLocaleString()} — FIRST PURCHASE DISCOUNT
                </div>
              )}

              <button
                onClick={dismiss}
                className="w-full py-4 bg-white text-black text-sm font-black uppercase tracking-[0.15em] rounded-sm hover:bg-orange-500 active:scale-[0.98] transition-all"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
