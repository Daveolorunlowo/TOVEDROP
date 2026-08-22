import prisma from '@/lib/prisma'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, CheckCircle, XCircle } from 'lucide-react'
import { initials } from '@/lib/utils'
import { StatusChip } from '@/components/admin/StatusChip'
import { DriverActionsClient } from '@/components/admin/DriverActionsClient'

export async function AdminDriversTab({ searchParams }: { searchParams: { page?: string, q?: string, status?: string } }) {
  const page = parseInt(searchParams.page || '1', 10)
  const q = searchParams.q || ''
  const status = searchParams.status || 'all'
  const itemsPerPage = 10

  const where = {
    ...(q ? {
      user: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ]
      }
    } : {}),
    ...(status !== 'all' ? { status: status.toUpperCase() } : {})
  }

  const [totalItems, drivers] = await Promise.all([
    prisma.driverProfile.count({ where: where as any }),
    prisma.driverProfile.findMany({
      where: where as any,
      orderBy: { id: 'desc' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        user: { select: { name: true, email: true } }
      }
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Drivers ({totalItems})</h2>
          <p className="text-sm text-muted-foreground">Manage approvals, suspensions, and driver details.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <form className="flex gap-2 w-full">
            <input type="hidden" name="tab" value="drivers" />
            <select 
              name="status" 
              defaultValue={status}
              className="bg-surface-card border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-brand transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                name="q" 
                defaultValue={q}
                placeholder="Search drivers..." 
                className="w-full bg-surface-card border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-orange-brand transition-colors"
              />
            </div>
            <button type="submit" className="hidden">Submit</button>
          </form>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-elevated/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border-default">
              <tr>
                <th className="px-6 py-4 font-semibold">Driver</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Total Rides</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No drivers found matching your criteria.
                  </td>
                </tr>
              ) : (
                drivers.map(driver => (
                  <tr key={driver.userId} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-[10px] font-bold bg-surface-elevated text-muted-foreground">
                            {initials(driver.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{driver.user.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={driver.status.toLowerCase()} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{driver.vehicleMake} {driver.vehicleModel}</p>
                      <p className="text-xs text-muted-foreground uppercase">{driver.vehiclePlate}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {driver.totalTrips}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DriverActionsClient driverId={driver.userId} status={driver.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
