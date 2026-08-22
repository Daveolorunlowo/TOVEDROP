import prisma from '@/lib/prisma'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search } from 'lucide-react'
import { initials } from '@/lib/utils'

export async function AdminUsersTab({ searchParams }: { searchParams: { page?: string, q?: string } }) {
  const page = parseInt(searchParams.page || '1', 10)
  const q = searchParams.q || ''
  const itemsPerPage = 10

  const where = {
    role: 'RIDER',
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    } : {})
  }

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where: where as any }),
    prisma.user.findMany({
      where: where as any,
      orderBy: { id: 'desc' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      select: {
        id: true, name: true, email: true, dropsBalance: true, _count: { select: { tripsAsRider: true } }
      }
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Riders ({totalItems})</h2>
          <p className="text-sm text-muted-foreground">Manage and view all rider accounts.</p>
        </div>
        <form className="relative w-full sm:w-72">
          <input type="hidden" name="tab" value="users" />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            name="q" 
            defaultValue={q}
            placeholder="Search riders by name or email..." 
            className="w-full bg-surface-card border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-orange-brand transition-colors"
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-elevated/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border-default">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold">Drops Balance</th>
                <th className="px-6 py-4 font-semibold">Total Rides</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No riders found matching your search.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-[10px] font-bold bg-surface-elevated text-muted-foreground">
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {/* CreatedAt not available in schema, default to Unknown */}
                      Unknown
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {user.dropsBalance} Drops
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user._count.tripsAsRider}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-semibold text-orange-brand hover:underline">
                        View Details
                      </button>
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
