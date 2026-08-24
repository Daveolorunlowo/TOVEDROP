import { LiveMap } from '@/components/admin/LiveMap'
import { Card } from '@/components/ui/card'
import { Users, Car, TrendingUp, CheckCircle, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export async function AdminOverviewTab({ stats, chartData, recentActivity }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-muted-foreground" />} />
        <StatCard title="Active Drivers" value={stats.totalDrivers} icon={<Car className="w-5 h-5 text-muted-foreground" />} />
        <StatCard title="Completed Trips" value={stats.completedTrips} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
        <StatCard title="Platform Revenue" value={`₦${stats.platformRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-orange-brand" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-card border border-border shadow-sm p-6">
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
        <div className="rounded-xl bg-card border border-border shadow-sm p-6 flex flex-col">
          <h3 className="text-base font-bold mb-6 text-foreground tracking-wide relative z-10">Recent Activity</h3>
          <div className="space-y-5 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-4 group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 bg-surface-elevated`}>
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

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center gap-5 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-bold text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  )
}
