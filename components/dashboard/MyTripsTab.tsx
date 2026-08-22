import Link from 'next/link'
import prisma from '@/lib/prisma'
import { TripListClient } from '@/components/dashboard/TripListClient'
import { PaginationControls } from '@/components/shared/PaginationControls'

export async function MyTripsTab({ 
  userId, 
  searchParams 
}: { 
  userId: string, 
  searchParams: { subtab?: string, page?: string } 
}) {
  const subtab = searchParams.subtab || 'upcoming'
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = 8

  // Define filters based on subtab
  const statusFilter = subtab === 'upcoming' 
    ? { in: ['PENDING', 'CONFIRMED'] }
    : { in: ['COMPLETED', 'CANCELLED'] }

  const orderBy = subtab === 'upcoming'
    ? [ { date: 'asc' }, { time: 'asc' } ] as any
    : { createdAt: 'desc' } as any

  // Fetch paginated trips
  const [totalItems, trips] = await Promise.all([
    prisma.trip.count({
      where: { riderId: userId, status: statusFilter }
    }),
    prisma.trip.findMany({
      where: { riderId: userId, status: statusFilter },
      include: { 
        driver: { include: { driverProfile: true } }, 
        review: true 
      },
      orderBy,
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div id="paginated-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 scroll-mt-24">
      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-surface-elevated rounded-lg border border-border-subtle max-w-[300px]">
        <Link 
          href="?tab=trips&subtab=upcoming" 
          scroll={false}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors ${
            subtab === 'upcoming' ? 'bg-orange-brand text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming
        </Link>
        <Link 
          href="?tab=trips&subtab=past" 
          scroll={false}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors ${
            subtab === 'past' ? 'bg-orange-brand text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Past
        </Link>
      </div>

      <TripListClient 
        initialTrips={trips} 
        subtab={subtab as 'upcoming' | 'past'} 
        userId={userId} 
      />

      {totalItems > 0 && (
        <PaginationControls 
          currentPage={page} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  )
}
