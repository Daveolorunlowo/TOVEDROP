"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, TrendingUp, Car, Users, ShieldAlert,
  Menu, X, Check, XCircle, Search, DollarSign, Activity, AlertCircle, Wallet, Package, LogOut, Sparkles, ChevronRight, Zap
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

const COLORS = ['#a855f7', '#d946ef', '#6366f1', '#8b5cf6']

const NAV_ITEMS = [
  { id: 'overview',  label: 'Nexus Center',      icon: LayoutDashboard },
  { id: 'approvals', label: 'Fleet Matrix',      icon: Car },
  { id: 'finances',  label: 'Revenue Stream',    icon: Wallet },
  { id: 'users',     label: 'User Directory',    icon: Users },
  { id: 'security',  label: 'Threat Monitor',    icon: ShieldAlert },
]

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; glow: string }> = {
    approved:  { label: 'Active',    color: '#a855f7', bg: 'rgba(168,85,247,0.1)', glow: '0 0 10px rgba(168,85,247,0.5)' },
    pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', glow: '0 0 10px rgba(245,158,11,0.5)' },
    suspended: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', glow: '0 0 10px rgba(239,68,68,0.5)' },
  }
  const s = map[status?.toLowerCase()] ?? { label: status, color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', glow: 'none' }
  return (
    <span 
      className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full backdrop-blur-md" 
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40`, boxShadow: s.glow }}
    >
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
      <div className="min-h-screen flex items-center justify-center bg-[#07070a] text-white overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/30 blur-[100px] rounded-full animate-pulse" />
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="relative flex items-center justify-center w-20 h-20">
             <div className="absolute inset-0 border-t-2 border-purple-500 rounded-full animate-spin" />
             <div className="absolute inset-2 border-r-2 border-fuchsia-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
             <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <p className="text-xs text-purple-300/70 font-black uppercase tracking-[0.3em]">Establishing Uplink...</p>
        </div>
      </div>
    )
  }

  const { stats, drivers, users, chartData, recentActivity } = data || { stats: {}, drivers: [], users: [], chartData: [], recentActivity: [] }

  const pendingDrivers = drivers.filter((d: any) => d.status === 'PENDING')
  const activeDrivers = drivers.filter((d: any) => d.status === 'APPROVED')

  const demographicsData = [
    { name: 'Riders', value: stats.totalUsers || 1 },
    { name: 'Active Drivers', value: activeDrivers.length || 0 },
    { name: 'Pending', value: pendingDrivers.length || 0 },
  ]

  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

  const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("relative overflow-hidden rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.04] transition-all duration-500 group", className)}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </div>
  )

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Platform Revenue', value: `₦${(stats?.platformRevenue || 0).toLocaleString()}`, icon: Wallet },
          { label: 'Total Trips', value: stats?.totalTrips || 0, icon: Car },
          { label: 'Active Members', value: (stats?.totalUsers || 0) + (activeDrivers?.length || 0), icon: Users },
          { label: 'Drops Sold', value: stats?.dropsSold || 0, icon: Zap },
        ].map((s, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{s.label}</p>
               <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-500">
                 <s.icon className="w-4 h-4 text-purple-400" />
               </div>
            </div>
            <p className="text-3xl font-light text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{s.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70 flex items-center gap-3">
              <Activity className="w-4 h-4 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" /> 
              Network Throughput
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,15,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px', fontSize: '12px', color: 'white', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="trips" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.5))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70 flex items-center gap-3 mb-6">
             <PieChart className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" /> 
             User Matrix
          </h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demographicsData} innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value" stroke="rgba(255,255,255,0.05)" strokeWidth={2}>
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `drop-shadow(0 0 10px ${COLORS[index % COLORS.length]}80)` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,15,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px', fontSize: '12px', color: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-4">
            {demographicsData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i], boxShadow: `0 0 10px ${COLORS[i]}` }} />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{d.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <GlassCard className="p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70 flex items-center gap-3 mb-6">
               <Zap className="w-4 h-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> 
               Live Telemetry
            </h3>
            <div className="space-y-5 relative">
               <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/50 via-fuchsia-500/20 to-transparent" />
               {recentActivity.map((act: any, i: number) => (
               <div key={act.id} className="flex items-start gap-5 relative z-10 group/item">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-lg backdrop-blur-md ${act.type === 'TRIP' ? 'bg-purple-900/40' : 'bg-fuchsia-900/40'}`}>
                     {act.type === 'TRIP' ? <Car className="w-3.5 h-3.5 text-purple-300" /> : <DollarSign className="w-3.5 h-3.5 text-fuchsia-300" />}
                  </div>
                  <div className="pt-1.5 flex-1">
                     <p className="text-sm text-white/90 font-semibold group-hover/item:text-white transition-colors">{act.title}</p>
                     <p className="text-xs text-white/40 mt-1 leading-relaxed">{act.desc}</p>
                  </div>
                  <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-purple-400/60">
                     {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
               ))}
            </div>
         </GlassCard>

         <GlassCard className="p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70 flex items-center gap-3 mb-6">
               <ShieldAlert className="w-4 h-4 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" /> 
               System Alerts
            </h3>
            <div className="space-y-4">
               <div className="flex gap-4 items-center p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 relative overflow-hidden group/alert">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <Check className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs text-white/80 font-medium">Core systems synchronized. All matrices stable.</p>
               </div>
               {pendingDrivers.length > 0 && (
                  <div className="flex gap-4 items-center p-4 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-transparent border border-fuchsia-500/20 relative overflow-hidden group/alert">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)] animate-pulse" />
                     <div className="p-2 rounded-full bg-fuchsia-500/20">
                        <AlertCircle className="w-4 h-4 text-fuchsia-400" />
                     </div>
                     <p className="text-xs text-white/80 font-medium">Attention: {pendingDrivers.length} pilot applications require immediate authorization.</p>
                  </div>
               )}
            </div>
         </GlassCard>
      </div>
    </div>
  )

  const renderApprovals = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Fleet Matrix</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mt-3">Pilot Authorization Hub</p>
        </div>
        <div className="bg-black/30 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] focus-within:border-purple-500/50 focus-within:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all">
          <Search className="w-4 h-4 text-purple-400" />
          <input 
            type="text" 
            placeholder="Scan directory..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white placeholder:text-white/30 focus:outline-none w-40 md:w-56"
          />
        </div>
      </div>

      {pendingDrivers.length > 0 && (
        <GlassCard className="p-6 border-fuchsia-500/30">
          <h3 className="text-xs font-black tracking-[0.2em] uppercase text-fuchsia-400 mb-6 flex items-center gap-3">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fuchsia-500"></span>
             </span>
             Authorization Queue ({pendingDrivers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
              <div key={driver.id} className="p-5 bg-black/20 border border-white/5 rounded-xl flex flex-col gap-5 hover:bg-black/40 hover:border-purple-500/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                    <AvatarFallback className="bg-gradient-to-br from-fuchsia-600 to-purple-800 text-sm font-bold text-white">{initials(driver.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-bold text-white">{driver.user.name}</p>
                    <p className="text-xs font-medium text-white/40 mt-1">{driver.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.05]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 block mb-1.5">Vehicle</span>
                    <span className="text-white font-medium">{driver.carModel || 'UNREGISTERED'}</span>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.05]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 block mb-1.5">Identifier</span>
                    <span className="text-purple-300 font-bold uppercase tracking-wider">{driver.plateNumber || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => handleDriverAction(driver.id, 'approve')} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all">
                    <Check className="w-4 h-4" /> Authenticate
                  </button>
                  <button onClick={() => handleDriverAction(driver.id, 'reject')} className="flex-1 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-red-500/30">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard>
         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-white/70">Authorized Pilots</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-[9px] uppercase font-black text-white/30 tracking-[0.2em] border-b border-white/5">
               <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Hardware</th>
                  <th className="px-6 py-4 text-center">Operations</th>
                  <th className="px-6 py-4 text-right">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {activeDrivers.filter((d: any) => d.user.name?.toLowerCase().includes(search.toLowerCase())).map((driver: any) => (
               <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-4">
                     <Avatar className="w-9 h-9 border border-white/10 group-hover/row:border-purple-500/50 transition-colors shadow-lg">
                        <AvatarFallback className="bg-white/5 text-white text-[11px] font-bold">{initials(driver.user.name)}</AvatarFallback>
                     </Avatar>
                     <div>
                        <p className="font-bold text-white text-sm">{driver.user.name}</p>
                        <p className="text-[10px] font-medium text-white/40 mt-1">{driver.user.email}</p>
                     </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-white/90 text-xs font-semibold">{driver.carModel}</p>
                     <p className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mt-1">{driver.plateNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className="inline-flex items-center justify-center min-w-[32px] h-[32px] rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs font-bold">
                        {driver.totalTrips || 0}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <StatusChip status={driver.status} />
                  </td>
               </tr>
               ))}
               {activeDrivers.length === 0 && (
               <tr><td colSpan={4} className="px-6 py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest">No pilots in database.</td></tr>
               )}
            </tbody>
            </table>
         </div>
      </GlassCard>
    </div>
  )

  const renderFinances = () => {
    const requests = data?.withdrawalRequests || []
    const pending = requests.filter((r: any) => r.status === 'PENDING')
    const completed = requests.filter((r: any) => r.status !== 'PENDING')

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h2 className="text-3xl font-light text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-8">Revenue Stream</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <GlassCard className="p-8 bg-gradient-to-br from-purple-900/20 to-transparent">
             <p className="text-[10px] text-purple-300/70 font-bold uppercase tracking-[0.2em] mb-2">Total System Input</p>
             <p className="text-4xl font-light text-white mt-1 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">₦{(data?.stats?.totalRevenue || 0).toLocaleString()}</p>
           </GlassCard>
           <GlassCard className="p-8 bg-gradient-to-br from-indigo-900/20 to-transparent">
             <p className="text-[10px] text-indigo-300/70 font-bold uppercase tracking-[0.2em] mb-2">Total Pilot Output</p>
             <p className="text-4xl font-light text-white mt-1 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">₦{(data?.stats?.driverPayouts || 0).toLocaleString()}</p>
           </GlassCard>
        </div>

        <GlassCard className="mt-8">
          <div className="p-6 border-b border-white/5 bg-black/20">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Pending Transfers</h3>
          </div>
          {pending.length === 0 ? (
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 text-center py-16">No pending transfers.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((req: any) => (
                <div key={req.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-5">
                    <Avatar className="h-12 w-12 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      <AvatarFallback className="bg-purple-900/50 text-purple-300 font-bold">{req.driver?.user?.firstName?.[0] || 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-bold text-white">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                      <p className="text-[11px] font-medium text-white/40 mt-1">{req.driver?.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <p className="text-2xl font-light text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">₦{req.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleWithdrawalAction(req.id, 'approve')} className="p-3 bg-purple-600/20 text-purple-300 hover:bg-purple-500 hover:text-white rounded-xl border border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleWithdrawalAction(req.id, 'reject')} className="p-3 bg-white/5 text-white/50 hover:bg-red-500/20 hover:text-red-400 rounded-xl border border-white/5 hover:border-red-500/30 transition-all">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    )
  }

  const renderSecurity = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h2 className="text-3xl font-light text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-8">Threat Monitor</h2>
      <GlassCard>
        {securityLogs.length === 0 ? (
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 text-center py-16">System Secure. No threats detected.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {securityLogs.map((log: any) => (
              <div key={log.id} className="p-5 flex gap-5 hover:bg-white/[0.02] transition-colors items-center">
                <div className={`p-3 rounded-xl ${log.success ? 'bg-purple-900/30 border border-purple-500/20' : 'bg-red-900/30 border border-red-500/20'}`}>
                   <ShieldAlert className={`w-5 h-5 ${log.success ? 'text-purple-400' : 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{log.success ? 'Authorization Granted' : 'Breach Attempt Blocked'}</p>
                  <p className="text-xs text-white/50 font-mono mt-1.5">ID: {log.email} | ORIGIN: {log.ipAddress || 'UNKNOWN_NODE'}</p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )

  const renderGenericList = (title: string, items: any[]) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h2 className="text-3xl font-light text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-8">{title}</h2>
      <GlassCard>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-black/40 text-[9px] uppercase font-black text-white/30 tracking-[0.2em] border-b border-white/5">
               <tr>
                 <th className="px-6 py-5">Identity</th>
                 <th className="px-6 py-5">Contact Node</th>
                 <th className="px-6 py-5 text-right">Access Granted</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
               {items.map((u: any) => (
                 <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                   <td className="px-6 py-5 font-bold text-white text-sm">{u.name}</td>
                   <td className="px-6 py-5 text-white/50 text-xs font-mono">{u.email}</td>
                   <td className="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-white/30">{new Date(u.createdAt).toLocaleDateString()}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </GlassCard>
    </div>
  )

  return (
    <div className="flex min-h-screen text-white font-sans selection:bg-purple-500/40 overflow-hidden relative bg-[#07070a]">
      {/* Background Animated Gradient Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-900/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
         <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-900/15 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
         
         {/* Noise overlay for glass texture */}
         <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-black/40 backdrop-blur-3xl border-r border-white/[0.05] shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>
        <div className="flex flex-col items-center py-10 border-b border-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-50" />
          <Avatar className="w-24 h-24 mb-4 border-2 border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.3)] relative z-10">
            <AvatarFallback className="bg-gradient-to-tr from-purple-800 to-fuchsia-500 text-2xl font-light text-white">AD</AvatarFallback>
          </Avatar>
          <h2 className="text-base font-bold tracking-wide relative z-10 text-white drop-shadow-md">Admin Manager</h2>
          <p className="text-[9px] font-black text-fuchsia-400 mt-1.5 uppercase tracking-[0.3em] relative z-10 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Tovedrop Core</p>
          
          <div className="flex justify-center gap-8 mt-8 w-full px-6 relative z-10">
             <div className="text-center group cursor-default">
                <p className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">28k+</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 group-hover:text-purple-400/50 transition-colors">Nodes</p>
             </div>
             <div className="text-center group cursor-default">
                <p className="text-sm font-black text-white group-hover:text-fuchsia-300 transition-colors">1.2k</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 group-hover:text-fuchsia-400/50 transition-colors">Pilots</p>
             </div>
             <div className="text-center group cursor-default">
                <p className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">99%</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 group-hover:text-indigo-400/50 transition-colors">Uptime</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-8 space-y-2 px-4 [&::-webkit-scrollbar]:hidden relative z-10">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 text-xs transition-all duration-300 rounded-xl relative overflow-hidden group',
                  active 
                    ? 'text-white font-bold shadow-[0_10px_30px_rgba(168,85,247,0.15)]' 
                    : 'text-white/50 font-medium hover:text-white hover:bg-white/[0.02]'
                )}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent border-l-[3px] border-purple-500" />
                )}
                <item.icon className={cn("w-4 h-4 relative z-10 transition-colors duration-300", active ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "group-hover:text-white/80")} />
                <span className="relative z-10 tracking-wide uppercase text-[10px] font-bold">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 absolute right-4 text-purple-400/50 animate-pulse" />}
              </button>
            )
          })}
        </div>

        <div className="p-6 relative z-10 mt-auto">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-white/[0.02] hover:bg-red-500/10 text-white/50 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border border-white/[0.05] hover:border-red-500/30 group"
          >
            <LogOut className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-6 lg:px-12 z-40 bg-transparent">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
               <h1 className="text-xl font-light text-white tracking-widest uppercase flex items-center gap-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  {NAV_ITEMS.find(n => n.id === activeTab)?.label}
               </h1>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                 <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">Live Connection</span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex p-1 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10">
                <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">Cycle Alpha</button>
                <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Cycle Beta</button>
             </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 w-full [&::-webkit-scrollbar]:hidden">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'approvals' && renderApprovals()}
          {activeTab === 'finances' && renderFinances()}
          {activeTab === 'users' && renderGenericList('User Directory', users)}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </main>
    </div>
  )
}
