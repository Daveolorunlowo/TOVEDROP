import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { Footer } from '@/components/footer'
import { DashboardTabs } from '@/components/dashboard/Tabs'
import { BuyDropsClient } from '@/components/dashboard/BuyDropsClient'
import { BuyDropsHistoryTab } from '@/components/dashboard/BuyDropsHistoryTab'

export default async function BuyDropsPage({ 
  searchParams 
}: { 
  searchParams: { tab?: string, page?: string } 
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) redirect('/auth')

  const tab = searchParams.tab || 'buy'

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep text-primary">
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 relative">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Buy Drops</h1>
        <p className="text-muted mb-8">Purchase Drops to book rides. 1 Drop = 1 Ride.</p>

        {/* Custom tabs logic since Buy Drops uses different tabs than Dashboard */}
        <DashboardTabs 
          tabs={[
            { id: 'buy', label: 'Buy Drops' },
            { id: 'history', label: 'History' }
          ]} 
          storageKey="tovedrop_buy_drops_last_tab"
          defaultTab="buy"
        />

        <div className="mt-8">
          <Suspense fallback={
            <div className="py-10 flex flex-col gap-4">
              <div className="h-32 bg-muted/10 animate-pulse rounded-xl" />
              <div className="h-32 bg-muted/10 animate-pulse rounded-xl" />
            </div>
          } key={tab + (searchParams.page || '')}>
            {tab === 'buy' && (
              <BuyDropsClient 
                initialDropsBalance={user.dropsBalance} 
                isFirstTime={user.hasUsedFirstTopupDiscount === false} 
              />
            )}
            {tab === 'history' && (
              <BuyDropsHistoryTab userId={user.id} searchParams={searchParams} />
            )}
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
