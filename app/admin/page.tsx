"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Car, Users, ShieldAlert,
  Menu, Check, X, Search, DollarSign, Activity, Wallet, Package, LogOut, TrendingUp, TrendingDown, Inbox, Clock
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

function AnimatedNumber({ value, isCurrency = false }: { value: number, isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    if (value === undefined || value === null) return
    const duration = 600
    const startValue = displayValue
    const endValue = value
    let startTime: number
    let animationFrame: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const t = Math.min((timestamp - startTime) / duration, 1)
      const progress = 1 - Math.pow(1 - t, 3) // easeOutCubic
      
      setDisplayValue(startValue + (endValue - startValue) * progress)
      
      if (t < 1) {
        animationFrame = requestAnimationFrame(step)
      }
    }
    
    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [value]) // Deliberately omitted displayValue to avoid loops

  const formatted = Math.floor(displayValue).toLocaleString()
  return <span className="font-mono tracking-tight">{isCurrency ? `â‚¦${formatted}` : formatted}</span>
}

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',      icon: LayoutDashboard },
  { id: 'riders',    label: 'Riders',        icon: Users },
  { id: 'drivers',   label: 'Drivers',       icon: Car },
  { id: 'finances',  label: 'Finances',      icon: Wallet },
  { id: 'security',  label: 'Security',      icon: ShieldAlert },
]

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
    {children}
  </div>
)

const StatusIndicator = ({ status }: { status: string }) => {
  const norm = status?.toLowerCase() || 'unknown'
  let colorClass = 'bg-white/30'
  let textClass = 'text-muted-foreground'
  
  if (['approved', 'active', 'completed', 'success'].includes(norm)) {
    colorClass = 'bg-emerald-500'
    textClass = 'text-emerald-500'
  } else if (['pending', 'processing'].includes(norm)) {
    colorClass = 'bg-amber-500'
    textClass = 'text-amber-500'
  } else if (['suspended', 'rejected', 'failed', 'cancelled'].includes(norm)) {
    colorClass = 'bg-red-500'
    textClass = 'text-red-500'
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full shrink-0", colorClass)} />
      <span className={cn("text-xs font-medium capitalize", textClass)}>{norm}</span>
    </div>
  )
}

const Button = ({ children, variant = 'primary', className, ...props }: any) => {
  const base = "h-10 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
  const variants = {
    primary: "bg-[#F97316] text-white hover:bg-[#ea580c] active:scale-[0.98]",
    secondary: "bg-transparent border border-border text-foreground hover:bg-muted active:scale-[0.98]"
  }
  return (
    <button className={cn(base, variants[variant as keyof typeof variants], className)} {...props}>
      {children}
    </button>
  )
}

const EmptyState = ({ icon: Icon, title, desc, action }: any) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground mb-6 max-w-xs">{desc}</p>
    {action}
  </div>
)

