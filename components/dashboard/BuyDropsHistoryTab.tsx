import prisma from '@/lib/prisma'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { PlusCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export async function BuyDropsHistoryTab({ 
  userId,
  searchParams
}: { 
  userId: string
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = 10

  const [totalItems, transactions] = await Promise.all([
    prisma.dropTransaction.count({ where: { userId } }),
    prisma.dropTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div id="paginated-container" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 scroll-mt-24">
      <h3 className="text-xl font-bold mb-4 px-2">Transaction History</h3>
      
      {transactions.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center justify-center py-16 text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <p className="text-sm font-medium text-muted-foreground">No drops transactions found.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {transactions.map((tx, i) => {
            const isPurchase = tx.type === 'PURCHASE'
            const isRefund = tx.type === 'REFUND'
            const isCredit = isPurchase || isRefund

            return (
              <div 
                key={tx.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4"
                style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isPurchase ? 'bg-green-500/10' :
                    isRefund ? 'bg-blue-500/10' : 'bg-red-500/10'
                  }`}>
                    {isPurchase ? <PlusCircle className="w-5 h-5 text-green-500" /> :
                     isRefund ? <ArrowDownRight className="w-5 h-5 text-blue-500" /> : 
                     <ArrowUpRight className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {isPurchase ? `${tx.amount} Drops Package` : (tx.reference || tx.type)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 ml-13 sm:ml-2 mt-2 sm:mt-0 pl-13 sm:pl-0">
                  <p className={`text-sm font-bold ${isCredit ? 'text-green-500' : 'text-foreground'}`}>
                    {isCredit ? '+' : ''}{tx.amount} Drops
                  </p>
                  {isPurchase && tx.nairaAmount && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Paid ₦{tx.nairaAmount.toLocaleString()}
                    </p>
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
