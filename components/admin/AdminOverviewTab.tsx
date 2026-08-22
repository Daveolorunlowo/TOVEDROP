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
          <div className="bg-surface-card border border-border-default rounded-xl p-4 h-[400px]">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" /> Live Activity Map
            </h3>
            <div className="h-[320px] rounded-lg overflow-hidden relative">
              <LiveMap />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'TRIP' ? 'bg-purple-500/10' : 'bg-orange-500/10'}`}>
                  {act.type === 'TRIP' ? <Car className="w-4 h-4 text-purple-500" /> : <TrendingUp className="w-4 h-4 text-orange-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{act.title}</p>
                  <p className="text-xs text-muted-foreground">{act.desc}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
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
    <div className="bg-surface-card border border-border-default rounded-xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0 border border-border-default/50">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? <CountUp end={value} separator="," /> : value}
        </p>
      </div>
    </div>
  )
}
