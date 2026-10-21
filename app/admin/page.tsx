'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Car, Flag, Users,
  ShieldAlert, Menu, X, Loader2, Check, ChevronRight,
  Activity, AlertTriangle, RefreshCw, Banknote,
  Clock, CheckCircle2, XCircle, Search, Eye, Sparkles,
  ArrowUpRight, ArrowDownRight, Layers, BarChart3,
  Calendar, DollarSign, Award, BellRing, Droplet,
  PieChart as PieIcon, Zap
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/shared/Skeleton'
import { UserActivityModal } from '@/components/admin/UserActivityModal'
import { cn } from '@/lib/utils'

// ─── Design Tokens ───
const GOLD = 'var(--orange-brand, #FF6B00)'
const GOLD_GLOW = 'rgba(255, 107, 0, 0.25)'
const GREEN = '#10B981'
const GREEN_GLOW = 'rgba(16, 185, 129, 0.25)'
const BLUE = '#3B82F6'
const BLUE_GLOW = 'rgba(59, 130, 246, 0.25)'
const PURPLE = '#8B5CF6'
const RED = '#EF4444'

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview & Graphs', icon: LayoutDashboard },
  { id: 'revenue',    label: 'Revenue & Finances',icon: TrendingUp },
  { id: 'approvals',  label: 'Driver Approvals',  icon: Car },
  { id: 'payouts',    label: 'Payouts',           icon: Banknote },
  { id: 'reports',    label: 'Reports & Fleet',   icon: Flag },
  { id: 'users',      label: 'Users Directory',   icon: Users },
  { id: 'security',   label: 'Security Logs',     icon: ShieldAlert },
]

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
}

function formatDateTime(dateStr?: string | Date) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(dateStr)
  }
}

