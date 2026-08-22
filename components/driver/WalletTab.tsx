import prisma from '@/lib/prisma'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Wallet, ArrowDownRight, ArrowUpRight, PlusCircle, AlertCircle } from 'lucide-react'

export async function WalletTab({ 
  driverId,
  searchParams
}: { 
  driverId: string
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = 10

  const [totalItems, transactions, driverProfile] = await Promise.all([
    prisma.walletTransaction.count({ where: { driverId } }),
    prisma.walletTransaction.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.driverProfile.findUnique({ where: { id: driverId }, select: { walletBalance: true } })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div id="paginated-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 scroll-mt-24">
      {/* Wallet Balance Overview */}
      <div className="bg-surface-elevated border border-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Available Balance</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-foreground">₦{driverProfile?.walletBalance.toLocaleString() ?? '0'}</span>
          </div>
        </div>
        
        <button className="px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-brand text-primary-foreground hover:brightness-110 shadow-sm transition-all whitespace-nowrap">
          Request Withdrawal
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-4">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="rounded-xl flex flex-col items-center justify-center py-16 text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
            <Wallet className="w-12 h-12 mb-4 opacity-20 text-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No transactions yet.</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">Complete rides to start earning.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {transactions.map((tx, i) => {
              const isCredit = tx.amount > 0
              return (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'RIDE_EARNING' ? 'bg-green-500/10' :
                      tx.type === 'WITHDRAWAL' ? 'bg-red-500/10' : 'bg-blue-500/10'
                    }`}>
                      {tx.type === 'RIDE_EARNING' ? <ArrowDownRight className="w-5 h-5 text-green-500" /> :
                       tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="w-5 h-5 text-red-500" /> : 
                       <PlusCircle className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {tx.type === 'RIDE_EARNING' ? 'Ride Earning' :
                         tx.type === 'WITHDRAWAL' ? 'Withdrawal' : 'Adjustment'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[180px] sm:max-w-md truncate">
                        {tx.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-500' : 'text-foreground'}`}>
                      {isCredit ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
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
    </div>
  )
}
