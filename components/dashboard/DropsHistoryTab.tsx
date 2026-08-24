import prisma from '@/lib/prisma'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { History, ArrowUpRight, ArrowDownRight, Gift, RefreshCcw } from 'lucide-react'

export async function DropsHistoryTab({ 
  userId, 
  searchParams 
}: { 
  userId: string, 
  searchParams: { filter?: string, page?: string } 
}) {
  const filter = searchParams.filter || 'ALL'
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = 10

  const whereClause: any = { userId }
  if (filter !== 'ALL') {
    whereClause.type = filter
  }

  const [totalItems, transactions] = await Promise.all([
    prisma.dropTransaction.count({ where: whereClause }),
    prisma.dropTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const getTypeConfig = (type: string, amount: number) => {
    switch (type) {
      case 'PURCHASE':
        return { icon: ArrowDownRight, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Purchase' }
      case 'BOOKING':
        return { icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Trip Booking' }
      case 'REFUND':
        return { icon: RefreshCcw, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Refund' }
      case 'GIFT':
        return { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Gift' }
      default:
        return { icon: History, color: 'text-muted-foreground', bg: 'bg-muted/10', label: type }
    }
  }

  return (
    <div id="paginated-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 scroll-mt-24">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PURCHASE', 'BOOKING', 'REFUND', 'GIFT'].map(f => {
          const isActive = filter === f
          return (
            <a
              key={f}
              href={`?tab=history&filter=${f}`}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors ${
                isActive 
                  ? 'bg-orange-brand text-primary-foreground' 
                  : 'bg-surface-elevated text-muted-foreground hover:bg-white/5 border border-border-subtle'
              }`}
            >
              {f}
            </a>
          )
        })}
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center text-center justify-center py-12" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <History className="w-8 h-8 mb-3 opacity-20 text-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {transactions.map((tx, i) => {
            const config = getTypeConfig(tx.type, tx.amount)
            const Icon = config.icon
            const isPositive = tx.amount > 0
            
            return (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-4"
                style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{config.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {tx.package && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 opacity-80">{tx.package}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold ${isPositive ? 'text-green-500' : 'text-foreground'}`}>
                    {isPositive ? '+' : ''}{tx.amount}
                  </p>
                  {tx.nairaAmount && (
                    <p className="text-[10px] text-muted-foreground">₦{tx.nairaAmount.toLocaleString()}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