// ─── Custom Glowing Chart Tooltip ───
function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl px-4 py-3 bg-[#0d121f]/95 border border-white/10 shadow-2xl backdrop-blur-xl">
      <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => {
          const isCurrency = entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('payout') || entry.name.toLowerCase().includes('naira') || entry.name.toLowerCase().includes('earnings')
          const val = typeof entry.value === 'number'
            ? isCurrency ? `₦${entry.value.toLocaleString()}` : entry.value.toLocaleString()
            : entry.value
          return (
            <div key={i} className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ background: entry.color, color: entry.color }} />
              <span className="text-white/70">{entry.name}:</span>
              <span className="text-white font-black tabular-nums ml-auto pl-2">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    approved:  { label: 'Approved',  color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', dot: '#10B981' },
    completed: { label: 'Completed', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', dot: '#10B981' },
    pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)',  dot: '#F59E0B' },
    suspended: { label: 'Suspended', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', dot: '#EF4444' },
    rejected:  { label: 'Rejected',  color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', dot: '#EF4444' },
    cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', dot: '#EF4444' },
  }
  const s = map[status.toLowerCase()] ?? { label: status, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', dot: '#94a3b8' }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/5"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_6px_currentColor]" style={{ background: s.dot, color: s.dot }} />
      {s.label}
    </span>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [securityLogs, setSecurityLogs] = useState<any[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [pulse, setPulse] = useState(false)
  const [chartMode, setChartMode] = useState<'all' | 'trips' | 'revenue' | 'drops'>('trips')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchData = async () => {
    const start = Date.now()
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        setData(await res.json())
        setPulse(true)
        setTimeout(() => setPulse(false), 600)
      } else if (res.status === 401) {
        router.push('/auth')
      }
    } catch (e) {
      console.error('Error fetching admin stats:', e)
    } finally {
      const elapsed = Date.now() - start
      if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed))
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab')
      if (tabParam && NAV_ITEMS.some(n => n.id === tabParam)) {
        setActiveTab(tabParam)
      }
    }
  }, [])

  const fetchSecurityLogs = async () => {
    setSecurityLoading(true)
    try {
      const res = await fetch('/api/portal/audit-log')
      if (res.ok) {
        const json = await res.json()
        setSecurityLogs(Array.isArray(json) ? json : (json?.logs || []))
      }
    } catch (e) {
      console.error('Error fetching security logs:', e)
    } finally {
      setSecurityLoading(false)
    }
  }

  const fetchRevenue = async () => {
    setRevenueLoading(true)
    try {
      const res = await fetch('/api/admin/revenue')
      if (res.ok) {
        const json = await res.json()
        const rows = Array.isArray(json) ? json : (json?.platformRevenues || [])
        setRevenueData(Array.isArray(rows) ? rows : [])
      } else {
        setRevenueData([])
      }
    } catch (e) {
      console.error('Error fetching revenue:', e)
      setRevenueData([])
    } finally {
      setRevenueLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'security' && securityLogs.length === 0) fetchSecurityLogs()
    if (activeTab === 'revenue' && revenueData.length === 0) fetchRevenue()
  }, [activeTab])

  const handleAction = async (driverId: string, action: 'approve' | 'reject' | 'suspend' | 'unsuspend') => {
    setProcessing(driverId)
    try {
      const res = await fetch('/api/admin/drivers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action }),
      })
      if (res.ok) {
        await fetchData()
      } else {
        const err = await res.json()
        alert(err.message || 'Action failed')
      }
    } catch (e) {
      console.error(e)
      alert('Network error')
    } finally {
      setProcessing(null)
    }
  }

  const handlePayoutAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/withdrawals/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action })
      })
      if (res.ok) {
        await fetchData()
      } else {
        const err = await res.json()
        alert(err.message || 'Action failed')
      }
    } catch (e) {
      console.error(e)
      alert('Network error')
    } finally {
      setProcessing(null)
    }
  }

  // ─── Data Extraction & Computed Event Arrays ───
  const rawStats = data?.stats || {}
  const stats = {
    totalUsers: rawStats.totalUsers ?? 0,
    totalDrivers: rawStats.totalDrivers ?? 0,
    totalTrips: rawStats.totalTrips ?? 0,
    completedTrips: rawStats.completedTrips ?? 0,
    pendingTrips: rawStats.pendingTrips ?? 0,
    cancelledTrips: rawStats.cancelledTrips ?? 0,
    platformRevenue: rawStats.platformRevenue ?? 0,
    driverPayouts: rawStats.driverPayouts ?? 0,
    dropsSold: rawStats.dropsSold ?? 0,
    nairaCollected: rawStats.nairaCollected ?? 0,
    totalReferrals: rawStats.totalReferrals ?? 0,
  }

  const dailyEvents: any[] = Array.isArray(data?.dailyEvents) ? data.dailyEvents : []
  const tripDistribution: any[] = Array.isArray(data?.tripDistribution) ? data.tripDistribution : []
  const fleetDistribution: any[] = Array.isArray(data?.fleetDistribution) ? data.fleetDistribution : []
  const recentActivity: any[] = Array.isArray(data?.recentActivity) ? data.recentActivity : []

  const driversList: any[] = Array.isArray(data?.drivers) ? data.drivers : []
  const pendingDrivers = driversList.filter((d: any) => d.status === 'PENDING')
  const suspendedDrivers = driversList.filter((d: any) => d.status === 'SUSPENDED')

  const withdrawalRequests: any[] = Array.isArray(data?.withdrawalRequests) ? data.withdrawalRequests : []
  const pendingPayouts = withdrawalRequests.filter((r: any) => r.status === 'PENDING')

  const ridersList: any[] = (Array.isArray(data?.users) ? data.users : []).map((u: any) => ({
    ...u,
    type: 'Rider',
    detailStatus: 'approved',
  }))
  const driverUsersList: any[] = driversList.map((d: any) => ({
    ...d.user,
    id: d.userId || d.user?.id,
    type: 'Driver',
    detailStatus: d.status?.toLowerCase() || 'pending',
    trips: d.totalTrips ?? 0,
    rating: d.rating ?? 0,
    driverProfile: d,
  }))

  const allUsers = useMemo(() => {
    return [...ridersList, ...driverUsersList].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  }, [ridersList, driverUsersList])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers
    const s = search.toLowerCase()
    return allUsers.filter((u: any) =>
      u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
    )
  }, [allUsers, search])

  const totalRevenueAmount = Array.isArray(revenueData)
    ? revenueData.reduce((acc: number, row: any) => acc + (Number(row.amount) || 0), 0)
    : 0
  const totalTransactionsCount = Array.isArray(revenueData) ? revenueData.length : 0
  const avgRevenuePerTrip = totalTransactionsCount > 0 ? totalRevenueAmount / totalTransactionsCount : 0

  const activeNavItem = NAV_ITEMS.find(n => n.id === activeTab)

  // Completion Rate Percentage
  const tripCompletionRate = stats.totalTrips > 0
    ? Math.round((stats.completedTrips / stats.totalTrips) * 100)
    : 100

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white"
      style={{
        background: 'radial-gradient(ellipse at top left, #141b2d 0%, #080b12 60%, #05070c 100%)',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>

      {/* ── Ambient Background Glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      {/* ── Top Header / Command Center ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] backdrop-blur-2xl bg-[#090d16]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Live Status Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative group"
              style={{
                background: 'linear-gradient(135deg, #FF6B00 0%, #D946EF 100%)',
                boxShadow: '0 0 20px rgba(255, 107, 0, 0.4)'
              }}>
              <Zap className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-[#090d16] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  TOVE<span className="text-orange-500">DROP</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                  COMMAND HQ
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                Live Campus Telemetry
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08]">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const badgeCount = id === 'approvals' ? pendingDrivers.length : (id === 'payouts' ? pendingPayouts.length : 0)

              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileNav(false) }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative",
                    active
                      ? "text-white bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/40 shadow-[0_0_15px_rgba(255,107,0,0.15)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", active ? "text-orange-400" : "text-white/40")} />
                  {label}
                  {badgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-orange-500 text-white shadow-[0_0_8px_rgba(255,107,0,0.6)]">
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="Refresh Telemetry"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", pulse && "animate-spin text-orange-400")} />
            </button>

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-[10px] font-black text-black">
                AD
              </div>
              <span className="text-xs font-bold text-white">Administrator</span>
            </div>

            <button
              onClick={() => setMobileNav(v => !v)}
              className="xl:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white cursor-pointer"
            >
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNav && (
          <div className="xl:hidden px-4 py-3 bg-[#0c101c] border-b border-white/[0.08] space-y-1 animate-in fade-in slide-in-from-top-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const badgeCount = id === 'approvals' ? pendingDrivers.length : (id === 'payouts' ? pendingPayouts.length : 0)

              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileNav(false) }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    active
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  {badgeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white">
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* ── Top Alert Banner for Pending Approvals / Payouts ── */}
        {(pendingDrivers.length > 0 || pendingPayouts.length > 0) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDrivers.length > 0 && (
              <div
                onClick={() => setActiveTab('approvals')}
                className="group p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 107, 0, 0.05) 100%)',
                  border: '1px solid rgba(255, 107, 0, 0.3)',
                  boxShadow: '0 0 25px rgba(255, 107, 0, 0.1)'
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                      {pendingDrivers.length} Driver Application{pendingDrivers.length > 1 ? 's' : ''} Awaiting Review
                    </h4>
                    <p className="text-xs text-white/60">Tap to inspect driver licenses, vehicles, and approve</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>
            )}

            {pendingPayouts.length > 0 && (
              <div
                onClick={() => setActiveTab('payouts')}
                className="group p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.1)'
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {pendingPayouts.length} Driver Withdrawal Request{pendingPayouts.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-xs text-white/60">Disburse settled ride earnings to bank accounts</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <Skeleton width={36} height={36} className="rounded-xl" />
                  <Skeleton width={80} height={28} />
                  <Skeleton width={120} height={12} />
                </div>
              ))}
            </div>
            <div className="h-96 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & INTERACTIVE EVENT GRAPHS
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">

            {/* ── Top Level Event Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Rides */}
              <div className="p-5 rounded-2xl bg-[#101422]/70 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Car className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                    <ArrowUpRight className="w-3 h-3" /> Live
                  </span>
                </div>
                <p className="text-3xl font-black text-white tabular-nums tracking-tight mb-1">
                  {stats.totalTrips.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Total Rides Booked</span>
                  <span className="text-emerald-400 font-bold">{tripCompletionRate}% complete</span>
                </div>
              </div>

              {/* Platform Revenue */}
              <div className="p-5 rounded-2xl bg-[#101422]/70 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Month
                  </span>
                </div>
                <p className="text-3xl font-black text-white tabular-nums tracking-tight mb-1">
                  ₦{stats.platformRevenue.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Net Commission Earned</span>
                  <span className="text-white/70 font-semibold">{totalTransactionsCount} tx</span>
                </div>
              </div>

              {/* Verified Drivers */}
              <div className="p-5 rounded-2xl bg-[#101422]/70 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Fleet
                  </span>
                </div>
                <p className="text-3xl font-black text-white tabular-nums tracking-tight mb-1">
                  {stats.totalDrivers.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Active Drivers</span>
                  <span className="text-orange-400 font-bold">{pendingDrivers.length} waiting</span>
                </div>
              </div>

              {/* Total Community Riders */}
              <div className="p-5 rounded-2xl bg-[#101422]/70 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Riders
                  </span>
                </div>
                <p className="text-3xl font-black text-white tabular-nums tracking-tight mb-1">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Registered Students</span>
                  <span className="text-white/70 font-semibold">{stats.dropsSold} drops sold</span>
                </div>
              </div>
            </div>

            {/* ── 🚀 HERO GRAPH: INTERACTIVE MULTI-EVENT TIMELINE ── */}
            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_#FF6B00]" />
                    <h3 className="text-lg font-black text-white tracking-tight">Event Telemetry Matrix</h3>
                  </div>
                  <p className="text-xs text-white/50">Daily distribution of platform events over the last 7 days</p>
                </div>

                {/* Graph Event Selector Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                  {[
                    { id: 'trips',   label: '🚗 Trips',     color: '#FF6B00' },
                    { id: 'revenue', label: '💰 Revenue',   color: '#10B981' },
                    { id: 'drops',   label: '🎟️ Drops',     color: '#8B5CF6' },
                    { id: 'all',     label: '⚡ Combined',  color: '#3B82F6' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setChartMode(tab.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        chartMode === tab.id
                          ? "bg-white/10 text-white shadow-lg border border-white/20"
                          : "text-white/50 hover:text-white"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-[340px] w-full">
                {isMounted && dailyEvents.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyEvents} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="driverPayoutsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="dropsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                      <Tooltip content={<CustomChartTooltip />} />

                      {/* Dynamic Curves depending on selected tab */}
                      {(chartMode === 'trips' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="trips" name="Total Trips" stroke="#FF6B00" strokeWidth={3} fill="url(#tripsGrad)" dot={{ r: 4, fill: '#FF6B00', strokeWidth: 2, stroke: '#090d16' }} />
                      )}
                      {(chartMode === 'trips' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="completedTrips" name="Completed Trips" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" fill="url(#completedGrad)" dot={{ r: 3, fill: '#10B981' }} />
                      )}

                      {(chartMode === 'revenue' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="revenue" name="Platform Revenue (₦)" stroke="#10B981" strokeWidth={3} fill="url(#revenueGrad)" dot={{ r: 4, fill: '#10B981' }} />
                      )}
                      {(chartMode === 'revenue' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="driverEarnings" name="Driver Payouts (₦)" stroke="#3B82F6" strokeWidth={2} fill="url(#driverPayoutsGrad)" dot={{ r: 3, fill: '#3B82F6' }} />
                      )}

                      {(chartMode === 'drops' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="dropsCount" name="Drops Purchased" stroke="#8B5CF6" strokeWidth={3} fill="url(#dropsGrad)" dot={{ r: 4, fill: '#8B5CF6' }} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-white/40 gap-2">
                    <BarChart3 className="w-8 h-8 opacity-40" />
                    <p className="text-xs">No graph events recorded in the last 7 days.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── 2-COLUMN EVENT GRAPHS & BREAKDOWNS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Graph 2: Trip Status Donut Distribution */}
              <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-400" />
                      Trip Status Breakdown
                    </h4>
                    <span className="text-[10px] font-bold text-white/40">{stats.totalTrips} Total</span>
                  </div>

                  <div className="h-56 relative flex items-center justify-center">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tripDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={88}
                            paddingAngle={4}
                            stroke="none"
                          >
                            {tripDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    {/* Centered Stat Badge */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-white tabular-nums leading-none">
                        {tripCompletionRate}%
                      </span>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">
                        Success
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  {tripDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-white/60 font-medium truncate">{item.name}:</span>
                      <span className="text-xs font-bold text-white ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graph 3: Daily Revenue & Payout Comparison Bar Chart */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        Daily Revenue vs Driver Payouts
                      </h4>
                      <p className="text-[11px] text-white/40 mt-0.5">Platform commission (₦) vs Driver cash-out volume</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Settled Flow
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    {isMounted && dailyEvents.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyEvents} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                          <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar dataKey="revenue" name="Platform Revenue (₦)" fill="#FF6B00" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="driverEarnings" name="Driver Payouts (₦)" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-white/40 text-xs">
                        No financial events to graph
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-white/[0.06] text-white/60">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF6B00]" /> Platform Cut</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" /> Driver Share</span>
                  </div>
                  <span className="text-[11px] font-semibold text-white/40">7-Day Aggregation</span>
                </div>
              </div>
            </div>

            {/* ── LIVE ACTIVITY EVENT STREAM ── */}
            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981] animate-ping" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live Event Activity Stream</h4>
                </div>
                <span className="text-xs text-white/40 font-medium">Auto-refreshes in background</span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-xs">
                  No recent events recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentActivity.map((event: any) => {
                    const isTrip = event.type === 'TRIP'
                    return (
                      <div key={event.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/20 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                            isTrip
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          )}>
                            {isTrip ? <Car className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{event.title}</p>
                            <p className="text-[11px] text-white/50 truncate">{event.desc}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={event.status || 'completed'} />
                          <p className="text-[10px] text-white/40 mt-1">{formatDateTime(event.time)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: REVENUE & FINANCES
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'revenue' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-[#101422]/70 border border-orange-500/30 backdrop-blur-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Total Net Revenue</span>
                <p className="text-3xl font-black text-white mt-1">₦{totalRevenueAmount.toLocaleString()}</p>
                <p className="text-xs text-white/50 mt-1">Settled commission earnings</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#101422]/70 border border-white/[0.08] backdrop-blur-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Monetized Rides</span>
                <p className="text-3xl font-black text-white mt-1">{totalTransactionsCount}</p>
                <p className="text-xs text-white/50 mt-1">Recorded trip fees</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#101422]/70 border border-white/[0.08] backdrop-blur-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Average Cut / Trip</span>
                <p className="text-3xl font-black text-white mt-1">₦{avgRevenuePerTrip.toFixed(2)}</p>
                <p className="text-xs text-white/50 mt-1">Platform yield per ride</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Revenue Ledger & Commission Records</h3>
                <span className="text-xs text-white/40 font-medium">{revenueData.length} Entries</span>
              </div>

              {revenueLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : revenueData.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs">
                  No revenue records found.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {revenueData.map((row: any, i: number) => {
                    const title = row.trip?.pickup && row.trip?.destination
                      ? `${row.trip.pickup} → ${row.trip.destination}`
                      : row.label || `Platform Commission #${i + 1}`
                    const driverName = row.trip?.driver?.name ? `Driver: ${row.trip.driver.name}` : null

                    return (
                      <div key={row.id ?? i} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-white">{title}</p>
                          <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                            {driverName && <span>{driverName}</span>}
                            <span>•</span>
                            <span>{formatDateTime(row.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-orange-400 tabular-nums">
                            +₦{Number(row.amount || 0).toLocaleString()}
                          </span>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Settled</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: DRIVER APPROVALS
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'approvals' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-white">Driver Verification Applications</h3>
                <p className="text-xs text-white/50">Verify identity, license credentials, and vehicles before approving</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {pendingDrivers.length} Pending
              </span>
            </div>

            {pendingDrivers.length === 0 ? (
              <div className="p-16 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-60" />
                <h4 className="text-base font-bold text-white">All Caught Up!</h4>
                <p className="text-xs text-white/50">There are no pending driver verification requests at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingDrivers.map((d: any) => {
                  const driverId = d.userId || d.id
                  return (
                    <div key={driverId} className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border border-white/10">
                              <AvatarFallback className="font-black bg-orange-500/20 text-orange-400">
                                {initials(d.user?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-base font-bold text-white">{d.user?.name}</h4>
                              <p className="text-xs text-white/50">{d.user?.email}</p>
                            </div>
                          </div>
                          <StatusBadge status="pending" />
                        </div>

                        {/* Vehicle & Identity Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] mb-5">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Vehicle</span>
                            <span className="text-xs font-bold text-white">{d.vehicleMake || d.vehicleModel ? `${d.vehicleMake ?? ''} ${d.vehicleModel ?? ''}` : '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Plate</span>
                            <span className="text-xs font-bold text-white uppercase">{d.vehiclePlate ?? d.licensePlate ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Colour</span>
                            <span className="text-xs font-bold text-white">{d.vehicleColor ?? d.vehicleColour ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Phone</span>
                            <span className="text-xs font-bold text-white">{d.phone ?? d.user?.phoneNumber ?? d.area ?? '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                        <button
                          disabled={processing === driverId}
                          onClick={() => handleAction(driverId, 'approve')}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {processing === driverId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve Driver
                        </button>
                        <button
                          disabled={processing === driverId}
                          onClick={() => handleAction(driverId, 'reject')}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: PAYOUTS (DRIVER WITHDRAWALS)
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'payouts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[#101422]/70 border border-orange-500/30 backdrop-blur-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Pending Requests</span>
                <p className="text-3xl font-black text-white mt-1">{pendingPayouts.length}</p>
                <p className="text-xs text-white/50 mt-1">Awaiting bank settlement</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#101422]/70 border border-emerald-500/30 backdrop-blur-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Total Driver Cashouts</span>
                <p className="text-3xl font-black text-white mt-1">₦{stats.driverPayouts.toLocaleString()}</p>
                <p className="text-xs text-white/50 mt-1">Processed driver earnings</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Pending Driver Withdrawals</h3>
              {pendingPayouts.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-xs">
                  No pending withdrawal requests. All drivers have been settled.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {pendingPayouts.map((req: any) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-white/10">
                          <AvatarFallback className="font-bold bg-orange-500/20 text-orange-400">
                            {initials(req.driver?.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-white">{req.driver?.user?.name || 'Driver'}</p>
                          <p className="text-xs text-white/50 font-mono">
                            {req.driver?.bankName ?? 'Bank'} • {req.driver?.accountNumber ?? 'Account'} ({req.driver?.accountName ?? ''})
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">{formatDateTime(req.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-lg font-black text-emerald-400 tabular-nums">
                          ₦{Number(req.amount || 0).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={processing === req.id}
                            onClick={() => handlePayoutAction(req.id, 'approve')}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {processing === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            disabled={processing === req.id}
                            onClick={() => handlePayoutAction(req.id, 'reject')}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: REPORTS & SUSPENDED FLEET
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Suspended Driver Accounts</h3>
              {suspendedDrivers.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-xs">
                  No drivers are currently suspended. Fleet health is optimal.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {suspendedDrivers.map((d: any) => {
                    const driverId = d.userId || d.id
                    return (
                      <div key={driverId} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-white/10">
                            <AvatarFallback className="font-bold bg-red-500/20 text-red-400">
                              {initials(d.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-white">{d.user?.name}</p>
                            <p className="text-xs text-white/50">{d.user?.email}</p>
                            <p className="text-[10px] text-white/40">{d.totalTrips ?? d.trips ?? 0} total trips completed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status="suspended" />
                          <button
                            disabled={processing === driverId}
                            onClick={() => handleAction(driverId, 'unsuspend')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                          >
                            Un-suspend
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 6: USERS DIRECTORY
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search riders or drivers by name or email…"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <span className="text-xs font-semibold text-white/50">{filteredUsers.length} Users found</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <th className="pb-3 px-3">User Profile</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Activity</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-white/40">
                          No users match "{search}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user: any, idx: number) => {
                        const isDriver = user.type === 'Driver'
                        return (
                          <tr key={user.id ?? idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 border border-white/10">
                                  <AvatarFallback className={cn("text-[10px] font-bold", isDriver ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400")}>
                                    {initials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{user.name || 'Unnamed'}</p>
                                  <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                isDriver ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              )}>
                                {user.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs text-white/70 font-medium">
                              {isDriver ? `${user.trips ?? 0} trips` : `${user.dropsBalance ?? 0} drops`}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={user.detailStatus ?? 'approved'} />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all cursor-pointer"
                                  title="Inspect User Activity"
                                >
                                  View
                                </button>
                                {isDriver && user.detailStatus === 'approved' && (
                                  <button
                                    disabled={processing === user.id}
                                    onClick={() => handleAction(user.id, 'suspend')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {isDriver && user.detailStatus === 'suspended' && (
                                  <button
                                    disabled={processing === user.id}
                                    onClick={() => handleAction(user.id, 'unsuspend')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 7: SECURITY LOGS
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-[#0f1422]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Administrator Login Audit Log</h3>
                  <p className="text-xs text-white/50">Tracking authorized and unauthorized access attempts to HQ</p>
                </div>
                <button
                  onClick={fetchSecurityLogs}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", securityLoading && "animate-spin text-orange-400")} />
                  Refresh
                </button>
              </div>

              {securityLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : securityLogs.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs">
                  No login attempts recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <th className="pb-3 px-3">Timestamp</th>
                        <th className="pb-3 px-3">Admin Email</th>
                        <th className="pb-3 px-3">Result</th>
                        <th className="pb-3 px-3">IP Address</th>
                        <th className="pb-3 px-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {securityLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 text-xs text-white/60 tabular-nums">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-xs font-bold text-white">
                            {log.email}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={log.success ? 'approved' : 'rejected'} />
                          </td>
                          <td className="py-3 px-3 text-xs text-white/60 font-mono">
                            {log.ipAddress || '—'}
                          </td>
                          <td className="py-3 px-3 text-xs text-white/40 max-w-xs truncate">
                            {log.userAgent || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── User Activity Modal ── */}
      {selectedUser && (
        <UserActivityModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

    </div>
  )
}
