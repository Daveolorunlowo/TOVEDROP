import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { TransferAcceptClient } from '@/components/driver/TransferAcceptClient'

export default async function TransferAcceptPage({ params }: { params: { shareToken: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect(`/auth?intent=transfer&token=${params.shareToken}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { driverProfile: true }
  })

  if (!user || user.role !== 'DRIVER' || user.driverProfile?.status !== 'APPROVED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Driver Access Only</h1>
          <p className="text-muted-foreground">This link is for approved TOVEDROP drivers only. If you'd like to become a driver, apply from your dashboard.</p>
        </div>
      </div>
    )
  }

  const transfer = await prisma.tripTransfer.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      trip: {
        include: { rider: { select: { name: true } } }
      },
      fromDriver: {
        select: { name: true }
      }
    }
  })

  if (!transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold mb-2 text-red-500">Link Invalid</h1>
          <p className="text-muted-foreground">This transfer link does not exist.</p>
        </div>
      </div>
    )
  }

  if (transfer.fromDriverId === user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold mb-2">Your Transfer</h1>
          <p className="text-muted-foreground">You cannot accept your own transfer. Please wait for another driver to accept it.</p>
        </div>
      </div>
    )
  }

  if (transfer.status !== 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold mb-2">Already Accepted</h1>
          <p className="text-muted-foreground">This trip has already been accepted by another driver or was cancelled.</p>
        </div>
      </div>
    )
  }

  if (new Date() > transfer.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold mb-2 text-amber-500">Link Expired</h1>
          <p className="text-muted-foreground">This transfer link has expired and is no longer available.</p>
        </div>
      </div>
    )
  }

  return <TransferAcceptClient transfer={transfer} />
}
