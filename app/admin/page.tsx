"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, TrendingUp, Car, Users, ShieldAlert,
  Menu, X, Check, XCircle, Search, Clock, DollarSign, Activity, AlertCircle, ShieldCheck, Wallet, Package, LogOut
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6']

const NAV_ITEMS = [
  { id: 'overview',  label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'approvals', label: 'Approvals', icon: Car },
  { id: 'finances',  label: 'Finances', icon: TrendingUp },
  { id: 'users',     label: 'Members',             icon: Users },
  { id: 'security',  label: 'Security',     icon: ShieldAlert },
]

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: 'Active',  color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    pending:   { label: 'Pending',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    suspended: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  }
  const s = map[status?.toLowerCase()] ?? { label: status, color: '#9ca3af', bg: 'rgba(255,255,255,0.05)' }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#151922] text-white">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
          <p className="text-xs text-white/50 font-semibold uppercase tracking-widest">Initializing System...</p>
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
    { name: 'Pending', value: pendingDrivers.length || 0 },
  ]

  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₦${(stats?.platformRevenue || 0).toLocaleString()}`, icon: Wallet },
          { label: 'Total Trips', value: stats?.totalTrips || 0, icon: Car },
          { label: 'Active Members', value: (stats?.totalUsers || 0) + (activeDrivers?.length || 0), icon: Users },
          { label: 'Drops Sold', value: stats?.dropsSold || 0, icon: Package },
        ].map((s, i) => (
          <div key={i} className="p-5 relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm">
            <div className="flex justify-between items-center mb-2">
               <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{s.label}</p>
               <s.icon className="w-4 h-4 text-blue-400 opacity-50" />
            </div>
            <p className="text-2xl font-light text-white tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Statistics
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,25,35,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px', color: 'white' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="trips" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm flex flex-col">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
             <PieChart className="w-4 h-4 text-emerald-400" /> Demographics
          </h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demographicsData} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="rgba(0,0,0,0.2)" strokeWidth={2}>
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(20,25,35,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px', color: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {demographicsData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] text-white/70">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="p-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-6">
               <Menu className="w-4 h-4 text-purple-400" /> Recent Activity
            </h3>
            <div className="space-y-4">
               {recentActivity.map((act: any, i: number) => (
               <div key={act.id} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'TRIP' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                     {act.type === 'TRIP' ? <Car className="w-4 h-4 text-blue-400" /> : <DollarSign className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                     <p className="text-sm text-white font-medium">{act.title}</p>
                     <p className="text-xs text-white/50 mt-0.5">{act.desc}</p>
                  </div>
                  <div className="ml-auto text-[10px] text-white/40">
                     {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
               ))}
            </div>
         </div>

         <div className="p-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-6">
               <AlertCircle className="w-4 h-4 text-orange-400" /> Alert Messages
            </h3>
            <div className="space-y-3">
               <div className="flex gap-3 items-center p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-white/70">System running smoothly. All services operational.</p>
               </div>
               {pendingDrivers.length > 0 && (
                  <div className="flex gap-3 items-center p-3 rounded bg-orange-500/10 border border-orange-500/20">
                     <AlertCircle className="w-4 h-4 text-orange-400" />
                     <p className="text-xs text-white/70">Warning! You have {pendingDrivers.length} pending driver approvals.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )

  const renderApprovals = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-white">Driver Network</h2>
        <div className="bg-black/20 rounded-sm px-4 py-2 flex items-center gap-2 border border-white/10">
          <Search className="w-3.5 h-3.5 text-white/50" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none w-32 md:w-48"
          />
        </div>
      </div>

      {pendingDrivers.length > 0 && (
        <div className="p-5 bg-white/[0.03] backdrop-blur-xl border border-blue-500/30 rounded-sm">
          <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2">
             Action Required ({pendingDrivers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
              <div key={driver.id} className="p-4 bg-black/20 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-white/20">
                    <AvatarFallback className="bg-blue-500/20 text-xs font-bold text-blue-400">{initials(driver.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{driver.user.name}</p>
                    <p className="text-[11px] text-white/50">{driver.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/20 p-2 border border-white/5">
                    <span className="text-white/50 block mb-0.5">Model</span>
                    <span className="text-white">{driver.carModel || 'N/A'}</span>
                  </div>
                  <div className="bg-black/20 p-2 border border-white/5">
                    <span className="text-white/50 block mb-0.5">Plate</span>
                    <span className="text-white uppercase">{driver.plateNumber || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleDriverAction(driver.id, 'approve')} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs py-2 flex items-center justify-center gap-2 transition-colors border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleDriverAction(driver.id, 'reject')} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs py-2 flex items-center justify-center gap-2 transition-colors border border-red-500/30">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
         <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white/80">Active Fleet</h3>
         </div>
         <table className="w-full text-left text-sm">
          <thead className="bg-black/20 text-[10px] uppercase font-semibold text-white/50 tracking-wider border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Driver</th>
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-5 py-3">Trips</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activeDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
              <tr key={driver.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8"><AvatarFallback className="bg-white/10 text-white text-[10px]">{initials(driver.user.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium text-white text-xs">{driver.user.name}</p>
                      <p className="text-[10px] text-white/50">{driver.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">
                  {driver.carModel} <br/><span className="text-white/40">{driver.plateNumber}</span>
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">{driver.totalTrips || 0}</td>
                <td className="px-5 py-4 text-right">
                  <StatusChip status={driver.status} />
                </td>
              </tr>
            ))}
            {activeDrivers.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-white/50 text-xs">No active drivers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderFinances = () => {
    const requests = data?.withdrawalRequests || []
    const pending = requests.filter((r: any) => r.status === 'PENDING')
    const completed = requests.filter((r: any) => r.status !== 'PENDING')

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-light text-white mb-6">Finances</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm p-5">
             <p className="text-xs text-white/50 uppercase tracking-widest">Platform Revenue</p>
             <p className="text-3xl font-light text-white mt-1">₦{(data?.stats?.totalRevenue || 0).toLocaleString()}</p>
           </div>
           <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm p-5">
             <p className="text-xs text-white/50 uppercase tracking-widest">Driver Payouts</p>
             <p className="text-3xl font-light text-white mt-1">₦{(data?.stats?.driverPayouts || 0).toLocaleString()}</p>
           </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden mt-6">
          <div className="p-4 border-b border-white/10">
             <h3 className="text-sm font-semibold text-white/80">Pending Withdrawals</h3>
          </div>
          {pending.length === 0 ? (
            <p className="text-xs text-white/50 text-center py-10">No pending withdrawal requests.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((req: any) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-white/20">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 font-bold">{req.driver?.user?.firstName?.[0] || 'D'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                      <p className="text-[11px] text-white/50">{req.driver?.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-lg font-bold text-emerald-400">₦{req.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleWithdrawalAction(req.id, 'approve')} className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleWithdrawalAction(req.id, 'reject')} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSecurity = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-light text-white mb-6">Security Logs</h2>
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
        {securityLogs.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-10">No recent security anomalies.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {securityLogs.map((log: any) => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-white/5 transition-colors">
                <ShieldAlert className="w-4 h-4 text-blue-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-white">{log.success ? 'Successful Login' : 'Failed Login Attempt'}</p>
                  <p className="text-[11px] text-white/50 mt-1">Email: {log.email} &bull; IP: {log.ipAddress || 'Unknown'}</p>
                  <p className="text-[10px] text-white/30 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
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
      <h2 className="text-2xl font-light text-white mb-6">{title}</h2>
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/20 text-[10px] uppercase font-semibold text-white/50 tracking-wider border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((u: any) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 font-medium text-white">{u.name}</td>
                <td className="px-5 py-4 text-white/50 text-xs">{u.email}</td>
                <td className="px-5 py-4 text-right text-[11px] text-white/40">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div 
      className="flex min-h-screen text-white font-sans selection:bg-blue-500/30 overflow-hidden" 
      style={{ background: 'linear-gradient(135deg, #1b2838 0%, #171a21 50%, #101217 100%)' }}
    >
      
      {/* Glazzed Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col w-[260px] bg-black/20 backdrop-blur-2xl border-r border-white/5 transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>
        <div className="flex flex-col items-center py-10 border-b border-white/5">
          <Avatar className="w-20 h-20 mb-3 border-2 border-white/10 shadow-lg">
            <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-blue-400 text-xl font-light text-white">AD</AvatarFallback>
          </Avatar>
          <h2 className="text-sm font-semibold tracking-wide">Admin Manager</h2>
          <p className="text-[10px] text-blue-400 mt-1 uppercase tracking-widest">Tovedrop Team</p>
          
          <div className="flex justify-center gap-6 mt-6 w-full px-6">
             <div className="text-center">
                <p className="text-xs font-bold">28k+</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Visits</p>
             </div>
             <div className="text-center">
                <p className="text-xs font-bold text-emerald-400">1,095</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Users</p>
             </div>
             <div className="text-center">
                <p className="text-xs font-bold text-blue-400">428</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Trips</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-1 [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-4 px-6 py-3.5 text-xs transition-all duration-200 border-l-[3px]',
                  active 
                    ? 'bg-white/10 text-white border-blue-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                    : 'text-white/60 border-transparent hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className={cn("w-4 h-4", active ? "text-blue-400" : "")} />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Glazzed Log Out Button */}
        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors border border-white/5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 z-40 bg-transparent">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-white/70 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-light flex items-center gap-3">
               <LayoutDashboard className="w-5 h-5 text-white/50" /> {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <button className="hidden sm:block px-4 py-1.5 text-[10px] font-medium bg-black/20 text-white/70 hover:text-white rounded-sm border border-white/5">Today</button>
             <button className="hidden sm:block px-4 py-1.5 text-[10px] font-medium bg-white/10 text-white rounded-sm border border-white/10 shadow-sm">Yesterday</button>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 w-full [&::-webkit-scrollbar]:hidden">
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
