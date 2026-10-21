'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Car, Flag, Users,
  ShieldAlert, Menu, X, Loader2, Check, ChevronRight,
  Activity, AlertTriangle, RefreshCw, Banknote,
  Clock, CheckCircle2, XCircle, Search, Eye
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SkeletonTableRow } from '@/components/shared/SkeletonVariants'
import { Skeleton } from '@/components/shared/Skeleton'
import { UserActivityModal } from '@/components/admin/UserActivityModal'
import { cn } from '@/lib/utils'

const GOLD = 'var(--orange-brand)'
const GOLD_DIM = 'rgba(249, 115, 22, 0.14)'
const NAVY_0 = 'var(--background)'
const NAVY_1 = 'var(--card)'
const NAVY_2 = 'var(--surface-elevated)'
const BORDER = 'var(--border)'
const BORDER_LO = 'var(--border-subtle)'
const TEXT_HI = 'var(--foreground)'
const TEXT_MD = 'var(--muted-foreground)'
const TEXT_LO = 'var(--muted-foreground)'
const GREEN = 'var(--status-success)'
const GREEN_DIM = 'rgba(22, 163, 74, 0.12)'
const RED = 'var(--status-danger)'
const RED_DIM = 'rgba(220, 38, 38, 0.12)'
const BLUE = '#3b82f6'
const BLUE_DIM = 'rgba(96,165,250,0.12)'

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',         icon: LayoutDashboard },
  { id: 'revenue',    label: 'Revenue',           icon: TrendingUp },
  { id: 'approvals',  label: 'Driver Approvals',  icon: Car },
  { id: 'payouts',    label: 'Payouts',           icon: Banknote },
  { id: 'reports',    label: 'Reports',           icon: Flag },
  { id: 'users',      label: 'Users',             icon: Users },
  { id: 'security',   label: 'Security',          icon: ShieldAlert },
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
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return String(dateStr)
    }
  }
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    approved:  { label: 'Approved',  color: GREEN, bg: GREEN_DIM, dot: GREEN },
    pending:   { label: 'Pending',   color: GOLD,  bg: GOLD_DIM,  dot: GOLD  },
    suspended: { label: 'Suspended', color: RED,   bg: RED_DIM,   dot: RED   },
    rejected:  { label: 'Rejected',  color: RED,   bg: RED_DIM,   dot: RED   },
  }
  const s = map[status.toLowerCase()] ?? { label: status, color: TEXT_MD, bg: 'var(--border-subtle)', dot: TEXT_MD }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot, boxShadow: `0 0 4px ${s.dot}` }} />
      {s.label}
    </span>
  )
}

