"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react'
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from '@/lib/config'
import '@/app/dashboard/buy-drops/buy-drops.css'

function DropCoinIcon({ className = "" }: { className?: string }) {
 return (
 <svg className={className} width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
 <circle cx="10" cy="10" r="9" fill="url(#bdc_buy)" />
 <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
 <defs>
 <linearGradient id="bdc_buy" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
 <stop offset="0%" stopColor="#f97316" />
 <stop offset="100%" stopColor="#ea580c" />
 </linearGradient>
 </defs>
 </svg>
 )
}

function useCountUp(target: number, duration: number = 800) {
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

 useEffect(() => { setDropsBalance(initialDropsBalance) }, [initialDropsBalance])

 useEffect(() => {
 const payment = searchParams.get('payment')
 const addedStr = searchParams.get('added')
 const savedStr = searchParams.get('saved')
 
 if (payment === 'success' && addedStr) {
 const added = parseInt(addedStr, 10)
 const saved = savedStr ? parseInt(savedStr, 10) : null
 
 burstConfig.current = Array.from({ length: 12 }).map(() => {
 const angle = Math.random() * Math.PI * 2
 const distance = 100 + Math.random() * 80
 return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, r: (Math.random() - 0.5) * 360 }
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
 const timer = setTimeout(() => dismissCelebration(), 6000)
 return () => clearTimeout(timer)
 }
 }, [showCelebration])

 const animatedBalance = useCountUp(dropsBalance, 1000)

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
 if (data.discountApplied) { savedAmount = pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE }
 window.location.href = `/dashboard/buy-drops?payment=success&added=${pkg.drops}${savedAmount ? '&saved='+savedAmount : ''}`
 }, 800)

 } catch (err) {
 setCheckoutError("Transaction failed. Please try again.")
 setIsCheckingOut(false)
 }
 }

 return (
 <div className="relative">

 {/* Elite Wallet Card */}
 <div className={`relative w-full rounded-3xl p-8 mb-10 overflow-hidden border transition-all duration-700
   ${showCelebration ? 'bg-gradient-to-br from-orange-500/20 to-orange-900/20 border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.3)]' : 'bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] border-white/10 shadow-2xl'}
 `}>
   {/* Internal Glows */}
   <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
   <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
   
   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
     <div>
       <div className="flex items-center gap-2 mb-3">
         <ShieldCheck className="w-4 h-4 text-[#888]" />
         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#888]">ToveDrop Wallet</p>
       </div>
       <div className="flex items-center gap-4">
         <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
           <div className="w-full h-full bg-[#111] rounded-[14px] flex items-center justify-center">
             <DropCoinIcon className="w-8 h-8 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
           </div>
         </div>
         <div className="flex flex-col">
           <span className="text-5xl md:text-6xl font-black text-white tabular-nums tracking-tighter leading-none">{animatedBalance}</span>
           <span className="text-sm font-semibold text-orange-400 tracking-wide mt-1">Available Drops</span>
         </div>
       </div>
     </div>
     
     <div className="md:text-right">
       <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
         <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
         <span className="text-xs font-bold text-[#ccc] tracking-wide">Ready for Bookings</span>
       </div>
     </div>
   </div>
 </div>

 {/* Pricing Packages Grid */}
 <div className="space-y-4">
   <div className="flex items-center justify-between mb-2">
     <h3 className="text-sm font-black uppercase tracking-widest text-[#888]">Select a Package</h3>
     {isFirstTime && (
       <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-black uppercase px-3 py-1 rounded-full">
         First Time Discount Active
       </span>
     )}
   </div>
   
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
     {DROP_PACKAGES.map((pkg) => {
       const isSelected = selectedPackage === pkg.id
       const discountedPrice = isFirstTime ? pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE) : pkg.naira
       
       return (
         <div 
           key={pkg.id}
           onClick={() => setSelectedPackage(pkg.id)}
           className={`
             relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden group
             ${isSelected ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50' : 'border-white/10 bg-[#111] hover:bg-[#161616] hover:border-white/20'}
             ${selectedPackage && !isSelected ? 'opacity-50 scale-[0.98] grayscale-[30%]' : 'scale-100'}
           `}
         >
           {/* Package Badges */}
           {pkg.badge && (
             <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-600 to-orange-400 text-black text-[9px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-bl-2xl shadow-lg z-20">
               {pkg.badge}
             </div>
           )}

           <div className="relative z-10 flex flex-col h-full">
             <div className="flex justify-between items-start mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-[#888] group-hover:text-white'}`}>
                 <DropCoinIcon className="w-6 h-6" />
               </div>
               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 border-orange-500 scale-110' : 'border-white/20 bg-[#0a0a0a]'}`}>
                 {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
               </div>
             </div>
             
             <div className="mt-auto">
               <h3 className={`text-2xl font-black tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-[#eee]'}`}>
                 {pkg.drops} Drops
               </h3>
               <div className="mt-2 flex items-end gap-2">
                 <span className="text-3xl font-black text-white tracking-tighter">₦{discountedPrice.toLocaleString()}</span>
                 {isFirstTime && <span className="text-sm font-bold text-[#666] line-through mb-1">₦{pkg.naira.toLocaleString()}</span>}
               </div>
               
               <p className="text-xs font-semibold text-[#888] mt-3 uppercase tracking-wider">
                 {(pkg.naira / pkg.drops).toFixed(0)} NGN / Drop
               </p>
             </div>
           </div>

           {/* Subtle glow effect on hover */}
           <div className={`absolute inset-0 bg-gradient-to-tr from-orange-500/0 via-orange-500/0 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isSelected ? 'opacity-100' : ''}`} />
         </div>
       )
     })}
   </div>
 </div>

 {/* Action Area */}
 <div className={`transition-all duration-500 overflow-hidden ${selectedPackage ? 'max-h-64 opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
   {checkoutError && (
     <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold px-4 py-3 rounded-xl mb-4 text-center">
       {checkoutError}
     </div>
   )}
   
   <button
     onClick={handleCheckout}
     disabled={isCheckingOut}
     className={`
       w-full py-5 rounded-2xl text-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden group
       ${isCheckingOut ? 'bg-orange-600/80 text-white cursor-wait scale-[0.99]' : 'bg-white text-black hover:bg-gray-100 active:scale-[0.99] shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]'}
     `}
   >
     {isCheckingOut ? (
       <>
         <Loader2 className="w-6 h-6 animate-spin" />
         Processing Security...
       </>
     ) : (
       <>
         <CreditCard className="w-6 h-6" />
         Complete Purchase
         <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
       </>
     )}
   </button>
   <div className="flex items-center justify-center gap-4 mt-5 opacity-60">
     <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
       <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encryption
     </div>
     <div className="w-1 h-1 rounded-full bg-white/20" />
     <div className="text-[10px] font-bold uppercase tracking-widest text-white">
       Powered by Paystack
     </div>
   </div>
 </div>

 {/* Overlays */}
 {showRedirectOverlay && (
   <div className="fixed inset-0 bg-[#000]/90 backdrop-blur-xl z-[100] flex items-center justify-center flex-col animate-in fade-in duration-500">
     <div className="w-24 h-24 relative mb-8">
       <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
       <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
       <ShieldCheck className="absolute inset-0 m-auto w-8 h-8 text-orange-500" />
     </div>
     <h2 className="text-3xl font-black text-white tracking-tight mb-3">Securing Session</h2>
     <p className="text-sm font-semibold text-[#888] uppercase tracking-widest">Handing off to Paystack Gateway...</p>
   </div>
 )}

 {showCelebration && (
   <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-2xl z-[100] flex items-center justify-center animate-in fade-in duration-500">
     <div className="bg-[#111] border border-white/10 p-10 rounded-[2rem] max-w-md w-full mx-5 text-center shadow-[0_0_100px_rgba(249,115,22,0.2)] relative overflow-hidden">
       
       <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/20 blur-[80px] rounded-full pointer-events-none" />
       
       {burstConfig.current.map((conf, i) => (
         <div 
           key={i}
           className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
           style={{
             '--tx': `${conf.x}px`,
             '--ty': `${conf.y}px`,
             '--tr': `${conf.r}deg`,
             animation: `burst 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
             transform: `translate(-50%, -50%)`,
           } as React.CSSProperties}
         />
       ))}

       <div className="relative z-10">
         <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-green-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-in-center">
           <CheckCircle2 className="w-12 h-12 text-black" />
         </div>
         <h2 className="text-4xl font-black text-white tracking-tight mb-3">Transaction Complete</h2>
         <p className="text-lg text-[#888] font-medium mb-8">
           Successfully secured <strong className="text-orange-500">{celebrationData.drops} Drops</strong>
         </p>
         
         {celebrationData.saved && (
           <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold px-5 py-3 rounded-xl inline-flex items-center justify-center gap-2 mb-8 w-full">
             🎉 You saved ₦{celebrationData.saved.toLocaleString()} on your first top-up!
           </div>
         )}

         <button 
           onClick={dismissCelebration}
           className="w-full py-4 bg-white text-black text-lg font-black uppercase tracking-wider rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
         >
           Access Drops
         </button>
       </div>
     </div>
   </div>
 )}
 </div>
 )
}
