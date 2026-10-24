import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TripLiveClient } from '@/app/dashboard/trips/[id]/TripLiveClient'

export default async function DriverTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  const tripId = (await params).id
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phoneNumber: true
        }
      },
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phoneNumber: true,
          driverProfile: true
        }
      },
      messages: {
        orderBy: { createdAt: 'asc' }
      },
      tripReminders: {
        where: { driverId: session.user.id, sent: false },
        orderBy: { remindAt: 'asc' }
      }
    }
  })

  if (!trip) redirect('/driver')

  const isDriver = trip.driverId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'

  // Only the assigned driver or admin can access this driver trip view
  if (!isDriver && !isAdmin) {
    redirect('/driver')
  }

  return (
    <TripLiveClient
      initialTrip={trip}
      currentUserId={session.user.id}
    />
  )
}
