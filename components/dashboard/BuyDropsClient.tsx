"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2, Lock, ChevronLeft } from 'lucide-react'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'

/* ── Count-up hook ── */
function useCountUp(target: number, dur = 900) {
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

/* ── Coin SVG ── */
function Coin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="url(#cg)" />
      <path d="M10 5C10 5 7 9 7 11.5A3 3 0 0013 11.5C13 9 10 5 10 5Z" fill="#fff" opacity=".9" />
      <defs><linearGradient id="cg" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" /><stop offset="1" stopColor="#ea580c" />
      </linearGradient></defs>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════ */

export function BuyDropsClient({
  initialDropsBalance,
  isFirstTime,
}: {
  initialDropsBalance: number
  isFirstTime: boolean
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const [bal, setBal] = useState(initialDropsBalance)
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [redir, setRedir] = useState(false)
  const [celeb, setCeleb] = useState(false)
  const [cData, setCData] = useState<{ drops: number; saved: number | null }>({ drops: 0, saved: null })
  const bursts = useRef<Array<{ x: number; y: number; r: number }>>([])

  useEffect(() => setBal(initialDropsBalance), [initialDropsBalance])

  useEffect(() => {
    if (sp.get('payment') === 'success' && sp.get('added')) {
      const added = parseInt(sp.get('added')!), saved = sp.get('saved')
      bursts.current = Array.from({ length: 14 }).map(() => {
        const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 100
        return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (Math.random() - 0.5) * 720 }
      })
      setCData({ drops: added, saved: saved ? parseInt(saved) : null })
      setCeleb(true)
      setBal(p => p + added)
    }
  }, [sp])

  const dismiss = () => {
    setCeleb(false)
    const p = new URLSearchParams(sp.toString())
    p.delete('payment'); p.delete('added'); p.delete('saved')
    router.replace(`/dashboard/buy-drops?${p.toString()}`, { scroll: false })
    router.refresh()
  }
  useEffect(() => { if (celeb) { const t = setTimeout(dismiss, 7000); return () => clearTimeout(t) } }, [celeb])

  const animBal = useCountUp(bal, 1000)
  const pkg = DROP_PACKAGES.find(p => p.id === sel)

  const buy = async () => {
    if (!sel || busy) return
    setBusy(true); setErr('')
    const pk = DROP_PACKAGES.find(p => p.id === sel)!
    try {
      const r = await fetch('/api/drops/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pk.id, amount: pk.naira }),
      })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setRedir(true)
      setTimeout(() => {
        const s = d.discountApplied ? pk.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE : null
        window.location.href = `/dashboard/buy-drops?payment=success&added=${pk.drops}${s ? '&saved=' + s : ''}`
      }, 1000)
    } catch {
      setErr('Payment failed — please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">

      {/* ─── TOP BAR ─── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <button onClick={() => router.push('/dashboard')} className="text-foreground/40 hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-wide">Buy Drops</h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-8">

        {/* ─── BALANCE CARD ─── */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl p-7 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-foreground/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-foreground/60 text-xs font-semibold uppercase tracking-wider mb-1">Available balance</p>
            <div className="flex items-center gap-3">
              <Coin size={32} />
              <span className="text-5xl font-black tracking-tight">{animBal}</span>
              <span className="text-lg font-bold text-foreground/70 self-end mb-1">drops</span>
            </div>
            <p className="text-foreground/50 text-xs font-medium mt-3">Each drop = 1 ride booking</p>
          </div>
        </div>

        {/* ─── FIRST-TIME BANNER ─── */}
        {isFirstTime && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-green-400">First purchase — {FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100}% off!</p>
              <p className="text-xs text-green-400/60 mt-0.5">Applied automatically to all packs below</p>
            </div>
          </div>
        )}

        {/* ─── PACKAGE LIST ─── */}
        <div className="space-y-3 mb-10">
          {DROP_PACKAGES.map((p) => {
            const active = sel === p.id
            const price = isFirstTime ? p.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : p.naira

            return (
              <button
                key={p.id}
                onClick={() => setSel(p.id)}
                className={`
                  w-full text-left rounded-2xl border p-5 transition-all duration-200
                  ${active
                    ? 'bg-orange-500/10 border-orange-500/40 ring-2 ring-orange-500/20'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Radio */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${active ? 'border-orange-500 bg-orange-500' : 'border-border'}
                    `}>
                      {active && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">{p.drops} Drops</span>
                        {p.badge && (
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-foreground/30 mt-0.5 block">₦{(price / p.drops).toFixed(0)} per ride</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground">₦{price.toLocaleString()}</span>
                    {isFirstTime && (
                      <span className="block text-xs text-foreground/20 line-through mt-0.5">₦{p.naira.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ─── CTA ─── */}
        <div className={`transition-all duration-300 ${sel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          {err && (
            <p className="text-red-400 text-sm font-semibold text-center mb-3">{err}</p>
          )}
          <button
            onClick={buy}
            disabled={busy}
            className={`
              w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2
              transition-all duration-200
              ${busy
                ? 'bg-orange-500/50 text-white/60 cursor-wait'
                : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-lg shadow-orange-500/20'}
            `}
          >
            {busy ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <>Buy {pkg?.drops} Drops for ₦{pkg ? (isFirstTime ? pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : pkg.naira).toLocaleString() : ''} <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
          <p className="text-center text-xs text-foreground/20 mt-3">
            Secure payment via Paystack · Instant activation
          </p>
        </div>

        {/* ─── FAQ ─── */}
        <div className="mt-14 space-y-5 pb-10">
          <h3 className="text-sm font-bold text-foreground/30 uppercase tracking-wider">Common questions</h3>
          {[
            { q: 'Do drops expire?', a: 'No — your drops never expire. Use them whenever you want.' },
            { q: 'What does a drop cover?', a: 'Each drop covers one ride booking fee. The transport fare is paid separately to the driver.' },
            { q: 'Can I get a refund?', a: 'Yes. Unused drops can be refunded within 30 days of purchase.' },
          ].map((item, i) => (
            <div key={i} className="border-b border-border pb-4">
              <p className="text-sm font-semibold text-foreground/60 mb-1">{item.q}</p>
              <p className="text-sm text-foreground/30 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ OVERLAYS ═══ */}

      {redir && (
        <div className="fixed inset-0 bg-background z-[200] flex items-center justify-center flex-col">
          <div className="w-14 h-14 relative mb-6">
            <div className="absolute inset-0 border-2 border-border rounded-full" />
            <div className="absolute inset-0 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <Lock className="absolute inset-0 m-auto w-5 h-5 text-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground/30">Redirecting to Paystack...</p>
        </div>
      )}

      {celeb && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[200] flex items-center justify-center p-5">
          <div className="bg-background border border-white/[0.08] p-8 rounded-3xl max-w-sm w-full text-center relative overflow-hidden">

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
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-1">Payment Successful!</h2>
              <p className="text-sm text-foreground/40 mb-6">
                <strong className="text-orange-500">{cData.drops} Drops</strong> added to your wallet
              </p>
              {cData.saved && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold px-4 py-2.5 rounded-xl mb-6">
                  🎉 Saved ₦{cData.saved.toLocaleString()} with your first-timer discount!
                </div>
              )}
              <button
                onClick={dismiss}
                className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
