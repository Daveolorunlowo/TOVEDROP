import { LiveMap } from '@/components/admin/LiveMap'
import { Card } from '@/components/ui/card'
import { Users, Car, TrendingUp, CheckCircle, Activity } from 'lucide-react'
import CountUp from 'react-countup'
import { formatDistanceToNow } from 'date-fns'

export async function AdminOverviewTab({ stats, chartData, recentActivity }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Active Drivers" value={stats.totalDrivers} icon={<Car className="w-5 h-5 text-green-500" />} />
        <StatCard title="Completed Trips" value={stats.completedTrips} icon={<CheckCircle className="w-5 h-5 text-purple-500" />} />
        <StatCard title="Platform Revenue" value={`₦${stats.platformRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-orange-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-card/80 backdrop-blur-sm border border-border-default rounded-2xl p-5 h-[400px] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0 opacity-50" />
            <h3 className="text-sm font-extrabold tracking-wide mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" /> Live Activity Map
            </h3>
            <div className="h-[310px] rounded-xl overflow-hidden relative border border-border-subtle">
              <LiveMap />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-card/80 backdrop-blur-sm border border-border-default rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold tracking-wide mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-transparent group-hover:border-border transition-all ${act.type === 'TRIP' ? 'bg-purple-500/10' : 'bg-orange-500/10'}`}>
                  {act.type === 'TRIP' ? <Car className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" /> : <TrendingUp className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{act.title}</p>
                  <p className="text-xs text-muted-foreground">{act.desc}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 mt-1">
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
    <div className="bg-surface-card/80 backdrop-blur-sm border border-border-default hover:border-orange-brand/30 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] hover:-translate-y-1 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-orange-brand/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-brand/10 transition-colors" />
      <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0 border border-border-default/50 group-hover:scale-110 transition-transform duration-300 relative z-10">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground group-hover:text-foreground/80 transition-colors">{title}</p>
        <p className="text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
          {typeof value === 'number' ? <CountUp end={value} separator="," /> : value}
        </p>
      </div>
    </div>
  )
}
