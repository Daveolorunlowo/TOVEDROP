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
  PieChart as PieIcon, Zap, LogOut, Copy, CheckCheck,
  CreditCard, FileText, PhoneCall
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/shared/Skeleton'
import { UserActivityModal } from '@/components/admin/UserActivityModal'
import { cn } from '@/lib/utils'

// ─── Tovedrop Design Tokens ───
const ORANGE = 'var(--orange-brand, #F97316)'
const ORANGE_DARK = 'var(--orange-dark, #EA580C)'
const GREEN = 'var(--status-success, #22C55E)'
const BLUE = '#3B82F6'
const PURPLE = '#A855F7'
const RED = 'var(--status-danger, #EF4444)'

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

// ─── Custom Responsive Chart Tooltip matching Tovedrop theme ───
function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl px-4 py-3 bg-card text-card-foreground border border-border shadow-2xl backdrop-blur-xl">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => {
          const isCurrency = entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('payout') || entry.name.toLowerCase().includes('naira') || entry.name.toLowerCase().includes('earnings')
          const val = typeof entry.value === 'number'
            ? isCurrency ? `₦${entry.value.toLocaleString()}` : entry.value.toLocaleString()
            : entry.value
          return (
            <div key={i} className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="text-foreground font-black tabular-nums ml-auto pl-2">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    approved:  { label: 'Approved',  color: 'var(--status-success, #22C55E)', bg: 'rgba(34, 197, 94, 0.12)', dot: 'var(--status-success, #22C55E)' },
    completed: { label: 'Completed', color: 'var(--status-success, #22C55E)', bg: 'rgba(34, 197, 94, 0.12)', dot: 'var(--status-success, #22C55E)' },
    pending:   { label: 'Pending',   color: 'var(--orange-brand, #F97316)',   bg: 'rgba(249, 115, 22, 0.12)', dot: 'var(--orange-brand, #F97316)' },
    suspended: { label: 'Suspended', color: 'var(--status-danger, #EF4444)',  bg: 'rgba(239, 68, 68, 0.12)',  dot: 'var(--status-danger, #EF4444)' },
    rejected:  { label: 'Rejected',  color: 'var(--status-danger, #EF4444)',  bg: 'rgba(239, 68, 68, 0.12)',  dot: 'var(--status-danger, #EF4444)' },
    cancelled: { label: 'Cancelled', color: 'var(--status-danger, #EF4444)',  bg: 'rgba(239, 68, 68, 0.12)',  dot: 'var(--status-danger, #EF4444)' },
  }
  const s = map[status.toLowerCase()] ?? { label: status, color: 'var(--muted-foreground)', bg: 'var(--border-subtle, rgba(0,0,0,0.06))', dot: 'var(--muted-foreground)' }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border/50"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [payoutSubTab, setPayoutSubTab] = useState<'pending' | 'settled' | 'all'>('pending')
  const [driverSubTab, setDriverSubTab] = useState<'pending' | 'active' | 'suspended' | 'all'>('pending')
  const [driverSearch, setDriverSearch] = useState('')
  const [payoutSearch, setPayoutSearch] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    type: 'driver' | 'payout'
    id: string
    action: string
    title: string
    description: string
    confirmLabel: string
    confirmVariant?: 'danger' | 'success'
  } | null>(null)

  const copyBankDetails = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const executeConfirmedAction = async () => {
    if (!confirmModal) return
    const { type, id, action } = confirmModal
    setConfirmModal(null)
    if (type === 'driver') {
      await handleAction(id, action as any)
    } else if (type === 'payout') {
      await handlePayoutAction(id, action as any)
    }
  }

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

    const handleRealtimeAdminEvent = () => {
      fetchData()
    }
    const handleRealtimeTripUpdated = () => {
      fetchData()
    }

    window.addEventListener('tovedrop:admin-event', handleRealtimeAdminEvent)
    window.addEventListener('tovedrop:trip-updated', handleRealtimeTripUpdated)

    return () => {
      window.removeEventListener('tovedrop:admin-event', handleRealtimeAdminEvent)
      window.removeEventListener('tovedrop:trip-updated', handleRealtimeTripUpdated)
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
  const approvedDrivers = driversList.filter((d: any) => d.status === 'APPROVED')
  const suspendedDrivers = driversList.filter((d: any) => d.status === 'SUSPENDED')

  const filteredDriversByTab = useMemo(() => {
    let list = driversList
    if (driverSubTab === 'pending') list = pendingDrivers
    else if (driverSubTab === 'active') list = approvedDrivers
    else if (driverSubTab === 'suspended') list = suspendedDrivers
    
    if (!driverSearch.trim()) return list
    const q = driverSearch.toLowerCase()
    return list.filter((d: any) => 
      d.user?.name?.toLowerCase().includes(q) ||
      d.user?.email?.toLowerCase().includes(q) ||
      d.phone?.toLowerCase().includes(q) ||
      d.licensePlate?.toLowerCase().includes(q) ||
      d.vehiclePlate?.toLowerCase().includes(q) ||
      d.licenseNumber?.toLowerCase().includes(q)
    )
  }, [driverSubTab, driversList, pendingDrivers, approvedDrivers, suspendedDrivers, driverSearch])

  const withdrawalRequests: any[] = Array.isArray(data?.withdrawalRequests) ? data.withdrawalRequests : []
  const pendingPayouts = withdrawalRequests.filter((r: any) => r.status === 'PENDING')
  const settledPayouts = withdrawalRequests.filter((r: any) => r.status !== 'PENDING')

  const pendingPayoutsAmount = pendingPayouts.reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0)
  const settledPayoutsAmount = settledPayouts.filter((r: any) => r.status === 'APPROVED').reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0)

  const filteredPayoutsByTab = useMemo(() => {
    let list = withdrawalRequests
    if (payoutSubTab === 'pending') list = pendingPayouts
    else if (payoutSubTab === 'settled') list = settledPayouts
    
    if (!payoutSearch.trim()) return list
    const q = payoutSearch.toLowerCase()
    return list.filter((r: any) => 
      r.driver?.user?.name?.toLowerCase().includes(q) ||
      r.driver?.bankName?.toLowerCase().includes(q) ||
      r.driver?.accountNumber?.includes(q) ||
      r.driver?.accountName?.toLowerCase().includes(q)
    )
  }, [payoutSubTab, withdrawalRequests, pendingPayouts, settledPayouts, payoutSearch])

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
    <div className="min-h-screen text-foreground flex flex-col selection:bg-orange-brand selection:text-primary-foreground"
      style={{
        background: 'transparent',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>

      {/* ── Top Header / Command Center ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Live Status Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--orange-brand, #F97316) 0%, var(--orange-dark, #EA580C) 100%)',
              }}>
              <Zap className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-foreground">
                  TOVE<span className="text-orange-brand">DROP</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-brand/10 text-orange-brand border border-orange-brand/20">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_var(--status-success)]" />
                Live Campus Telemetry
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 bg-surface-elevated/70 p-1 rounded-xl border border-border">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const badgeCount = id === 'approvals' ? pendingDrivers.length : (id === 'payouts' ? pendingPayouts.length : 0)

              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileNav(false) }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                    active
                      ? "text-orange-brand bg-card shadow-sm border border-border font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", active ? "text-orange-brand" : "text-muted-foreground")} />
                  {label}
                  {badgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-orange-brand text-white shadow-sm">
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card hover:bg-surface-elevated border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={cn("w-4 h-4", pulse && "animate-spin text-orange-brand")} />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-orange-brand text-white flex items-center justify-center text-[10px] font-black">
                AD
              </div>
              <span className="text-xs font-bold text-foreground">Admin</span>
            </div>

            {/* Log Out Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out of Admin Portal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-red-500/10 border border-border hover:border-red-500/30 text-muted-foreground hover:text-red-500 transition-all text-xs font-bold cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

            <button
              onClick={() => setMobileNav(v => !v)}
              className="xl:hidden p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNav && (
          <div className="xl:hidden px-4 py-3 bg-card border-b border-border space-y-1 animate-in fade-in slide-in-from-top-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const badgeCount = id === 'approvals' ? pendingDrivers.length : (id === 'payouts' ? pendingPayouts.length : 0)

              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileNav(false) }}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    active
                      ? "bg-orange-brand/10 text-orange-brand border border-orange-brand/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  {badgeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-brand text-white">
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Mobile Log Out Button */}
            <div className="pt-2 mt-2 border-t border-border">
              <button
                onClick={() => { setMobileNav(false); setShowLogoutConfirm(true) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of HQ
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative z-10">

        {/* ── Top Alert Banner for Pending Approvals / Payouts ── */}
        {(pendingDrivers.length > 0 || pendingPayouts.length > 0) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDrivers.length > 0 && (
              <div
                onClick={() => setActiveTab('approvals')}
                className="group p-4 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between bg-card border border-orange-brand/30 shadow-sm hover:border-orange-brand"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center text-orange-brand group-hover:scale-105 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-orange-brand transition-colors">
                      {pendingDrivers.length} Driver Application{pendingDrivers.length > 1 ? 's' : ''} Awaiting Review
                    </h4>
                    <p className="text-xs text-muted-foreground">Tap to review vehicles, plate numbers, and approve</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-brand group-hover:translate-x-1 transition-transform" />
              </div>
            )}

            {pendingPayouts.length > 0 && (
              <div
                onClick={() => setActiveTab('payouts')}
                className="group p-4 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between bg-card border border-emerald-500/30 shadow-sm hover:border-emerald-500"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                      {pendingPayouts.length} Driver Withdrawal Request{pendingPayouts.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-xs text-muted-foreground">Disburse settled ride earnings to bank accounts</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-5 bg-card border border-border space-y-3 shadow-sm">
                  <Skeleton width={36} height={36} className="rounded-xl" />
                  <Skeleton width={80} height={28} />
                  <Skeleton width={120} height={12} />
                </div>
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-card border border-border p-6 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-brand" />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & INTERACTIVE EVENT GRAPHS
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* ── Top Level Event Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Rides */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:border-orange-brand/50 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center text-orange-brand">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight mb-1">
                  {stats.totalTrips.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Rides Booked</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tripCompletionRate}% done</span>
                </div>
              </div>

              {/* Platform Revenue */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:border-emerald-500/50 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Month
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight mb-1">
                  ₦{stats.platformRevenue.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Net Commission</span>
                  <span className="font-semibold">{totalTransactionsCount} tx</span>
                </div>
              </div>

              {/* Verified Drivers */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:border-blue-500/50 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Fleet
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight mb-1">
                  {stats.totalDrivers.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Active Drivers</span>
                  <span className="text-orange-brand font-bold">{pendingDrivers.length} waiting</span>
                </div>
              </div>

              {/* Total Community Riders */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:border-purple-500/50 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Riders
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight mb-1">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Students</span>
                  <span className="font-semibold">{stats.dropsSold} drops sold</span>
                </div>
              </div>
            </div>

            {/* ── 🚀 HERO GRAPH: INTERACTIVE MULTI-EVENT TIMELINE ── */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-brand shadow-sm" />
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Event Telemetry Matrix</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Daily distribution of platform events over the last 7 days</p>
                </div>

                {/* Graph Event Selector Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-elevated border border-border">
                  {[
                    { id: 'trips',   label: '🚗 Trips' },
                    { id: 'revenue', label: '💰 Revenue' },
                    { id: 'drops',   label: '🎟️ Drops' },
                    { id: 'all',     label: '⚡ Combined' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setChartMode(tab.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        chartMode === tab.id
                          ? "bg-card text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-[320px] w-full">
                {isMounted && dailyEvents.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyEvents} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="driverPayoutsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="dropsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(120,120,120,0.15))" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <YAxis stroke="var(--muted-foreground)" tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <Tooltip content={<CustomChartTooltip />} />

                      {(chartMode === 'trips' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="trips" name="Total Trips" stroke="#F97316" strokeWidth={3} fill="url(#tripsGrad)" dot={{ r: 4, fill: '#F97316' }} />
                      )}
                      {(chartMode === 'trips' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="completedTrips" name="Completed Trips" stroke="#22C55E" strokeWidth={2} strokeDasharray="4 4" fill="url(#completedGrad)" dot={{ r: 3, fill: '#22C55E' }} />
                      )}

                      {(chartMode === 'revenue' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="revenue" name="Platform Revenue (₦)" stroke="#F97316" strokeWidth={3} fill="url(#revenueGrad)" dot={{ r: 4, fill: '#F97316' }} />
                      )}
                      {(chartMode === 'revenue' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="driverEarnings" name="Driver Payouts (₦)" stroke="#3B82F6" strokeWidth={2} fill="url(#driverPayoutsGrad)" dot={{ r: 3, fill: '#3B82F6' }} />
                      )}

                      {(chartMode === 'drops' || chartMode === 'all') && (
                        <Area type="monotone" dataKey="dropsCount" name="Drops Purchased" stroke="#A855F7" strokeWidth={3} fill="url(#dropsGrad)" dot={{ r: 4, fill: '#A855F7' }} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <BarChart3 className="w-8 h-8 opacity-40" />
                    <p className="text-xs">No graph events recorded in the last 7 days.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── 2-COLUMN EVENT GRAPHS & BREAKDOWNS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Graph 2: Trip Status Donut Distribution */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-500" />
                      Trip Status Breakdown
                    </h4>
                    <span className="text-[10px] font-bold text-muted-foreground">{stats.totalTrips} Total</span>
                  </div>

                  <div className="h-52 relative flex items-center justify-center">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tripDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={58}
                            outerRadius={82}
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
                      <span className="text-2xl font-black text-foreground tabular-nums leading-none">
                        {tripCompletionRate}%
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Success
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                  {tripDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-muted-foreground font-medium truncate">{item.name}:</span>
                      <span className="text-xs font-bold text-foreground ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graph 3: Daily Revenue & Payout Comparison Bar Chart */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-brand" />
                        Daily Revenue vs Driver Payouts
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Platform commission (₦) vs Driver earnings volume</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Settled
                    </span>
                  </div>

                  <div className="h-60 w-full">
                    {isMounted && dailyEvents.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyEvents} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(120,120,120,0.15))" vertical={false} />
                          <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                          <YAxis stroke="var(--muted-foreground)" tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar dataKey="revenue" name="Platform Revenue (₦)" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="driverEarnings" name="Driver Payouts (₦)" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                        No financial events to graph
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-border text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-brand" /> Platform Cut</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Driver Share</span>
                  </div>
                  <span className="text-[11px] font-semibold">7-Day Aggregation</span>
                </div>
              </div>
            </div>

            {/* ── LIVE ACTIVITY EVENT STREAM ── */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Live Event Activity Stream</h4>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Auto-synced telemetry</span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No recent events recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentActivity.map((event: any) => {
                    const isTrip = event.type === 'TRIP'
                    return (
                      <div key={event.id} className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border hover:border-orange-brand/30 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                            isTrip
                              ? "bg-orange-brand/10 text-orange-brand border-orange-brand/20"
                              : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          )}>
                            {isTrip ? <Car className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{event.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{event.desc}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={event.status || 'completed'} />
                          <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(event.time)}</p>
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
              <div className="p-6 rounded-xl bg-card border border-orange-brand/30 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-brand">Total Net Revenue</span>
                <p className="text-3xl font-black text-foreground mt-1">₦{totalRevenueAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Settled commission earnings</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Monetized Rides</span>
                <p className="text-3xl font-black text-foreground mt-1">{totalTransactionsCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Recorded trip fees</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Average Cut / Trip</span>
                <p className="text-3xl font-black text-foreground mt-1">₦{avgRevenuePerTrip.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Platform share per ride</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Revenue Ledger & Commission Records</h3>
                <span className="text-xs text-muted-foreground font-medium">{revenueData.length} Entries</span>
              </div>

              {revenueLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-brand" />
                </div>
              ) : revenueData.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-xs">
                  No revenue records found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {revenueData.map((row: any, i: number) => {
                    const title = row.trip?.pickup && row.trip?.destination
                      ? `${row.trip.pickup} → ${row.trip.destination}`
                      : row.label || `Platform Commission #${i + 1}`
                    const driverName = row.trip?.driver?.name ? `Driver: ${row.trip.driver.name}` : null

                    return (
                      <div key={row.id ?? i} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-foreground">{title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {driverName && <span>{driverName}</span>}
                            <span>•</span>
                            <span>{formatDateTime(row.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-orange-brand tabular-nums">
                            +₦{Number(row.amount || 0).toLocaleString()}
                          </span>
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">Settled</p>
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
            TAB 3: DRIVER APPROVALS & FLEET MANAGEMENT
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'approvals' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header with Sub-tabs and Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Driver Applications & Fleet Review</h3>
                <p className="text-xs text-muted-foreground">Verify driver identities, vehicle licenses, and manage campus fleet status</p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-elevated/70 border border-border self-start md:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setDriverSubTab('pending')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    driverSubTab === 'pending'
                      ? "bg-card text-orange-brand shadow-sm border border-border font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Pending</span>
                  <span className={cn("px-1.5 py-0.2 rounded-full text-[9px] font-black", driverSubTab === 'pending' ? "bg-orange-brand text-white" : "bg-muted text-muted-foreground")}>
                    {pendingDrivers.length}
                  </span>
                </button>
                <button
                  onClick={() => setDriverSubTab('active')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    driverSubTab === 'active'
                      ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Active Fleet</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-muted text-muted-foreground">
                    {approvedDrivers.length}
                  </span>
                </button>
                <button
                  onClick={() => setDriverSubTab('suspended')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    driverSubTab === 'suspended'
                      ? "bg-card text-red-500 shadow-sm border border-border font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Suspended</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-muted text-muted-foreground">
                    {suspendedDrivers.length}
                  </span>
                </button>
                <button
                  onClick={() => setDriverSubTab('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    driverSubTab === 'all'
                      ? "bg-card text-foreground shadow-sm border border-border font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>All ({driversList.length})</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search drivers by name, email, phone, plate, or license number..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-brand/30 shadow-sm transition-all"
              />
            </div>

            {/* Driver Cards Grid */}
            {filteredDriversByTab.length === 0 ? (
              <div className="p-16 rounded-2xl bg-card border border-border text-center space-y-3 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
                <h4 className="text-base font-bold text-foreground">
                  {driverSubTab === 'pending' ? 'All Caught Up!' : 'No Drivers Found'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {driverSubTab === 'pending'
                    ? 'There are no pending driver verification requests at this time.'
                    : 'No driver profiles matched your current filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDriversByTab.map((d: any) => {
                  const driverId = d.userId || d.id
                  const status = (d.status || 'PENDING').toLowerCase()
                  const isPending = status === 'pending'
                  const isApproved = status === 'approved'
                  const isSuspended = status === 'suspended'

                  return (
                    <div key={driverId} className="p-5 rounded-2xl bg-card border border-border hover:border-orange-brand/30 transition-all shadow-sm flex flex-col justify-between">
                      <div>
                        {/* Header: Driver Info & Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="w-11 h-11 border border-border shrink-0">
                              <AvatarFallback className="font-bold bg-orange-brand/15 text-orange-brand">
                                {initials(d.user?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-foreground truncate">{d.user?.name || 'Unnamed Driver'}</h4>
                              <p className="text-xs text-muted-foreground truncate">{d.user?.email || '—'}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Applied: {formatDateTime(d.createdAt)}</p>
                            </div>
                          </div>
                          <StatusBadge status={d.status || 'pending'} />
                        </div>

                        {/* Vehicle & Credentials Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface-elevated/70 border border-border mb-4 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Vehicle</span>
                            <span className="font-bold text-foreground truncate block">{d.vehicleMake || d.vehicleModel ? `${d.vehicleMake ?? ''} ${d.vehicleModel ?? ''}` : '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Plate No</span>
                            <span className="font-bold text-foreground uppercase truncate block">{d.vehiclePlate ?? d.licensePlate ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Color</span>
                            <span className="font-bold text-foreground truncate block">{d.vehicleColor ?? d.vehicleColour ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Phone</span>
                            <span className="font-bold text-foreground truncate block">{d.phone ?? d.user?.phoneNumber ?? '—'}</span>
                          </div>
                        </div>

                        {/* Secondary metadata: License & Area */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
                          {d.licenseNumber && (
                            <span className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-foreground font-mono flex items-center gap-1.5">
                              <FileText className="w-3 h-3 text-orange-brand" />
                              Lic: {d.licenseNumber}
                            </span>
                          )}
                          {d.area && (
                            <span className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-muted-foreground">
                              Base: {d.area}
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-muted-foreground ml-auto">
                            Wallet: <strong className="text-foreground">₦{Number(d.walletBalance || 0).toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        {isPending && (
                          <>
                            <button
                              disabled={processing === driverId}
                              onClick={() => setConfirmModal({
                                type: 'driver',
                                id: driverId,
                                action: 'approve',
                                title: 'Approve Driver Application?',
                                description: `Grant driver privileges to ${d.user?.name || 'this driver'}. They will receive an immediate push notification and can begin accepting campus rides.`,
                                confirmLabel: 'Yes, Approve Driver',
                                confirmVariant: 'success'
                              })}
                              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              {processing === driverId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Approve Driver
                            </button>
                            <button
                              disabled={processing === driverId}
                              onClick={() => setConfirmModal({
                                type: 'driver',
                                id: driverId,
                                action: 'reject',
                                title: 'Reject Driver Application?',
                                description: `Are you sure you want to decline the driver application for ${d.user?.name || 'this applicant'}?`,
                                confirmLabel: 'Yes, Reject Application',
                                confirmVariant: 'danger'
                              })}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            disabled={processing === driverId}
                            onClick={() => setConfirmModal({
                              type: 'driver',
                              id: driverId,
                              action: 'suspend',
                              title: 'Suspend Driver Account?',
                              description: `Temporarily revoke ride-accepting privileges for ${d.user?.name || 'this driver'}. They will receive a notification and won't be able to accept rides until reactivated.`,
                              confirmLabel: 'Yes, Suspend Driver',
                              confirmVariant: 'danger'
                            })}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Suspend Driver
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            disabled={processing === driverId}
                            onClick={() => setConfirmModal({
                              type: 'driver',
                              id: driverId,
                              action: 'unsuspend',
                              title: 'Reactivate Driver Account?',
                              description: `Restore ride-accepting privileges for ${d.user?.name || 'this driver'}. They will immediately regain access to the driver dashboard.`,
                              confirmLabel: 'Yes, Reactivate Driver',
                              confirmVariant: 'success'
                            })}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Reactivate Driver
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: PAYOUTS (DRIVER WITHDRAWALS & BANK SETTLEMENT)
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'payouts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Financial Stat Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-card border border-orange-brand/30 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-brand">Pending Requests</span>
                <p className="text-3xl font-black text-foreground mt-1">{pendingPayouts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{pendingPayoutsAmount.toLocaleString()} awaiting settlement
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-emerald-500/30 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Settled Payouts</span>
                <p className="text-3xl font-black text-foreground mt-1">{settledPayouts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{settledPayoutsAmount.toLocaleString()} disbursed to drivers
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Total Requests</span>
                <p className="text-3xl font-black text-foreground mt-1">{withdrawalRequests.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Historical withdrawal logs</p>
              </div>
            </div>

            {/* Payouts Section Card */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
              {/* Header with Sub-tabs and Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Driver Withdrawal Requests</h3>
                  <p className="text-xs text-muted-foreground">Review bank account credentials, disburse payouts, and track settlement history</p>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-elevated/70 border border-border self-start md:self-auto">
                  <button
                    onClick={() => setPayoutSubTab('pending')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      payoutSubTab === 'pending'
                        ? "bg-card text-orange-brand shadow-sm border border-border font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>Pending</span>
                    <span className={cn("px-1.5 py-0.2 rounded-full text-[9px] font-black", payoutSubTab === 'pending' ? "bg-orange-brand text-white" : "bg-muted text-muted-foreground")}>
                      {pendingPayouts.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPayoutSubTab('settled')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      payoutSubTab === 'settled'
                        ? "bg-card text-foreground shadow-sm border border-border font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>Settled History</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-muted text-muted-foreground">
                      {settledPayouts.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPayoutSubTab('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      payoutSubTab === 'all'
                        ? "bg-card text-foreground shadow-sm border border-border font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({withdrawalRequests.length})
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter payouts by driver name, bank, or account number..."
                  value={payoutSearch}
                  onChange={(e) => setPayoutSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-brand/30 shadow-sm transition-all"
                />
              </div>

              {/* Payout List */}
              {filteredPayoutsByTab.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-xs">
                  {payoutSubTab === 'pending'
                    ? 'No pending withdrawal requests. All drivers have been settled!'
                    : 'No withdrawal records match your current filter.'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredPayoutsByTab.map((req: any) => {
                    const isPending = req.status === 'PENDING'
                    const isApproved = req.status === 'APPROVED'
                    const isRejected = req.status === 'REJECTED'
                    const bankText = `${req.driver?.bankName ?? ''} - ${req.driver?.accountNumber ?? ''} (${req.driver?.accountName ?? ''})`
                    const isCopied = copiedId === req.id

                    return (
                      <div key={req.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Driver & Bank Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <Avatar className="w-10 h-10 border border-border shrink-0 mt-0.5">
                            <AvatarFallback className="font-bold bg-orange-brand/15 text-orange-brand">
                              {initials(req.driver?.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground truncate">{req.driver?.user?.name || 'Driver'}</p>
                              <StatusBadge status={req.status || 'pending'} />
                            </div>

                            {/* Bank details with 1-click copy */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground font-mono bg-surface-elevated px-2 py-0.5 rounded-md border border-border">
                                {req.driver?.bankName ?? 'Bank'} • <strong className="text-foreground">{req.driver?.accountNumber ?? 'No Account'}</strong> ({req.driver?.accountName ?? 'No Name'})
                              </span>
                              {req.driver?.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyBankDetails(req.id, req.driver.accountNumber)}
                                  className={cn(
                                    "px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                                    isCopied
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : "bg-surface-elevated text-muted-foreground hover:text-foreground border-border"
                                  )}
                                  title="Copy account number to clipboard"
                                >
                                  {isCopied ? (
                                    <>
                                      <CheckCheck className="w-3 h-3" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <p className="text-[10px] text-muted-foreground mt-1">
                              Requested: {formatDateTime(req.createdAt)}
                              {req.approvedByAdminId && <span> • Reviewed by Admin</span>}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                          <div className="text-left lg:text-right">
                            <span className={cn(
                              "text-lg font-black tabular-nums block",
                              isApproved ? "text-emerald-600 dark:text-emerald-400" : (isRejected ? "text-red-500 line-through" : "text-foreground")
                            )}>
                              ₦{Number(req.amount || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              Wallet Balance: ₦{Number(req.driver?.walletBalance || 0).toLocaleString()}
                            </span>
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                disabled={processing === req.id}
                                onClick={() => setConfirmModal({
                                  type: 'payout',
                                  id: req.id,
                                  action: 'approve',
                                  title: 'Approve & Settle Payout?',
                                  description: `Confirm that you have transferred ₦${Number(req.amount).toLocaleString()} to ${req.driver?.accountName || 'the driver'} (${req.driver?.bankName} - ${req.driver?.accountNumber}). The driver will be notified.`,
                                  confirmLabel: 'Yes, Approve Payout',
                                  confirmVariant: 'success'
                                })}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                {processing === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Approve
                              </button>
                              <button
                                disabled={processing === req.id}
                                onClick={() => setConfirmModal({
                                  type: 'payout',
                                  id: req.id,
                                  action: 'reject',
                                  title: 'Reject Payout Request?',
                                  description: `Declining this request will immediately refund ₦${Number(req.amount).toLocaleString()} back to the driver's wallet balance.`,
                                  confirmLabel: 'Yes, Reject & Refund',
                                  confirmVariant: 'danger'
                                })}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
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
            TAB 5: REPORTS & SUSPENDED FLEET
        ══════════════════════════════════════════════════════════ */}
        {!loading && activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Suspended Driver Accounts</h3>
              {suspendedDrivers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No drivers are currently suspended. Fleet health is optimal.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {suspendedDrivers.map((d: any) => {
                    const driverId = d.userId || d.id
                    return (
                      <div key={driverId} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarFallback className="font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                              {initials(d.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-foreground">{d.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{d.user?.email}</p>
                            <p className="text-[10px] text-muted-foreground">{d.totalTrips ?? d.trips ?? 0} total trips completed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status="suspended" />
                          <button
                            disabled={processing === driverId}
                            onClick={() => handleAction(driverId, 'unsuspend')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
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
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search riders or drivers by name or email…"
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-brand transition-colors"
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{filteredUsers.length} Users</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <th className="pb-3 px-3">User Profile</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Activity</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                          No users match "{search}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user: any, idx: number) => {
                        const isDriver = user.type === 'Driver'
                        return (
                          <tr key={user.id ?? idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 border border-border">
                                  <AvatarFallback className={cn("text-[10px] font-bold", isDriver ? "bg-blue-500/15 text-blue-500" : "bg-orange-brand/15 text-orange-brand")}>
                                    {initials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate">{user.name || 'Unnamed'}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                isDriver ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              )}>
                                {user.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs text-foreground font-medium">
                              {isDriver ? `${user.trips ?? 0} trips` : `${user.dropsBalance ?? 0} drops`}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={user.detailStatus ?? 'approved'} />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-elevated hover:bg-muted text-foreground border border-border transition-all cursor-pointer shadow-sm"
                                  title="Inspect User Activity"
                                >
                                  View
                                </button>
                                {isDriver && user.detailStatus === 'approved' && (
                                  <button
                                    disabled={processing === user.id}
                                    onClick={() => handleAction(user.id, 'suspend')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {isDriver && user.detailStatus === 'suspended' && (
                                  <button
                                    disabled={processing === user.id}
                                    onClick={() => handleAction(user.id, 'unsuspend')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
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
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Administrator Login Audit Log</h3>
                  <p className="text-xs text-muted-foreground">Tracking authorized and unauthorized access attempts to HQ</p>
                </div>
                <button
                  onClick={fetchSecurityLogs}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-muted text-foreground border border-border transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", securityLoading && "animate-spin text-orange-brand")} />
                  Refresh
                </button>
              </div>

              {securityLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-brand" />
                </div>
              ) : securityLogs.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-xs">
                  No login attempts recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <th className="pb-3 px-3">Timestamp</th>
                        <th className="pb-3 px-3">Admin Email</th>
                        <th className="pb-3 px-3">Result</th>
                        <th className="pb-3 px-3">IP Address</th>
                        <th className="pb-3 px-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {securityLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 text-xs text-muted-foreground tabular-nums">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-xs font-bold text-foreground">
                            {log.email}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={log.success ? 'approved' : 'rejected'} />
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground font-mono">
                            {log.ipAddress || '—'}
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground max-w-xs truncate">
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

      {/* ── Action Confirmation Modal (Driver / Payout) ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setConfirmModal(null)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm",
              confirmModal.confirmVariant === 'success'
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            )}>
              {confirmModal.confirmVariant === 'success' ? (
                <Check className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-lg font-bold text-foreground text-center mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                disabled={processing !== null}
                onClick={executeConfirmedAction}
                className={cn(
                  "w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50",
                  confirmModal.confirmVariant === 'success'
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmModal.confirmLabel}
              </button>
              <button
                disabled={processing !== null}
                onClick={() => setConfirmModal(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-surface-elevated hover:bg-muted text-foreground border border-border transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Activity Modal ── */}
      {selectedUser && (
        <UserActivityModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* ── Sign Out Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto text-red-500 shadow-sm">
              <LogOut className="w-6 h-6 ml-0.5" />
            </div>
            
            <h3 className="text-lg font-bold text-foreground text-center mb-1">Sign out of Admin HQ?</h3>
            <p className="text-xs text-muted-foreground text-center mb-6">
              You will be securely logged out and returned to the authentication portal.
            </p>
            
            <div className="flex flex-col gap-2.5">
              <button 
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                onClick={() => signOut({ callbackUrl: '/auth' })}
              >
                <LogOut className="w-3.5 h-3.5" />
                Yes, Sign Out
              </button>
              <button 
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-surface-elevated hover:bg-muted text-foreground border border-border transition-all cursor-pointer"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
