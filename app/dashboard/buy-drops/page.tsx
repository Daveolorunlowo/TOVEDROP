import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BuyDropsClient } from '@/components/dashboard/BuyDropsClient'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function BuyDropsFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-orange-brand mb-3" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loading drops...</p>
    </div>
  )
}

export default async function BuyDropsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth')
  }

  const userId = session.user.id || (session.user.email ? (await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  }))?.id : null)

  if (!userId) {
    redirect('/auth')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) redirect('/auth')

  return (
    <Suspense fallback={<BuyDropsFallback />}>
      <BuyDropsClient
        initialDropsBalance={user.dropsBalance ?? 0}
        isFirstTime={user.hasUsedFirstTopupDiscount === false}
      />
    </Suspense>
  )
}
