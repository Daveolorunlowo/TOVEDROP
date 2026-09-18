import { LiveMap } from '@/components/admin/LiveMap'
import { Users, Car, TrendingUp, CheckCircle, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export async function AdminOverviewTab({ stats, chartData, recentActivity }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and recent activity.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Primary — Revenue */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: 'linear-gradient(to right, transparent, var(--brand-primary), transparent)' }} />
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Platform Revenue</p>
          <p className="text-5xl font-black tabular-nums tracking-tight text-foreground mt-2">
            ₦{stats.platformRevenue.toLocaleString()}
          </p>
        </div>

        {/* Secondary Metrics */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[140px]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Users</p>
              <p className="text-3xl font-black tabular-nums text-foreground">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[140px]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Drivers</p>
              <p className="text-3xl font-black tabular-nums text-foreground">{stats.totalDrivers.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[140px]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Trips</p>
              <p className="text-3xl font-black tabular-nums text-foreground">{stats.completedTrips.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Map */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-card border border-border p-6 h-full">
            <h3 className="text-sm font-bold mb-5 flex items-center gap-3 text-foreground uppercase tracking-[0.12em]">
              <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              </div>
              Live Activity Map
            </h3>
            <div className="h-[360px] rounded-lg overflow-hidden relative border border-border">
              <LiveMap />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-card border border-border p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-5 text-foreground uppercase tracking-[0.12em]">Recent Activity</h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg border border-border bg-surface-elevated flex items-center justify-center shrink-0">
                  {act.type === 'TRIP'
                    ? <Car className="w-3.5 h-3.5 text-muted-foreground" />
                    : <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{act.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{act.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
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