const ListRow = ({ children, status, className }: any) => {
  const norm = status?.toLowerCase() || 'unknown'
  let borderColor = 'border-l-transparent'
  if (['approved', 'active', 'completed', 'success'].includes(norm)) borderColor = 'border-l-emerald-500'
  else if (['pending', 'processing'].includes(norm)) borderColor = 'border-l-amber-500'
  else if (['suspended', 'rejected', 'failed', 'cancelled'].includes(norm)) borderColor = 'border-l-red-500'

  return (
    <div className={cn("flex items-center p-4 border-b border-border bg-card hover:bg-muted transition-colors border-l-[3px]", borderColor, className)}>
      {children}
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [securityLogs, setSecurityLogs] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.status === 401 || res.status === 403) router.push('/dashboard')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [router])

  useEffect(() => {
    if (activeTab === 'security' && securityLogs.length === 0) {
      fetch('/api/portal/audit-log').then(r => r.json()).then(data => setSecurityLogs(data.logs || [])).catch(console.error)
    }
  }, [activeTab, securityLogs.length])

  const handleDriverAction = async (driverId: string, action: string) => {
    setProcessing(driverId)
    try {
      const res = await fetch('/api/admin/drivers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action })
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          drivers: prev.drivers.map((d: any) => d.id === driverId ? { ...d, status: action === 'approve' ? 'APPROVED' : action === 'suspend' ? 'SUSPENDED' : 'PENDING' } : d)
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(null)
    }
  }

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/withdrawals/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action })
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          withdrawalRequests: prev.withdrawalRequests.map((req: any) => 
            req.id === id ? { ...req, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : req
          )
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-[#F97316] animate-spin" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Loading Dashboard</p>
        </div>
      </div>
    )
  }

  const { stats, drivers, users, chartData, recentActivity } = data || { stats: {}, drivers: [], users: [], chartData: [], recentActivity: [] }

  const pendingDrivers = drivers.filter((d: any) => d.status === 'PENDING')
  const activeDrivers = drivers.filter((d: any) => d.status === 'APPROVED')

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Platform Revenue', value: stats?.platformRevenue || 0, isCurrency: true, trend: '+12%' },
          { label: 'Total Trips', value: stats?.totalTrips || 0, isCurrency: false, trend: '+5%' },
          { label: 'Active Users', value: (stats?.totalUsers || 0) + (activeDrivers?.length || 0), isCurrency: false, trend: '+2%' },
          { label: 'Drops Sold', value: stats?.dropsSold || 0, isCurrency: false, trend: '+18%' },
        ].map((s, i) => (
          <Card key={i} className="p-6 flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">{s.label}</p>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold text-foreground">
                <AnimatedNumber value={s.value} isCurrency={s.isCurrency} />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>{s.trend}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-semibold text-foreground">Network Activity</h3>
            <select className="bg-transparent border border-border rounded-md text-xs text-muted-foreground px-3 py-1.5 focus:outline-none focus:border-white/30">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} fontFamily="monospace" />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }}
                  itemStyle={{ color: '#F97316', fontWeight: '600' }}
                />
                <Area type="monotone" dataKey="trips" stroke="#F97316" strokeWidth={2} fill="url(#colorTrips)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <EmptyState icon={Inbox} title="No Activity" desc="No events have been recorded yet." />
            ) : (
              <div className="divide-y divide-white/5">
                {recentActivity.map((act: any) => (
                  <ListRow key={act.id} status={act.type === 'TRIP' ? 'completed' : 'processing'} className="px-6 border-l-[3px]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{act.desc}</p>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </ListRow>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderRiders = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Riders</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage registered platform users.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search riders..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 w-full sm:w-64"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-[10px] uppercase font-semibold text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.filter((u:any) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())).map((u: any) => (
                <tr key={u.id} className="hover:bg-muted transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={3} className="p-0"><EmptyState icon={Users} title="No Riders Found" desc="No users match your criteria." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderDrivers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Drivers</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage driver applications and active fleet.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search drivers..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 w-full sm:w-64"
          />
        </div>
      </div>

      {pendingDrivers.length > 0 && (
        <Card className="border-amber-500/20">
          <div className="p-6 border-b border-border bg-amber-500/5">
             <h3 className="text-sm font-semibold text-amber-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Applications ({pendingDrivers.length})
             </h3>
          </div>
          <div className="divide-y divide-white/5">
            {pendingDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
              <div key={driver.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarFallback className="bg-white/5 text-foreground text-xs font-semibold">{driver.user.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold text-foreground">{driver.user.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{driver.user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-1">
                  <p className="text-sm text-foreground font-medium">{driver.carModel || 'Unknown Vehicle'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{driver.plateNumber || 'NO PLATE'}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => handleDriverAction(driver.id, 'reject')} disabled={processing === driver.id}>
                    {processing === driver.id ? '...' : 'Reject'}
                  </Button>
                  <Button variant="primary" onClick={() => handleDriverAction(driver.id, 'approve')} disabled={processing === driver.id}>
                    {processing === driver.id ? '...' : 'Approve'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
         <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Active Fleet</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-muted text-[10px] uppercase font-semibold text-muted-foreground tracking-widest border-b border-border">
               <tr>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Vehicle Details</th>
                  <th className="px-6 py-4 text-right">Total Trips</th>
                  <th className="px-6 py-4 text-right">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {activeDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
               <tr key={driver.id} className="hover:bg-muted transition-colors">
                  <td className="px-6 py-4">
                     <p className="font-semibold text-foreground text-sm">{driver.user.name}</p>
                     <p className="text-xs text-muted-foreground mt-0.5">{driver.user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-foreground text-sm">{driver.carModel}</p>
                     <p className="text-muted-foreground text-xs font-mono mt-0.5">{driver.plateNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-foreground font-mono">
                     {driver.totalTrips || 0}
                  </td>
                  <td className="px-6 py-4 flex justify-end">
                     <StatusIndicator status={driver.status} />
                  </td>
               </tr>
               ))}
               {activeDrivers.length === 0 && (
                 <tr><td colSpan={4} className="p-0"><EmptyState icon={Car} title="No Drivers" desc="There are no active drivers in the fleet." /></td></tr>
               )}
            </tbody>
            </table>
         </div>
      </Card>
    </div>
  )

  const renderFinances = () => {
    const requests = data?.withdrawalRequests || []
    const pending = requests.filter((r: any) => r.status === 'PENDING')
    const completed = requests.filter((r: any) => r.status !== 'PENDING')

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Finances & Payouts</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage revenue and driver withdrawals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="p-6">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Total System Revenue</p>
             <div className="text-3xl font-semibold text-foreground">
                <AnimatedNumber value={data?.stats?.totalRevenue || 0} isCurrency />
             </div>
           </Card>
           <Card className="p-6">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Total Driver Payouts</p>
             <div className="text-3xl font-semibold text-foreground">
                <AnimatedNumber value={data?.stats?.driverPayouts || 0} isCurrency />
             </div>
           </Card>
        </div>

        <Card>
          <div className="p-6 border-b border-border flex items-center justify-between">
             <h3 className="text-sm font-semibold text-foreground">Pending Withdrawals</h3>
          </div>
          {pending.length === 0 ? (
            <EmptyState icon={Wallet} title="All Caught Up" desc="There are no pending driver withdrawal requests." />
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((req: any) => (
                <div key={req.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-muted transition-colors border-l-[3px] border-l-amber-500">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{req.driver?.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <p className="text-xl font-semibold text-foreground font-mono">â‚¦{req.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" onClick={() => handleWithdrawalAction(req.id, 'reject')} disabled={processing === req.id}>
                        {processing === req.id ? '...' : 'Reject'}
                      </Button>
                      <Button variant="primary" onClick={() => handleWithdrawalAction(req.id, 'approve')} disabled={processing === req.id}>
                        {processing === req.id ? '...' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    )
  }

  const renderSecurity = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Security & Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">System monitoring and anomaly detection.</p>
      </div>
      
      <Card>
        {securityLogs.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No Security Logs" desc="System is operating normally. No alerts triggered." />
        ) : (
          <div className="divide-y divide-white/5">
            {securityLogs.map((log: any) => (
              <ListRow key={log.id} status={log.success ? 'success' : 'failed'}>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{log.success ? 'Authentication Success' : 'Failed Login Attempt'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Target: {log.email} â€¢ IP: <span className="font-mono text-muted-foreground">{log.ipAddress || 'UNKNOWN'}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </ListRow>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-[#F97316]/30">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col w-[260px] bg-background border-r border-border transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-6 h-20 border-b border-border shrink-0">
          <div className="flex gap-[2px] items-end h-6">
            <div className="w-[3px] h-full bg-white rounded-full"></div>
            <div className="w-[3px] h-2/3 bg-[#F97316] rounded-full"></div>
            <div className="w-[3px] h-1/3 bg-white/50 rounded-full"></div>
          </div>
          <span className="font-bold text-lg tracking-tight">Tovedrop</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-1 px-4 [&::-webkit-scrollbar]:hidden">
          <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 mt-4">Menu</p>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg group',
                  active 
                    ? 'bg-white/10 text-foreground' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-colors", active ? "text-[#F97316]" : "text-muted-foreground group-hover:text-foreground/80")} />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-border shrink-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors -ml-2" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground capitalize hidden sm:block">
               {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-border">
                <Avatar className="w-6 h-6 border border-border">
                   <AvatarFallback className="bg-muted text-[10px] text-foreground">AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                   <span className="text-xs font-semibold text-foreground leading-none">Admin</span>
                </div>
             </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 w-full [&::-webkit-scrollbar]:hidden bg-background">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'riders' && renderRiders()}
            {activeTab === 'drivers' && renderDrivers()}
            {activeTab === 'finances' && renderFinances()}
            {activeTab === 'security' && renderSecurity()}
          </div>
        </div>
      </main>
    </div>
  )
}

