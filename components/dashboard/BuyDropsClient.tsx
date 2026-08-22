"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Plus, ArrowRight, CheckCircle2 } from 'lucide-react'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'
import '@/app/dashboard/buy-drops/buy-drops.css'

function DropCoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="url(#bdc_buy)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
      <defs>
        <linearGradient id="bdc_buy" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--orange-brand, #F97316)" />
          <stop offset="100%" stopColor="var(--orange-brand, #F97316)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const getCoinsForDrops = (drops: number) => {
  if (drops <= 10) return 3
  if (drops <= 20) return 4
  if (drops <= 50) return 5
  return 6
}

function useCountUp(target: number, duration: number = 600) {
  const [current, setCurrent] = useState(target)
  const previousRef = useRef(target)
  
  useEffect(() => {
    if (previousRef.current === target) return

    const startValue = previousRef.current
    const endValue = target
    const startTime = performance.now()
    
    let reqId: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.floor(startValue + (endValue - startValue) * easeProgress))
      
      if (progress < 1) {
        reqId = requestAnimationFrame(tick)
      } else {
        setCurrent(endValue)
        previousRef.current = endValue
      }
    }
    
    reqId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(reqId)
  }, [target, duration])

  return current
}

export function BuyDropsClient({
  initialDropsBalance,
  isFirstTime
}: {
  initialDropsBalance: number
  isFirstTime: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [dropsBalance, setDropsBalance] = useState(initialDropsBalance)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [showRedirectOverlay, setShowRedirectOverlay] = useState(false)
  
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<{ drops: number, saved: number | null }>({ drops: 0, saved: null })
  const burstConfig = useRef<Array<{ x: number, y: number, r: number }>>([])

  useEffect(() => {
    const payment = searchParams.get('payment')
    const addedStr = searchParams.get('added')
    const savedStr = searchParams.get('saved')
    
    if (payment === 'success' && addedStr) {
      const added = parseInt(addedStr, 10)
      const saved = savedStr ? parseInt(savedStr, 10) : null
      
      burstConfig.current = Array.from({ length: 8 }).map(() => {
        const angle = Math.random() * Math.PI * 2
        const distance = 80 + Math.random() * 60
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          r: (Math.random() - 0.5) * 360
        }
      })
      
      setCelebrationData({ drops: added, saved })
      setShowCelebration(true)
      
      setDropsBalance(prev => prev + added)
    }
  }, [searchParams])

  const dismissCelebration = () => {
    setShowCelebration(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('payment')
    params.delete('added')
    params.delete('saved')
    router.replace(`/dashboard/buy-drops?${params.toString()}`, { scroll: false })
    router.refresh()
  }

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => dismissCelebration(), 5000)
      return () => clearTimeout(timer)
    }
  }, [showCelebration])

  const animatedBalance = useCountUp(dropsBalance, 800)

  const handleCheckout = async () => {
    if (!selectedPackage || isCheckingOut) return
    setIsCheckingOut(true)
    setCheckoutError('')

    const pkg = DROP_PACKAGES.find(p => p.id === selectedPackage)
    if (!pkg) return

    try {
      const res = await fetch('/api/drops/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, amount: pkg.naira })
      })

      if (!res.ok) throw new Error("API failed")
      const data = await res.json()

      setShowRedirectOverlay(true)
      
      setTimeout(() => {
        let savedAmount = null
        if (data.discountApplied) {
          savedAmount = pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE
        }
        window.location.href = `/dashboard/buy-drops?payment=success&added=${pkg.drops}${savedAmount ? '&saved='+savedAmount : ''}`
      }, 800)

    } catch (err) {
      setCheckoutError("Couldn't start checkout. Please try again.")
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 relative">

      {/* Live Balance Card */}
      <div className={`mb-10 p-5 rounded-2xl bg-surface-card border transition-colors duration-600 ${showCelebration ? 'border-orange-brand/50' : 'border-border-default'} flex items-center justify-between shadow-sm`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Current Balance</p>
          <div className="flex items-center gap-3">
            <DropCoinIcon className="w-8 h-8" />
            <span className="text-3xl font-bold tabular-nums tracking-tight">{animatedBalance}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-secondary">Ready to ride</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DROP_PACKAGES.map((pkg, idx) => {
            const isSelected = selectedPackage === pkg.id
            const discountedPrice = isFirstTime ? pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : pkg.naira
            const coins = getCoinsForDrops(pkg.drops)
            
            return (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`
                  relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                  ${isSelected ? 'border-purple-brand bg-surface-elevated ring-1 ring-purple-brand/50 z-10' : 'border-border-default bg-surface-card hover:bg-surface-elevated/50'}
                  ${selectedPackage && !isSelected ? 'opacity-60 scale-95' : 'scale-100'}
                `}
                style={{ transform: isSelected ? 'scale(1.02)' : undefined }}
              >
                {/* Popular Badge */}
                {pkg.badge && (
                  <div className="absolute top-0 right-0 bg-purple-brand/20 text-purple-light text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    {pkg.badge}
                  </div>
                )}

                {/* First Time Badge */}
                {isFirstTime && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                    First Time - {(FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100)}% OFF
                  </div>
                )}
                
                <div className="flex items-start justify-between relative z-10 mt-2">
                  <div>
                    <h3 className="text-lg font-extrabold flex items-center gap-2">
                      {pkg.drops} Drops
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm text-muted">₦{discountedPrice.toLocaleString()}</p>
                      {isFirstTime && <p className="text-xs text-secondary/60 line-through">₦{pkg.naira.toLocaleString()}</p>}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'bg-purple-brand border-purple-brand' : 'border-border-default bg-transparent'}`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Visual coin representation */}
                <div className="absolute -bottom-6 right-2 flex -space-x-4 opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none">
                  {Array.from({ length: coins }).map((_, i) => (
                    <DropCoinIcon key={i} className="w-12 h-12 relative" style={{ zIndex: coins - i, transform: `translateY(${i * 2}px)` }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {selectedPackage && (
          <div className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {checkoutError && (
              <p className="text-red-500 text-sm mb-4 text-center font-medium">{checkoutError}</p>
            )}
            
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`
                w-full py-4 rounded-xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden
                ${isCheckingOut ? 'bg-orange-brand/80 text-white/90 scale-[0.98]' : 'bg-orange-brand text-white hover:brightness-110 active:scale-[0.98] hover:shadow-orange-brand/20'}
              `}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Payment <ArrowRight className="w-5 h-5" />
                </>
              )}

              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-shimmer" />
            </button>
            <p className="text-center text-xs text-secondary mt-4 flex items-center justify-center gap-1.5">
              Secure payment via Paystack <span className="opacity-50">•</span> Cancel anytime
            </p>
          </div>
        )}
      </div>

      {/* Redirect Overlay */}
      {showRedirectOverlay && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center flex-col animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 animate-spin text-orange-brand mb-4" />
          <h2 className="text-xl font-bold">Redirecting to Paystack...</h2>
          <p className="text-sm text-secondary mt-2">Please wait while we secure your session.</p>
        </div>
      )}

      {/* Success Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-surface-elevated border border-orange-brand/30 p-8 rounded-3xl max-w-sm w-full mx-5 text-center shadow-2xl relative overflow-hidden">
            
            {/* Confetti / Burst elements */}
            {burstConfig.current.map((conf, i) => (
              <div 
                key={i}
                className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-orange-brand"
                style={{
                  '--tx': `${conf.x}px`,
                  '--ty': `${conf.y}px`,
                  '--tr': `${conf.r}deg`,
                  animation: `burst 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
                  transform: `translate(-50%, -50%)`,
                } as React.CSSProperties}
              />
            ))}

            <div className="relative z-10">
              <div className="w-20 h-20 bg-orange-brand/20 rounded-full flex items-center justify-center mx-auto mb-6 scale-in-center">
                <CheckCircle2 className="w-10 h-10 text-orange-brand" />
              </div>
              <h2 className="text-2xl font-black mb-2">Payment Successful!</h2>
              <p className="text-lg text-secondary mb-6">
                You added <strong className="text-white">{celebrationData.drops} Drops</strong> to your account.
              </p>
              
              {celebrationData.saved && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2 mb-6">
                  🎉 You saved ₦{celebrationData.saved.toLocaleString()} on your first purchase!
                </div>
              )}

              <button 
                onClick={dismissCelebration}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors"
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
