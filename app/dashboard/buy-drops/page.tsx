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
    <BuyDropsClient
      initialDropsBalance={user.dropsBalance}
      isFirstTime={user.hasUsedFirstTopupDiscount === false}
    />
  )
}
