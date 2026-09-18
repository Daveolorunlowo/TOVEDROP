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
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Buy Drops</h1>
        <p className="text-sm text-muted-foreground">Purchase Drops to book rides. 1 Drop = 1 Ride.</p>
      </div>

      <BuyDropsClient 
        initialDropsBalance={user.dropsBalance} 
        isFirstTime={user.hasUsedFirstTopupDiscount === false} 
      />
    </div>
  )
}
