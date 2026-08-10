"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Plus, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Skeleton } from '@/components/shared/Skeleton'
import { SkeletonTableRow } from '@/components/shared/SkeletonVariants'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'
import './buy-drops.css'

// Shared Drop Coin Icon
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

type Transaction = {
  id: string
  date: string
  description: string
  amount: string
  status: 'Completed' | 'Failed'
}

// --------------------------------------------------------
// Custom Hook for Number Counting Animation
// --------------------------------------------------------
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
      
      // ease-out cubic
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

export default function BuyDropsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loadingUser, setLoadingUser] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [showRedirectOverlay, setShowRedirectOverlay] = useState(false)
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newTxnId, setNewTxnId] = useState<string | null>(null)

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<{ drops: number, saved: number | null }>({ drops: 0, saved: null })
  
  // Coin burst positions
  const burstConfig = useRef<Array<{ x: number, y: number, r: number }>>([])

  useEffect(() => {
    const start = Date.now()
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(async data => {
        if (data.user) {
          setUser(data.user)
          if (data.user.dropTransactions) {
            setTransactions(data.user.dropTransactions.map((dt: any) => ({
              id: dt.id,
              date: new Date(dt.createdAt).toLocaleDateString(),
              description: dt.type === 'PURCHASE' ? `${dt.amount} Drops Package` : dt.type,
              amount: dt.type === 'PURCHASE' && dt.nairaAmount ? `₦${dt.nairaAmount.toLocaleString()}` : `${dt.amount > 0 ? '+' : ''}${dt.amount} Drops`,
              status: 'Completed'
            })))
          }
        }
        const elapsed = Date.now() - start
        if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed))
        setLoadingUser(false)
      })
  }, [])

  // Check for success redirect
  useEffect(() => {
    const payment = searchParams.get('payment')
    const addedStr = searchParams.get('added')
    const savedStr = searchParams.get('saved')
    
    if (payment === 'success' && addedStr && !loadingUser && user) {
      const added = parseInt(addedStr, 10)
      const saved = savedStr ? parseInt(savedStr, 10) : null
      
      // Setup celebration config
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
      
      // Update local balance and fake transaction immediately
      setUser((prev: any) => ({ ...prev, dropsBalance: prev.dropsBalance + added }))
      
      const newTxn: Transaction = {
        id: `txn_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        description: `${added} Drops Package`,
        amount: saved ? `₦${(added * (saved / (added * FIRST_PURCHASE_DISCOUNT_PERCENTAGE)) * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE)).toLocaleString()} (Discounted)` : 'Paid',
        status: 'Completed'
      }
      setTransactions(prev => [newTxn, ...prev])
      setNewTxnId(newTxn.id)
    }
  }, [searchParams, loadingUser, user?.id]) // Added user?.id to ensure we only run when user is fully loaded

  const dismissCelebration = () => {
    setShowCelebration(false)
    // Clean up URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('payment')
    params.delete('added')
    params.delete('saved')
    router.replace(`/dashboard/buy-drops?${params.toString()}`, { scroll: false })
  }

  // Auto-dismiss celebration after 5s
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => dismissCelebration(), 5000)
      return () => clearTimeout(timer)
    }
  }, [showCelebration])

  const animatedBalance = useCountUp(user?.dropsBalance || 0, 800)

  const handleCheckout = async () => {
    if (!selectedPackage || isCheckingOut) return
    setIsCheckingOut(true)
    setCheckoutError('')

    const pkg = DROP_PACKAGES.find(p => p.id === selectedPackage)
    if (!pkg) return

    try {
      // Show redirect overlay after mock API wait
      const res = await fetch('/api/drops/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, amount: pkg.naira })
      })

      if (!res.ok) throw new Error("API failed")
      const data = await res.json()

      // Show transition
      setShowRedirectOverlay(true)
      
      // Mock redirect to Paystack, then back to success
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



  const isFirstTime = user?.hasUsedFirstTopupDiscount === false

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep text-text-primary">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 relative">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Buy Drops</h1>
        <p className="text-text-muted mb-8">Purchase Drops to book rides. 1 Drop = 1 Ride.</p>

        {/* Live Balance Card */}
        {loadingUser ? (
          <div className="mb-10 p-5 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between shadow-sm">
            <div>
              <Skeleton width={100} height={12} className="mb-2" />
              <div className="flex items-center gap-3">
                <Skeleton width={32} height={32} borderRadius="9999px" />
                <Skeleton width={60} height={32} />
              </div>
            </div>
            <div className="text-right">
              <Skeleton width={80} height={14} />
            </div>
          </div>
        ) : (
          <div className={`mb-10 p-5 rounded-2xl bg-surface-card border transition-colors duration-600 ${newTxnId ? 'border-orange-brand/50' : 'border-border-default'} flex items-center justify-between shadow-sm`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Current Balance</p>
              <div className="flex items-center gap-3">
                <DropCoinIcon className="w-8 h-8" />
                <span className="text-3xl font-bold tabular-nums tracking-tight">{animatedBalance}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Ready to ride</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingUser ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 rounded-2xl border border-border-default bg-surface-card h-[160px]">
                  <Skeleton width="40%" height={24} className="mb-4" />
                  <Skeleton width="30%" height={32} className="mb-4" />
                  <Skeleton width="60%" height={24} />
                </div>
              ))
            ) : (
              DROP_PACKAGES.map((pkg, idx) => {
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
                      <div className="absolute -left-2 top-3 animate-badge-slide" style={{ animationDelay: `${idx * 100}ms`, opacity: 0 }}>
                        <div className="bg-orange-brand text-white text-[10px] font-bold uppercase px-3 py-1 rounded-r-full shadow-md relative overflow-hidden">
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]"></div>
                          <span className="relative z-10">{FIRST_PURCHASE_DISCOUNT_PERCENTAGE * 100}% OFF — First Purchase</span>
                        </div>
                      </div>
                    )}

                    <div className={`mt-${isFirstTime ? '6' : '0'}`}>
                      <h3 className="text-xl font-bold text-text-primary mb-1">{pkg.name}</h3>
                      
                      <div className="flex items-end gap-2 mb-4">
                        {isFirstTime ? (
                          <div className="flex flex-col">
                            <span className="text-text-muted text-sm font-medium draw-strikethrough w-fit">
                              ₦{pkg.naira.toLocaleString()}
                            </span>
                            <span className="text-orange-brand text-2xl font-black tracking-tight animate-fade-in-price" style={{ animationDelay: `${(idx * 100) + 300}ms` }}>
                              ₦{discountedPrice.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-black tracking-tight text-text-primary">
                            ₦{pkg.naira.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {Array.from({ length: coins }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`rounded-full bg-surface-card p-0.5 ${isSelected ? 'animate-coin-bounce' : ''}`}
                              style={{ animationDelay: `${i * 40}ms` }}
                            >
                              <DropCoinIcon className="w-5 h-5" />
                            </div>
                          ))}
                        </div>
                        <span className="font-semibold text-lg">{pkg.drops} Drops</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-3 mt-8">
            <button
              onClick={handleCheckout}
              disabled={!selectedPackage || isCheckingOut}
              className={`
                w-full md:w-auto min-w-[240px] py-4 px-8 rounded-xl font-bold text-lg text-white
                flex items-center justify-center gap-2 transition-all duration-200
                active:scale-97
                ${!selectedPackage ? 'bg-border-default text-text-muted cursor-not-allowed' : 'bg-orange-brand shadow-lg hover:bg-orange-dark shadow-orange-brand/20'}
                ${isCheckingOut ? 'opacity-80 cursor-wait' : ''}
              `}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-semibold">Preparing checkout...</span>
                </>
              ) : (
                <>Buy Now <ArrowRight className="w-5 h-5 ml-1" /></>
              )}
            </button>
            {checkoutError && <p className="text-sm text-status-danger font-medium">{checkoutError}</p>}
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Transaction History</h2>
          <div className="bg-surface-card rounded-2xl border border-border-default overflow-hidden">
            {loadingUser ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonTableRow key={i} />)
            ) : (
              transactions.map((txn, i) => (
                <div 
                  key={txn.id} 
                  className={`
                    flex items-center justify-between p-4 border-b border-border-default last:border-b-0
                    ${txn.id === newTxnId ? 'animate-slide-down-fade animate-row-highlight' : ''}
                  `}
                >
                  <div>
                    <p className="font-medium text-text-primary">{txn.description}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${txn.amount.includes('-') ? 'text-text-primary' : (txn.amount.includes('+') ? 'text-status-success' : 'text-text-primary')}`}>
                      {txn.amount}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-1">{txn.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Redirect Overlay */}
      {showRedirectOverlay && (
        <div className="fixed inset-0 z-50 bg-bg-deep flex flex-col items-center justify-center text-text-primary animate-in fade-in duration-200">
          <DropCoinIcon className="w-16 h-16 animate-spin-once mb-6" />
          <p className="font-medium text-lg tracking-tight">Redirecting to secure checkout...</p>
        </div>
      )}

      {/* Success Celebration Overlay */}
      {showCelebration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-bg-deep/92 animate-in fade-in duration-300"
          onClick={dismissCelebration}
        >
          <div 
            className="bg-surface-elevated border border-border-default rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden animate-celebrate-scale shadow-2xl"
            onClick={e => e.stopPropagation()} // Prevent clicking card from dismissing
          >
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="absolute inset-0 w-full h-full text-status-success opacity-20" />
              <DropCoinIcon className="w-12 h-12 relative z-10" />
              
              {/* Confetti Coins */}
              {burstConfig.current.map((cfg, i) => (
                <div 
                  key={i} 
                  className="burst-coin"
                  style={{
                    animation: `burstOut${i} 600ms cubic-bezier(0.25, 1, 0.5, 1) forwards`,
                    animationDelay: '100ms' // slight delay for impact
                  }}
                >
                  <DropCoinIcon className="w-6 h-6 opacity-60" />
                  <style>{`
                    @keyframes burstOut${i} {
                      0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
                      100% { transform: translate(${cfg.x}px, ${cfg.y}px) scale(1) rotate(${cfg.r}deg); opacity: 0; }
                    }
                  `}</style>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Purchase Successful</p>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
              +{useCountUp(celebrationData.drops, 600)} Drops
            </h2>
            <p className="text-text-secondary text-sm font-medium mb-6">
              New balance: {user?.dropsBalance} Drops
            </p>

            {celebrationData.saved && (
              <div className="bg-orange-brand/10 text-orange-brand text-xs font-bold px-4 py-2 rounded-lg mb-8 inline-block border border-orange-brand/20">
                You saved ₦{celebrationData.saved.toLocaleString()} with your first-time discount 🎉
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => router.push('/book')}
                className="w-full bg-purple-brand hover:bg-purple-light text-white font-bold py-3 rounded-xl transition-colors"
              >
                Book a Ride Now →
              </button>
              <button 
                onClick={dismissCelebration}
                className="w-full text-text-muted hover:text-text-primary font-medium text-sm py-2 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
