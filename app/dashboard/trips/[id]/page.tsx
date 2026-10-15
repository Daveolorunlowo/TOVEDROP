import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TripLiveClient } from './TripLiveClient'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      }
    }
  })

  if (!trip) redirect('/dashboard')

  const isRider = trip.riderId === session.user.id
  const isDriver = trip.driverId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'

  if (isDriver && !isRider) {
    redirect(`/driver/trips/${tripId}`)
  }

  if (!isRider && !isDriver && !isAdmin) {
    redirect('/dashboard')
  }

  return (
    <TripLiveClient
      initialTrip={trip}
      currentUserId={session.user.id}
    />
  )
}