function StatCard({ label, value, sub, accent, icon: Icon }:
  { label: string; value: string; sub?: string; accent?: boolean; icon: React.ElementType }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(249, 115, 22, 0.04) 100%)'
          : `linear-gradient(135deg, ${NAVY_2} 0%, ${NAVY_1} 100%)`,
        border: `1px solid ${accent ? 'rgba(249, 115, 22, 0.25)' : BORDER}`,
        boxShadow: accent ? '0 0 30px rgba(245,166,35,0.07)' : 'none',
      }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent ? GOLD_DIM : 'var(--border-subtle)', border: `1px solid ${accent ? 'rgba(249, 115, 22, 0.3)' : BORDER}` }}>
          <Icon className="w-4 h-4" style={{ color: accent ? GOLD : TEXT_MD }} />
        </div>
        {accent && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: GOLD_DIM, color: GOLD }}>
            Action
          </span>
        )}
      </div>
      <p className="text-[28px] font-black tabular-nums leading-none mb-1"
        style={{ color: accent ? GOLD : TEXT_HI, letterSpacing: '-0.03em' }}>
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: accent ? 'rgba(245,166,35,0.7)' : TEXT_MD }}>
        {label}
      </p>
      {sub && <p className="text-[11px] mt-1" style={{ color: TEXT_LO }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full" style={{ background: GOLD }} />
        <p className="text-sm font-bold" style={{ color: TEXT_HI }}>{title}</p>
      </div>
      {action && (
        <button onClick={onAction}
          className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-100 opacity-60"
          style={{ color: GOLD }}>
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('rounded-2xl p-5', className)}
      style={{ background: NAVY_1, border: `1px solid ${BORDER}`, ...style }}>
      {children}
    </div>
  )
}

function CheckRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${BORDER_LO}` }}>
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: done ? GREEN_DIM : 'transparent', border: `1px solid ${done ? 'rgba(52,211,153,0.4)' : BORDER}` }}>
          {done && <Check className="w-3 h-3" style={{ color: GREEN }} />}
        </span>
        <p className="text-xs font-medium" style={{ color: done ? TEXT_MD : TEXT_LO }}>{label}</p>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: done ? GREEN : TEXT_LO }}>{detail}</p>
    </div>
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

  // Robustly extract stats mapping from API response
  const rawStats = data?.stats || {}
  const stats = {
    totalUsers: rawStats.totalUsers ?? (data?.totalUsers ?? 0),
    totalDrivers: rawStats.totalDrivers ?? (data?.totalDrivers ?? 0),
    totalTrips: rawStats.totalTrips ?? (data?.totalTrips ?? 0),
    completedTrips: rawStats.completedTrips ?? 0,
    platformRevenue: rawStats.platformRevenue ?? 0,
    driverPayouts: rawStats.driverPayouts ?? 0,
  }

  // Drivers and pending/suspended splits
  const driversList: any[] = Array.isArray(data?.drivers) ? data.drivers : []
  const pendingDrivers = driversList.filter((d: any) => d.status === 'PENDING')
  const suspendedDrivers = driversList.filter((d: any) => d.status === 'SUSPENDED')

  // Withdrawal requests
  const withdrawalRequests: any[] = Array.isArray(data?.withdrawalRequests) ? data.withdrawalRequests : []
  const pendingPayouts = withdrawalRequests.filter((r: any) => r.status === 'PENDING')

  // Combined users list with proper types and statuses
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

  const allUsers = [...ridersList, ...driverUsersList].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )

  const filteredUsers = search.trim()
    ? allUsers.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : allUsers

  const totalRevenueAmount = Array.isArray(revenueData)
    ? revenueData.reduce((acc: number, row: any) => acc + (Number(row.amount) || 0), 0)
    : 0
  const totalTransactionsCount = Array.isArray(revenueData) ? revenueData.length : 0
  const avgRevenuePerTrip = totalTransactionsCount > 0 ? totalRevenueAmount / totalTransactionsCount : 0

  const activeNavItem = NAV_ITEMS.find(n => n.id === activeTab)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top Bar ── */}
      <header style={{ background: NAVY_1, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="flex items-center gap-4 px-5 lg:px-8 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, var(--orange-dark) 100%)`, boxShadow: '0 0 12px rgba(249, 115, 22, 0.3)' }}>
              <Car className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-black tracking-tight hidden sm:block" style={{ color: TEXT_HI }}>
              TOVE<span style={{ color: GOLD }}>DROP</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ml-1 hidden sm:inline"
              style={{ background: GOLD_DIM, color: GOLD }}>Admin</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 mx-4 flex-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const badgeCount = id === 'approvals' ? pendingDrivers.length : (id === 'payouts' ? pendingPayouts.length : 0)

              return (
                <button key={id} onClick={() => { setActiveTab(id); setMobileNav(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                  style={{
                    color: active ? GOLD : TEXT_MD,
                    background: active ? GOLD_DIM : 'transparent',
                    border: `1px solid ${active ? 'rgba(245,166,35,0.2)' : 'transparent'}`,
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {badgeCount > 0 && (
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ml-0.5"
                      style={{ background: GOLD, color: 'var(--primary-foreground)' }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button onClick={fetchData} title="Refresh data"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-100 opacity-50 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
              <RefreshCw className={cn('w-3.5 h-3.5', pulse && 'animate-spin')} style={{ color: TEXT_MD }} />
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, var(--orange-dark) 100%)`, color: 'var(--primary-foreground)' }}>
              A
            </div>
            <button className="lg:hidden cursor-pointer" onClick={() => setMobileNav(v => !v)}>
              {mobileNav
                ? <X className="w-5 h-5" style={{ color: TEXT_MD }} />
                : <Menu className="w-5 h-5" style={{ color: TEXT_MD }} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileNav && (
          <div className="lg:hidden px-4 pb-3 flex flex-col gap-0.5" style={{ borderTop: `1px solid ${BORDER_LO}` }}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              const badgeCount = id === 'approvals' ? pendingDrivers.length : (id === 'payouts' ? pendingPayouts.length : 0)

              return (
                <button key={id} onClick={() => { setActiveTab(id); setMobileNav(false) }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold w-full text-left transition-all cursor-pointer"
                  style={{ color: active ? GOLD : TEXT_MD, background: active ? GOLD_DIM : 'transparent' }}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  {badgeCount > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{ background: GOLD, color: 'var(--primary-foreground)' }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* Page title */}
      <div className="px-5 lg:px-8 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER_LO}` }}>
        {activeNavItem && <activeNavItem.icon className="w-5 h-5" style={{ color: GOLD }} />}
        <h1 className="text-xl font-black tracking-tight" style={{ color: TEXT_HI }}>
          {activeNavItem?.label ?? 'Admin Panel'}
        </h1>
        <span className="text-[11px] font-medium ml-auto" style={{ color: TEXT_LO }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-5 lg:px-8 py-6">

        {/* Loading skeleton */}
        {loading && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: NAVY_1, border: `1px solid ${BORDER}` }}>
                  <Skeleton width={32} height={32} className="rounded-xl mb-4" />
                  <Skeleton width={60} height={28} className="mb-2" />
                  <Skeleton width={90} height={10} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: NAVY_1, border: `1px solid ${BORDER}` }}>
                  <Skeleton width={120} height={12} className="mb-5" />
                  {Array.from({ length: 4 }).map((_, j) => <SkeletonTableRow key={j} />)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── OVERVIEW ─── */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Riders"      value={String(stats.totalUsers)}    icon={Users}          />
              <StatCard label="Total Drivers"     value={String(stats.totalDrivers)}  icon={Car}            />
              <StatCard label="Total Trips"       value={String(stats.totalTrips)}    icon={Activity}       />
              <StatCard label="Pending Approvals" value={String(pendingDrivers.length)}
                accent={pendingDrivers.length > 0} icon={AlertTriangle} />
            </div>

            {pendingDrivers.length > 0 && (
              <button onClick={() => setActiveTab('approvals')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 cursor-pointer"
                style={{ background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.14) 0%, rgba(249, 115, 22, 0.08) 100%)', border: '1px solid rgba(249, 115, 22, 0.25)', color: GOLD }}>
                <AlertTriangle className="w-4 h-4" />
                Review {pendingDrivers.length} pending driver application{pendingDrivers.length !== 1 ? 's' : ''}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <SectionHeader title="Pending Approvals" action="View all" onAction={() => setActiveTab('approvals')} />
                {pendingDrivers.length === 0 ? (
                  <div className="flex items-center gap-2 py-4">
                    <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} />
                    <p className="text-xs" style={{ color: TEXT_MD }}>All caught up — no pending applications.</p>
                  </div>
                ) : (
                  <div>
                    {pendingDrivers.slice(0, 4).map((d: any, i: number) => (
                      <div key={d.userId || d.id} className="flex items-center gap-3 py-3"
                        style={{ borderBottom: i < Math.min(pendingDrivers.length, 4) - 1 ? `1px solid ${BORDER_LO}` : 'none' }}>
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-black"
                            style={{ background: GOLD_DIM, color: GOLD }}>{initials(d.user?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: TEXT_HI }}>{d.user?.name}</p>
                          <p className="text-[11px]" style={{ color: TEXT_LO }}>
                            {d.vehicleMake || d.vehiclePlate ? `${d.vehicleMake ?? ''} ${d.vehicleModel ?? ''} • ${d.vehiclePlate ?? ''}` : 'Vehicle pending'}
                          </p>
                        </div>
                        <Badge status="pending" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <SectionHeader title="Suspended Drivers" action="View all" onAction={() => setActiveTab('reports')} />
                {suspendedDrivers.length === 0 ? (
                  <div className="flex items-center gap-2 py-4">
                    <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} />
                    <p className="text-xs" style={{ color: TEXT_MD }}>No suspended drivers right now.</p>
                  </div>
                ) : (
                  <div>
                    {suspendedDrivers.slice(0, 4).map((d: any, i: number) => (
                      <div key={d.userId || d.id} className="flex items-center gap-3 py-3"
                        style={{ borderBottom: i < Math.min(suspendedDrivers.length, 4) - 1 ? `1px solid ${BORDER_LO}` : 'none' }}>
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-black"
                            style={{ background: RED_DIM, color: RED }}>{initials(d.user?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: TEXT_MD }}>{d.user?.name}</p>
                          <p className="text-[11px]" style={{ color: TEXT_LO }}>{d.rating > 0 ? d.rating.toFixed(1) + ' avg rating' : 'No ratings'}</p>
                        </div>
                        <Badge status="suspended" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card>
              <SectionHeader title="Platform Readiness" />
              <CheckRow done={stats.totalDrivers > 0}        label="At least one driver registered"    detail={stats.totalDrivers > 0 ? 'Done' : 'Pending'} />
              <CheckRow done={stats.totalUsers > 0}          label="At least one rider registered"     detail={stats.totalUsers > 0 ? 'Done' : 'Pending'} />
              <CheckRow done={pendingDrivers.length === 0}   label="No pending driver approvals"       detail={pendingDrivers.length === 0 ? 'Clear' : `${pendingDrivers.length} waiting`} />
              <CheckRow done={suspendedDrivers.length === 0} label="No suspended drivers"              detail={suspendedDrivers.length === 0 ? 'Clear' : `${suspendedDrivers.length} suspended`} />
              <CheckRow done={stats.totalTrips > 0}          label="Platform has processed trips"      detail={stats.totalTrips > 0 ? 'Active' : 'No trips yet'} />
            </Card>
          </div>
        )}

        {/* ─── REVENUE ─── */}
        {!loading && activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Platform Revenue"
                value={`₦${totalRevenueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sub="Cumulative commission earned"
                accent={true}
                icon={TrendingUp}
              />
              <StatCard
                label="Monetized Trips"
                value={String(totalTransactionsCount)}
                sub="Recorded commission entries"
                icon={Activity}
              />
              <StatCard
                label="Avg Cut / Trip"
                value={`₦${avgRevenuePerTrip.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sub="Average platform share"
                icon={Car}
              />
            </div>

            <Card>
              <SectionHeader title="Revenue Overview" />
              {revenueLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
                </div>
              ) : !Array.isArray(revenueData) || revenueData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <TrendingUp className="w-8 h-8 opacity-20" style={{ color: TEXT_MD }} />
                  <p className="text-sm" style={{ color: TEXT_LO }}>No revenue data available yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {revenueData.map((row: any, i: number) => {
                    const tripRoute = row.trip?.pickup && row.trip?.destination
                      ? `${row.trip.pickup} → ${row.trip.destination}`
                      : null
                    const title = tripRoute || row.label || row.period || (row.tripId ? `Trip Commission (Trip #${String(row.tripId).slice(-6)})` : `Platform Revenue #${i + 1}`)
                    const driverName = row.trip?.driver?.name ? `Driver: ${row.trip.driver.name}` : null
                    const formattedDate = formatDateTime(row.createdAt)
                    const amountFormatted = Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                    return (
                      <div key={row.id ?? i} className="flex items-center justify-between py-3.5 gap-4"
                        style={{ borderBottom: i < revenueData.length - 1 ? `1px solid ${BORDER_LO}` : 'none' }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: TEXT_HI }}>
                            {title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {driverName && (
                              <span className="text-[11px] font-medium" style={{ color: TEXT_MD }}>
                                {driverName}
                              </span>
                            )}
                            {driverName && formattedDate && <span className="text-[10px]" style={{ color: TEXT_LO }}>•</span>}
                            {formattedDate && (
                              <span className="text-[11px]" style={{ color: TEXT_LO }}>
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black tabular-nums" style={{ color: GOLD }}>
                            +₦{amountFormatted}
                          </span>
                          <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ color: GREEN }}>
                            Settled
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── DRIVER APPROVALS ─── */}
        {!loading && activeTab === 'approvals' && (
          <div className="space-y-3">
            {pendingDrivers.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <CheckCircle2 className="w-10 h-10" style={{ color: GREEN, opacity: 0.5 }} />
                  <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>All applications reviewed</p>
                  <p className="text-xs" style={{ color: TEXT_LO }}>No pending driver applications at this time.</p>
                </div>
              </Card>
            ) : (
              pendingDrivers.map((d: any) => {
                const driverId = d.userId || d.id
                return (
                  <Card key={driverId}>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 shrink-0">
                        <AvatarFallback className="text-sm font-black"
                          style={{ background: GOLD_DIM, color: GOLD }}>{initials(d.user?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold" style={{ color: TEXT_HI }}>{d.user?.name}</p>
                          <Badge status="pending" />
                        </div>
                        <p className="text-xs mb-3" style={{ color: TEXT_MD }}>{d.user?.email}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: 'Vehicle', value: `${d.vehicleMake ?? ''} ${d.vehicleModel ?? ''}`.trim() || '—' },
                            { label: 'Plate',   value: d.vehiclePlate ?? d.licensePlate ?? '—' },
                            { label: 'Colour',  value: d.vehicleColor ?? d.vehicleColour ?? '—' },
                            { label: 'Phone',   value: d.phone ?? d.user?.phoneNumber ?? d.area ?? '—' },
                          ].map(item => (
                            <div key={item.label}>
                              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: TEXT_LO }}>{item.label}</p>
                              <p className="text-xs font-semibold" style={{ color: TEXT_HI }}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button disabled={processing === driverId} onClick={() => handleAction(driverId, 'approve')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            style={{ background: GREEN_DIM, color: GREEN, border: '1px solid rgba(52,211,153,0.3)' }}>
                            {processing === driverId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button disabled={processing === driverId} onClick={() => handleAction(driverId, 'reject')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            style={{ background: RED_DIM, color: RED, border: '1px solid rgba(248,113,113,0.3)' }}>
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* ─── PAYOUTS (WITHDRAWALS) ─── */}
        {!loading && activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Pending Payout Requests"
                value={String(pendingPayouts.length)}
                sub="Awaiting admin approval"
                accent={pendingPayouts.length > 0}
                icon={Banknote}
              />
              <StatCard
                label="Total Driver Payouts"
                value={`₦${Number(stats.driverPayouts || 0).toLocaleString()}`}
                sub="Processed to driver wallets"
                icon={TrendingUp}
              />
            </div>

            <Card>
              <SectionHeader title="Pending Withdrawal Requests" />
              {pendingPayouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle2 className="w-8 h-8 opacity-30" style={{ color: GREEN }} />
                  <p className="text-sm" style={{ color: TEXT_LO }}>No pending driver withdrawal requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingPayouts.map((req: any) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs font-black" style={{ background: GOLD_DIM, color: GOLD }}>
                            {initials(req.driver?.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{req.driver?.user?.name || 'Driver'}</p>
                          <p className="text-xs" style={{ color: TEXT_MD }}>
                            {req.driver?.bankName ?? 'Bank'} • {req.driver?.accountNumber ?? 'Account'} ({req.driver?.accountName ?? ''})
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: TEXT_LO }}>
                            Requested {formatDateTime(req.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-base font-black tabular-nums" style={{ color: GREEN }}>
                          ₦{Number(req.amount || 0).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={processing === req.id}
                            onClick={() => handlePayoutAction(req.id, 'approve')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            style={{ background: GREEN_DIM, color: GREEN, border: '1px solid rgba(52,211,153,0.3)' }}
                          >
                            {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            disabled={processing === req.id}
                            onClick={() => handlePayoutAction(req.id, 'reject')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            style={{ background: RED_DIM, color: RED, border: '1px solid rgba(248,113,113,0.3)' }}
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {withdrawalRequests.filter((r: any) => r.status !== 'PENDING').length > 0 && (
              <Card>
                <SectionHeader title="Past Withdrawals" />
                <div className="divide-y divide-border">
                  {withdrawalRequests.filter((r: any) => r.status !== 'PENDING').slice(0, 10).map((req: any) => (
                    <div key={req.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: TEXT_HI }}>{req.driver?.user?.name || 'Driver'}</p>
                        <p className="text-[11px]" style={{ color: TEXT_LO }}>{formatDateTime(req.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>₦{Number(req.amount || 0).toLocaleString()}</p>
                        <Badge status={req.status?.toLowerCase() || 'approved'} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── REPORTS ─── */}
        {!loading && activeTab === 'reports' && (
          <div className="space-y-4">
            <Card>
              <SectionHeader title="Suspended Drivers" />
              {suspendedDrivers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle2 className="w-8 h-8 opacity-30" style={{ color: GREEN }} />
                  <p className="text-sm" style={{ color: TEXT_LO }}>No suspended drivers.</p>
                </div>
              ) : (
                <div>
                  {suspendedDrivers.map((d: any, i: number) => {
                    const driverId = d.userId || d.id
                    return (
                      <div key={driverId} className="flex items-center gap-3 py-3"
                        style={{ borderBottom: i < suspendedDrivers.length - 1 ? `1px solid ${BORDER_LO}` : 'none' }}>
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs font-black"
                            style={{ background: RED_DIM, color: RED }}>{initials(d.user?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: TEXT_MD }}>{d.user?.name}</p>
                          <p className="text-[11px]" style={{ color: TEXT_LO }}>{d.user?.email}</p>
                        </div>
                        <div className="text-right mr-3">
                          <p className="text-xs font-black tabular-nums mb-0.5" style={{ color: TEXT_HI }}>{d.totalTrips ?? d.trips ?? 0}</p>
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: TEXT_LO }}>trips</p>
                        </div>
                        <Badge status="suspended" />
                        <button
                          disabled={processing === driverId}
                          onClick={() => handleAction(driverId, 'unsuspend')}
                          className="ml-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                          style={{ background: GREEN_DIM, color: GREEN, border: '1px solid rgba(52,211,153,0.3)' }}
                        >
                          Un-suspend
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── USERS ─── */}
        {!loading && activeTab === 'users' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: TEXT_LO }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email…"
                    className="w-full text-xs pl-9 pr-3 py-2 outline-none"
                    style={{ background: NAVY_2, border: `1px solid ${BORDER}`, borderRadius: '10px', color: TEXT_HI }} />
                </div>
                <p className="text-[11px] font-semibold shrink-0" style={{ color: TEXT_LO }}>{filteredUsers.length} users</p>
              </div>

              <div className="grid text-[10px] font-bold uppercase tracking-widest px-3 pb-2"
                style={{ gridTemplateColumns: '1fr 80px 100px 90px 120px', color: TEXT_LO, borderBottom: `1px solid ${BORDER}` }}>
                <span>User</span>
                <span>Role</span>
                <span className="hidden sm:block">Activity</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs" style={{ color: TEXT_LO }}>No users matching "{search}"</p>
                </div>
              ) : (
                <div>
                  {filteredUsers.map((user: any, i: number) => {
                    const userId = user.id
                    return (
                      <div key={userId ?? i}
                        className="grid items-center px-3 py-3 transition-all rounded-xl hover:bg-white/[0.02]"
                        style={{ gridTemplateColumns: '1fr 80px 100px 90px 120px', borderBottom: i < filteredUsers.length - 1 ? `1px solid ${BORDER_LO}` : 'none' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarFallback className="text-[9px] font-black"
                              style={{ background: user.type === 'Driver' ? BLUE_DIM : GOLD_DIM, color: user.type === 'Driver' ? BLUE : GOLD }}>
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: TEXT_HI }}>{user.name || 'Unnamed'}</p>
                            <p className="text-[11px] truncate" style={{ color: TEXT_LO }}>{user.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: user.type === 'Driver' ? BLUE : TEXT_MD }}>
                          {user.type}
                        </span>
                        <span className="text-[11px] hidden sm:block" style={{ color: TEXT_LO }}>
                          {user.type === 'Driver' ? `${user.trips ?? 0} trips` : `${user.dropsBalance ?? 0} drops`}
                        </span>
                        <div>
                          <Badge status={user.detailStatus ?? 'approved'} />
                        </div>
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all hover:opacity-100 opacity-60 cursor-pointer"
                            style={{ color: GOLD, background: GOLD_DIM }}
                            title="View user activity"
                          >
                            View
                          </button>
                          {user.type === 'Driver' && user.detailStatus === 'approved' && (
                            <button
                              disabled={processing === userId}
                              onClick={() => handleAction(userId, 'suspend')}
                              className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all hover:opacity-100 opacity-60 hover:opacity-100 cursor-pointer"
                              style={{ color: RED, background: RED_DIM }}
                            >
                              Suspend
                            </button>
                          )}
                          {user.type === 'Driver' && user.detailStatus === 'suspended' && (
                            <button
                              disabled={processing === userId}
                              onClick={() => handleAction(userId, 'unsuspend')}
                              className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all hover:opacity-100 opacity-60 hover:opacity-100 cursor-pointer"
                              style={{ color: GREEN, background: GREEN_DIM }}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── SECURITY ─── */}
        {!loading && activeTab === 'security' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 rounded-full" style={{ background: GOLD }} />
                  <p className="text-sm font-bold" style={{ color: TEXT_HI }}>Admin Login Audit Log</p>
                </div>
                <button onClick={fetchSecurityLogs}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-all hover:opacity-100 opacity-50 cursor-pointer"
                  style={{ color: GOLD }}>
                  <RefreshCw className={cn("w-3 h-3", securityLoading && "animate-spin")} />
                  Refresh
                </button>
              </div>

              {securityLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
                </div>
              ) : securityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <ShieldAlert className="w-8 h-8 opacity-20" style={{ color: TEXT_MD }} />
                  <p className="text-sm" style={{ color: TEXT_LO }}>No login attempts recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Time', 'Email', 'Result', 'IP Address', 'User Agent'].map(h => (
                          <th key={h} className="text-[10px] font-bold uppercase tracking-widest pb-3 pr-5"
                            style={{ color: TEXT_LO, whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}` }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {securityLogs.map((log: any) => (
                        <tr key={log.id} className="transition-all hover:bg-white/[0.02]"
                          style={{ borderBottom: `1px solid ${BORDER_LO}` }}>
                          <td className="py-3 pr-5 text-[11px] tabular-nums" style={{ color: TEXT_MD, whiteSpace: 'nowrap' }}>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 opacity-50" style={{ color: TEXT_LO }} />
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 pr-5 text-[11px]" style={{ color: TEXT_HI }}>{log.email}</td>
                          <td className="py-3 pr-5">
                            <Badge status={log.success ? 'approved' : 'suspended'} />
                          </td>
                          <td className="py-3 pr-5 text-[11px] font-mono" style={{ color: TEXT_MD }}>{log.ipAddress ?? '—'}</td>
                          <td className="py-3 text-[11px]"
                            style={{ color: TEXT_LO, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.userAgent ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[10px] mt-4 pt-3" style={{ color: TEXT_LO, borderTop: `1px solid ${BORDER_LO}` }}>
                Showing last 50 entries · Includes Step 1 and Step 2 attempts
              </p>
            </Card>
          </div>
        )}

      </main>

      {/* User Activity Modal */}
      {selectedUser && (
        <UserActivityModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
