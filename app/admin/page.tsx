"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Car, Users, ShieldAlert,
  Menu, X, Check, XCircle, Search, Clock, DollarSign, Activity, AlertCircle, ShieldCheck, Wallet, Package
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

// Design Tokens: Glassmorphic UI with neon accents
const COLORS = ['#f97316', '#22c55e', '#ef4444', '#888888']

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',         icon: LayoutDashboard },
  { id: 'approvals', label: 'Driver Approvals', icon: Car },
  { id: 'finances',  label: 'Finances & Reports', icon: TrendingUp },
  { id: 'users',     label: 'Users',             icon: Users },
  { id: 'security',  label: 'Security Logs',     icon: ShieldAlert },
]

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: 'Active',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    pending:   { label: 'Pending',   color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.1)' },
    suspended: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  }
  const s = map[status?.toLowerCase()] ?? { label: status, color: 'var(--muted-foreground)', bg: 'var(--border)' }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-[var(--orange-brand)] animate-pulse" />
          <p className="text-xs text-foreground font-semibold uppercase tracking-widest">Initializing Systems...</p>
        </div>
      </div>
    )
  }

  const { stats, drivers, users, chartData, recentActivity } = data || { stats: {}, drivers: [], users: [], chartData: [], recentActivity: [] }

  const pendingDrivers = drivers.filter((d: any) => d.status === 'PENDING')
  const activeDrivers = drivers.filter((d: any) => d.status === 'APPROVED')
  const suspendedDrivers = drivers.filter((d: any) => d.status === 'SUSPENDED')

  const demographicsData = [
    { name: 'Riders', value: stats.totalUsers || 1 },
    { name: 'Active Drivers', value: activeDrivers.length || 0 },
    { name: 'Pending Drivers', value: pendingDrivers.length || 0 },
  ]

  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₦${(stats?.platformRevenue || 0).toLocaleString()}`, icon: Wallet, color: 'text-green-500' },
          { label: 'Total Trips', value: stats?.totalTrips || 0, icon: Car, color: 'text-orange-500' },
          { label: 'Active Users', value: (stats?.totalUsers || 0) + (activeDrivers?.length || 0), icon: Users, color: 'text-blue-500' },
          { label: 'Drops Sold', value: stats?.dropsSold || 0, icon: Package, color: 'text-purple-500' },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl relative overflow-hidden group border border-border bg-background hover:bg-background transition-all">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <s.icon className={`w-24 h-24 ${s.color}`} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-background">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Trip Volume (7 Days)</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--orange-brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--orange-brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--orange-brand)' }}
                />
                <Area type="monotone" dataKey="trips" stroke="var(--orange-brand)" strokeWidth={2} fillOpacity={1} fill="url(#colorTrips)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Pie */}
        <div className="p-5 rounded-2xl border border-border bg-background flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">User Demographics</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demographicsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {demographicsData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] text-foreground font-semibold">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-5 rounded-2xl border border-border bg-background">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-6">Live Activity Feed</h3>
        <div className="space-y-4">
          {recentActivity.map((act: any, i: number) => (
            <div key={act.id} className="flex items-start gap-4 pb-4" style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: act.type === 'TRIP' ? 'rgba(249,115,22,0.1)' : 'rgba(34,197,94,0.1)' }}>
                {act.type === 'TRIP' ? <Car className="w-4 h-4 text-orange-500" /> : <DollarSign className="w-4 h-4 text-green-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{act.title}</p>
                <p className="text-xs text-foreground mt-0.5">{act.desc}</p>
              </div>
              <div className="ml-auto text-[10px] text-foreground font-medium">
                {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderApprovals = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Driver Network</h2>
          <p className="text-xs text-foreground mt-1">Manage onboarding and active drivers.</p>
        </div>
        <div className="bg-background rounded-full px-4 py-1.5 flex items-center gap-2 border border-border">
          <Search className="w-3.5 h-3.5 text-foreground" />
          <input 
            type="text" 
            placeholder="Search drivers..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-foreground focus:outline-none w-32 md:w-48"
          />
        </div>
      </div>

      {pendingDrivers.length > 0 && (
        <div className="p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Action Required: Pending Approvals ({pendingDrivers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
              <div key={driver.id} className="p-4 rounded-xl bg-[var(--background)] border border-border flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarFallback className="bg-background text-xs font-bold text-foreground">{initials(driver.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-foreground">{driver.user.name}</p>
                    <p className="text-xs text-foreground">{driver.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[var(--surface-card)] p-2 rounded-lg">
                    <span className="text-foreground block mb-0.5">Car Model</span>
                    <span className="text-foreground font-medium">{driver.carModel || 'N/A'}</span>
                  </div>
                  <div className="bg-[var(--surface-card)] p-2 rounded-lg">
                    <span className="text-foreground block mb-0.5">Plate Number</span>
                    <span className="text-foreground font-medium uppercase tracking-wider">{driver.plateNumber || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    disabled={processing === driver.id}
                    onClick={() => handleDriverAction(driver.id, 'approve')}
                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-green-500/20"
                  >
                    {processing === driver.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                  </button>
                  <button 
                    disabled={processing === driver.id}
                    onClick={() => handleDriverAction(driver.id, 'reject')}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-red-500/20"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Active Fleet</h3>
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-[10px] uppercase font-bold text-foreground tracking-wider">
              <tr>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Trips</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
                <tr key={driver.id} className="hover:bg-[var(--surface-card)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8"><AvatarFallback className="bg-[var(--border-default)] text-foreground text-[10px]">{initials(driver.user.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{driver.user.name}</p>
                        <p className="text-[11px] text-foreground">{driver.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-foreground text-xs">
                    {driver.carModel} <br/><span className="text-foreground">{driver.plateNumber}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-foreground">{driver.totalTrips || 0}</td>
                  <td className="px-5 py-4 text-right">
                    <StatusChip status={driver.status} />
                  </td>
                </tr>
              ))}
              {activeDrivers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-foreground text-xs">No active drivers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )


  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(id)
      const res = await fetch('/api/admin/withdrawals/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action })
      })
      if (!res.ok) throw new Error()
      
      setData((prev: any) => ({
        ...prev,
        withdrawalRequests: prev.withdrawalRequests.map((req: any) => 
          req.id === id ? { ...req, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : req
        )
      }))
    } catch (e) {
      alert("Failed to process withdrawal.")
    } finally {
      setProcessing(null)
    }
  }

  const renderFinances = () => {
    const requests = data?.withdrawalRequests || []
    const pending = requests.filter((r: any) => r.status === 'PENDING')
    const completed = requests.filter((r: any) => r.status !== 'PENDING')

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Finances & Withdrawals</h2>
            <p className="text-xs text-foreground mt-1">Manage driver payouts and view revenue.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-background border border-border rounded-2xl p-5">
             <p className="text-xs font-semibold text-foreground uppercase">Total Revenue (All Time)</p>
             <p className="text-3xl font-black text-foreground mt-1">₦{(data?.stats?.totalRevenue || 0).toLocaleString()}</p>
           </div>
           <div className="bg-background border border-border rounded-2xl p-5">
             <p className="text-xs font-semibold text-foreground uppercase">Driver Payouts</p>
             <p className="text-3xl font-black text-foreground mt-1">₦{(data?.stats?.driverPayouts || 0).toLocaleString()}</p>
           </div>
        </div>

        <h3 className="text-sm font-bold text-foreground mt-8 mb-4">Pending Withdrawal Requests</h3>
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          {pending.length === 0 ? (
            <p className="text-xs text-foreground text-center py-10">No pending withdrawal requests.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((req: any) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-orange-500/20 text-orange-500 font-bold">
                        {req.driver?.user?.firstName?.[0] || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                      <p className="text-xs text-foreground">{req.driver?.user?.email}</p>
                      <p className="text-[10px] text-foreground mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                    <p className="text-lg font-black text-green-400">₦{req.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWithdrawalAction(req.id, 'approve')}
                        disabled={processing === req.id}
                        className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 disabled:opacity-50 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(req.id, 'reject')}
                        disabled={processing === req.id}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold text-foreground mt-8 mb-4">Past Withdrawals</h3>
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          {completed.length === 0 ? (
             <p className="text-xs text-foreground text-center py-6">No past withdrawals.</p>
          ) : (
            completed.slice(0, 10).map((req: any) => (
               <div key={req.id} className="p-4 border-b border-border last:border-0 flex items-center justify-between">
                  <div>
                     <p className="text-sm font-semibold text-foreground">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                     <p className="text-[10px] text-foreground">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-bold text-foreground">₦{req.amount.toLocaleString()}</p>
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${req.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`}>
                       {req.status}
                     </span>
                  </div>
               </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderSecurity = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
          <ShieldCheck className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Security & Audit Logs</h2>
          <p className="text-xs text-foreground mt-1">System-wide surveillance and anomalies.</p>
        </div>
      </div>
      <div className="bg-background border border-border rounded-2xl p-5">
        {securityLogs.length === 0 ? (
          <p className="text-xs text-foreground text-center py-10">No recent security anomalies.</p>
        ) : (
          <div className="space-y-4">
            {securityLogs.map((log: any, i: number) => (
              <div key={log.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="mt-1">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{log.success ? 'Successful Login' : 'Failed Login Attempt'}</p>
                  <p className="text-xs text-foreground mt-1">Email: {log.email} &bull; IP: {log.ipAddress || 'Unknown'}</p>
                  <p className="text-[10px] text-foreground mt-2">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderGenericList = (title: string, items: any[]) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-foreground tracking-tight mb-6">{title}</h2>
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-[10px] uppercase font-bold text-foreground tracking-wider">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((u: any) => (
              <tr key={u.id} className="hover:bg-[var(--surface-card)] transition-colors">
                <td className="px-5 py-4 font-semibold text-foreground">{u.name}</td>
                <td className="px-5 py-4 text-foreground text-xs">{u.email}</td>
                <td className="px-5 py-4 text-right text-[11px] text-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-orange-500/30">
      
      {/* Dynamic Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[var(--background)] border-r border-border transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-lg shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <h1 className="text-base font-black tracking-tight text-foreground uppercase">
              Admin<span className="text-orange-500">OS</span>
            </h1>
          </div>
          <button className="lg:hidden text-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  active 
                    ? 'bg-orange-500/10 text-orange-500 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.2)]' 
                    : 'text-foreground hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                <item.icon className={cn("w-4 h-4", active ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "")} />
                {item.label}
                {item.id === 'approvals' && pendingDrivers.length > 0 && (
                  <span className="ml-auto bg-orange-500 text-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {pendingDrivers.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background)] border border-border">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'approvals' && renderApprovals()}
          {activeTab === 'finances' && renderFinances()}
          {activeTab === 'users' && renderGenericList('Riders & Users', users)}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </main>
    </div>
  )
}
