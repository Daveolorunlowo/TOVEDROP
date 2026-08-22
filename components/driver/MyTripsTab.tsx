import prisma from '@/lib/prisma'
import { DriverTripListClient } from '@/components/driver/DriverTripListClient'

export async function MyTripsTab({ 
  driverId,
  searchParams
}: { 
  driverId: string
  searchParams: { subtab?: string, page?: string }
}) {
  const subtab = searchParams.subtab || 'upcoming'
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = subtab === 'upcoming' ? 6 : 10

  const statusFilter = subtab === 'upcoming'
    ? { in: ['CONFIRMED'] }
    : { in: ['COMPLETED', 'CANCELLED'] }

  const orderBy = subtab === 'upcoming'
    ? [ { date: 'asc' }, { time: 'asc' } ] as any
    : { createdAt: 'desc' } as any

  const [totalItems, trips] = await Promise.all([
    prisma.trip.count({
      where: { driverId, status: statusFilter }
    }),
    prisma.trip.findMany({
      where: { driverId, status: statusFilter },
      include: { rider: true },
      orderBy,
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <DriverTripListClient 
        initialTrips={trips}
        subtab={subtab as 'upcoming' | 'past'}
        driverId={driverId}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  )
}
