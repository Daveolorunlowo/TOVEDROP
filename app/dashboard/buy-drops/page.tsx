import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BuyDropsClient } from '@/components/dashboard/BuyDropsClient'

export const dynamic = 'force-dynamic'

export default async function BuyDropsPage() {
 const session = await getServerSession(authOptions)
 const userId = session!.user.id

 const user = await prisma.user.findUnique({
 where: { id: userId }
 })

 if (!user) redirect('/auth')

 return (
 <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20 relative">
 {/* Attractive Background Glow */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full" />

 <div className="text-center relative z-10 pt-4">
 <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4 drop-shadow-sm">Fuel Your Next Adventure</h1>
 <p className="text-base text-white/70 max-w-lg mx-auto">
 Never get stranded. Stock up on Drops today and secure instant rides whenever you need them. 1 Drop = 1 seamless Ride.
 </p>
 </div>

 <BuyDropsClient 
 initialDropsBalance={user.dropsBalance} 
 isFirstTime={user.hasUsedFirstTopupDiscount === false} 
 />
 </div>
 )
}
