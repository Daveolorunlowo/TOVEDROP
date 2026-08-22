import prisma from '@/lib/prisma'
import { RequestsListClient } from '@/components/driver/RequestsListClient'

export async function RequestsTab({ 
  userId,
  searchParams
}: { 
  userId: string
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = 6

  // Fetch pending trips (available for anyone to accept)
  const [totalItems, pendingTrips] = await Promise.all([
    prisma.trip.count({
      where: { status: "PENDING" }
    }),
    prisma.trip.findMany({
      where: { status: "PENDING" },
      include: { rider: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div id="paginated-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 scroll-mt-24">
      <RequestsListClient 
        initialRequests={pendingTrips}
        driverId={userId}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  )
}
