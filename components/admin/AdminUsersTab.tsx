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
 <div className="space-y-6 animate-in fade-in slide-in- duration-300">
 
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

  {/* Users Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {users.length === 0 ? (
      <div className="col-span-full bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-2">
          <Search className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No riders found</h3>
        <p className="text-sm text-muted-foreground">We couldn't find any riders matching your search criteria.</p>
      </div>
    ) : (
      users.map(user => (
        <div key={user.id} className="flex flex-col bg-card border border-border rounded-xl p-6 transition-all hover:border-primary/50">
          
          {/* Header Info */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-12 h-12 border border-border">
              <AvatarFallback className="text-sm font-bold bg-surface-elevated text-muted-foreground">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{user.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-elevated rounded-lg p-4 flex flex-col justify-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Drops</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{user.dropsBalance}</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 flex flex-col justify-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Rides</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{user._count.tripsAsRider}</p>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="mt-auto pt-4 border-t border-border flex justify-end">
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
              View Details
            </button>
          </div>

        </div>
      ))
    )}
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
