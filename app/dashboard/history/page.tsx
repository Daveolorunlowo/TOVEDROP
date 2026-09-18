import prisma from '@/lib/prisma'
import { History, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'

export default async function DashboardDropsHistory() {
 const session = await getServerSession(authOptions)
 const userId = session!.user.id

 const drops = await prisma.dropTransaction.findMany({
 where: { userId },
 orderBy: { createdAt: 'desc' }
 })

 return (
 <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-20">
 
 <div>
 <h1 className="text-2xl font-bold text-foreground mb-2">Drops History</h1>
 <p className="text-sm text-muted-foreground">View your Drop purchases and usage.</p>
 </div>

 {drops.length === 0 ? (
 <div className="bg-surface-elevated border border-border rounded-xl p-10 text-center">
 <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
 <History className="w-7 h-7 text-primary" />
 </div>
 <h3 className="text-lg font-bold text-foreground mb-2">No history yet</h3>
 <p className="text-sm text-muted-foreground">You haven't made any Drop transactions.</p>
 </div>
 ) : (
 <div className="bg-card border border-border rounded-xl overflow-hidden">
 <div className="divide-y divide-border">
 {drops.map(drop => (
 <div key={drop.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface-elevated transition-colors">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${drop.type === 'PURCHASE' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
 {drop.type === 'PURCHASE' ? (
 <ArrowDownToLine className="w-5 h-5 text-green-500" />
 ) : (
 <ArrowUpFromLine className="w-5 h-5 text-orange-500" />
 )}
 </div>
 <div>
 <p className="text-sm font-bold text-foreground">
 {drop.type === 'PURCHASE' ? 'Drops Purchased' : 'Drops Used'}
 </p>
 <p className="text-xs text-muted-foreground mt-0.5">
 {new Date(drop.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className={`text-base font-bold ${drop.type === 'PURCHASE' ? 'text-green-500' : 'text-foreground'}`}>
 {drop.type === 'PURCHASE' ? '+' : '-'}{drop.amount}
 </p>
 <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
 {drop.status}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )
}
