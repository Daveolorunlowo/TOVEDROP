import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BuyDropsClient } from '@/components/dashboard/BuyDropsClient'
import { CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BuyDropsPage() {
 const session = await getServerSession(authOptions)
 const userId = session!.user.id

 const user = await prisma.user.findUnique({
 where: { id: userId }
 })

 if (!user) redirect('/auth')

 return (
 <div className="min-h-screen bg-[#000] text-white selection:bg-orange-500/30 overflow-hidden relative">
   {/* Deep Space Background Effects */}
   <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[150px] rounded-full pointer-events-none" />
   <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
   
   {/* Subtle grid pattern */}
   <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none bg-repeat" />

   <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24 pb-32">
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
       
       {/* Left Column: Value Proposition */}
       <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
           <Sparkles className="w-4 h-4 text-orange-500" />
           <span className="text-xs font-bold uppercase tracking-widest text-[#ccc]">ToveDrop Premium</span>
         </div>
         
         <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
           Fuel Your <br/>
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 drop-shadow-sm">Adventure.</span>
         </h1>
         
         <p className="text-lg md:text-xl text-[#888] font-medium leading-relaxed max-w-md">
           Never get stranded. Stock up on Drops today and secure instant, seamless rides whenever you need them.
         </p>

         <div className="space-y-5 pt-4">
           {[
             { icon: Zap, text: 'Instant priority booking during peak hours', color: 'text-yellow-500' },
             { icon: CheckCircle2, text: '1 Drop = 1 Seamless Ride everywhere', color: 'text-green-500' },
             { icon: Shield, text: 'Zero hidden fees. Secure Paystack checkout', color: 'text-blue-500' },
           ].map((feature, i) => (
             <div key={i} className="flex items-center gap-4 group">
               <div className={`w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors`}>
                 <feature.icon className={`w-5 h-5 ${feature.color}`} />
               </div>
               <span className="text-[#ccc] font-medium text-sm md:text-base">{feature.text}</span>
             </div>
           ))}
         </div>
       </div>

       {/* Right Column: Pricing & Client */}
       <div className="lg:col-span-7 lg:pl-12 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
         <BuyDropsClient 
           initialDropsBalance={user.dropsBalance} 
           isFirstTime={user.hasUsedFirstTopupDiscount === false} 
         />
       </div>

     </div>
   </div>
 </div>
 )
}
