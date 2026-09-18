import { LiveMap } from '@/components/admin/LiveMap'
import { Card } from '@/components/ui/card'
import { Users, Car, TrendingUp, CheckCircle, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export async function AdminOverviewTab({ stats, chartData, recentActivity }: any) {
 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 
 {/* Top Stats - Hierarchy Refactor */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {/* Primary Metric */}
 <div className="md:col-span-2 rounded-lg border border-border bg-card p-6 flex flex-col justify-end min-h-[140px]">
 <p className="text-sm font-semibold text-muted-foreground mb-2">Platform Revenue</p>
 <p className="text-5xl font-black tabular-nums tracking-tight text-foreground">
 ₦{stats.platformRevenue.toLocaleString()}
 </p>
 </div>
 
 {/* Secondary Metrics */}
 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-end min-h-[140px]">
 <p className="text-xs font-medium text-muted-foreground mb-1">Total Users</p>
 <p className="text-2xl font-bold tabular-nums text-foreground">
 {stats.totalUsers.toLocaleString()}
 </p>
 </div>
 <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-end min-h-[140px]">
 <p className="text-xs font-medium text-muted-foreground mb-1">Active Drivers</p>
 <p className="text-2xl font-bold tabular-nums text-foreground">
 {stats.totalDrivers.toLocaleString()}
 </p>
 </div>
 <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-end min-h-[140px]">
 <p className="text-xs font-medium text-muted-foreground mb-1">Completed Trips</p>
 <p className="text-2xl font-bold tabular-nums text-foreground">
 {stats.completedTrips.toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Live Map */}
 <div className="lg:col-span-2 space-y-4">
 <div className="rounded-xl bg-card border border-border p-6">
 <h3 className="text-base font-bold mb-5 flex items-center gap-3 text-foreground tracking-wide">
 <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
 <Activity className="w-4 h-4 text-green-400 animate-pulse" />
 </div>
 Live Activity Map
 </h3>
 <div className="h-[360px] rounded-xl overflow-hidden relative ring-1 ring-border shadow-inner">
 <LiveMap />
 </div>
 </div>
 </div>

 {/* Recent Activity */}
 <div className="rounded-xl bg-card border border-border p-6 flex flex-col">
 <h3 className="text-base font-bold mb-6 text-foreground tracking-wide relative z-10">Recent Activity</h3>
 <div className="space-y-5 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
 {recentActivity.map((act: any) => (
 <div key={act.id} className="flex items-start gap-4 group cursor-pointer">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-surface-elevated`}>
 {act.type === 'TRIP' ? <Car className="w-5 h-5 text-foreground" /> : <TrendingUp className="w-5 h-5 text-foreground" />}
 </div>
 <div className="flex-1">
 <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{act.title}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{act.desc}</p>
 <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
 {formatDistanceToNow(new Date(act.time), { addSuffix: true })}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )
}


