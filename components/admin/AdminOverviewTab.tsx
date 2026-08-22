import { LiveMap } from '@/components/admin/LiveMap'
import { Card } from '@/components/ui/card'
import { Users, Car, TrendingUp, CheckCircle, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export async function AdminOverviewTab({ stats, chartData, recentActivity }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-white" />} color="from-blue-600 to-cyan-400" />
        <StatCard title="Active Drivers" value={stats.totalDrivers} icon={<Car className="w-5 h-5 text-white" />} color="from-emerald-500 to-teal-400" />
        <StatCard title="Completed Trips" value={stats.completedTrips} icon={<CheckCircle className="w-5 h-5 text-white" />} color="from-purple-600 to-pink-500" />
        <StatCard title="Platform Revenue" value={`₦${stats.platformRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="from-orange-500 to-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-surface-card/60 backdrop-blur-xl border border-white/10 shadow-2xl p-6 transition-all duration-300 hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <h3 className="text-base font-bold mb-5 flex items-center gap-3 text-foreground tracking-wide">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              </div>
              Live Activity Map
            </h3>
            <div className="h-[360px] rounded-xl overflow-hidden relative ring-1 ring-white/10 shadow-inner">
              <LiveMap />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-card/60 backdrop-blur-xl border border-white/10 shadow-2xl p-6 transition-all duration-300 hover:border-white/20 flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <h3 className="text-base font-bold mb-6 text-foreground tracking-wide relative z-10">Recent Activity</h3>
          <div className="space-y-5 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-4 group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-lg ${act.type === 'TRIP' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-500'}`}>
                  {act.type === 'TRIP' ? <Car className="w-5 h-5 text-white" /> : <TrendingUp className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{act.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{act.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider font-medium">
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

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-surface-card/60 backdrop-blur-xl border border-white/10 shadow-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
      
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />
    </div>
  )
}
