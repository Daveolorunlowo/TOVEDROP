'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Search, Users, Car, TrendingUp,
  Flag, FileText, LayoutDashboard, Menu, X,
  Loader2, Check, ShieldAlert, PieChart, Save, Banknote, MessageSquare, Bell, Activity
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SkeletonStatCard, SkeletonTableRow } from '@/components/shared/SkeletonVariants'
import { Skeleton } from '@/components/shared/Skeleton'
import { UpdatesTab } from '@/components/admin/UpdatesTab'
import { UserActivityModal } from '@/components/admin/UserActivityModal'
import { cn } from '@/lib/utils'
import CountUp from 'react-countup'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Design tokens ─────────────────────────────────────
// bg #111111 / surface #171717 / border #222 / divider #1e1e1e
// sidebar: #0e0e0e / sidebar-active bg: #1a1a1a
// label: 11px / uppercase / tracking-[0.05em] / #555
// text: #f5f5f5 / #888 / #555
// accent: var(--orange-brand) (amber — active nav + primary actions)
// radius: 8px cards / 4px badges
// ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',         icon: LayoutDashboard },
  { id: 'finances',  label: 'Finances',         icon: TrendingUp },
  { id: 'revenue_split', label: 'Revenue Split', icon: PieChart },
  { id: 'approvals', label: 'Driver Approvals',  icon: Car },
  { id: 'payouts',   label: 'Payouts',           icon: Banknote },
  { id: 'updates',   label: 'Updates',           icon: Bell },
  { id: 'reports',   label: 'Reports',           icon: Flag },
  { id: 'feedback',  label: 'Feedback',          icon: MessageSquare },
  { id: 'users',     label: 'Users',             icon: Users },
  { id: 'security',  label: 'Security',          icon: ShieldAlert },
]

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: 'Approved',  color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    pending:   { label: 'Pending',   color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.08)' },
    suspended: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  }
  const s = map[status.toLowerCase()] ?? { label: status, color: '#555', bg: '#1e1e1e' }
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
      style={{ background: s.bg, color: s.color, borderRadius: '4px' }}
    >
      {s.label}
    </span>
  )
}

function CheckRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #1e1e1e' }}>
      <div className="flex items-center gap-2.5">
        <span
          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: done ? 'rgba(34,197,94,0.12)' : 'transparent',
            border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid #333',
          }}
        >
          {done && <Check className="w-2.5 h-2.5" style={{ color: '#22c55e' }} />}
        </span>
        <p className="text-xs font-medium" style={{ color: done ? '#888' : '#555' }}>{label}</p>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: done ? '#22c55e' : '#444' }}>
        {detail}
      </p>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [securityLogs, setSecurityLogs] = useState<any[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)
  const [financesData, setFinancesData] = useState<any>(null)
  const [financesLoading, setFinancesLoading] = useState(false)
  const [revenueSettings, setRevenueSettings] = useState({ driverPercentage: 70, adminPercentage: 10, companyPercentage: 20 })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [selectedActivityUser, setSelectedActivityUser] = useState<any>(null)

  const fetchData = async () => {
    const start = Date.now()
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setData(await res.json())
      else if (res.status === 401) router.push('/auth/login')
    } catch (e) { console.error(e) }
    finally {
      const elapsed = Date.now() - start
      if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed))
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [router])

  const fetchSecurityLogs = async () => {
    setSecurityLoading(true)
    try {
      const res = await fetch('/api/portal/audit-log')
      if (res.ok) {
        const json = await res.json()
        setSecurityLogs(json.logs || [])
      }
    } catch (e) { console.error(e) }
    finally { setSecurityLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'security') fetchSecurityLogs()
    if (activeTab === 'finances') fetchFinances()
    if (activeTab === 'revenue_split') fetchRevenueSettings()
  }, [activeTab])

  const fetchRevenueSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const json = await res.json()
        setRevenueSettings({
          driverPercentage: json.driverPercentage,
          adminPercentage: json.adminPercentage,
          companyPercentage: json.companyPercentage
        })
      }
    } catch (e) { console.error(e) }
    finally { setSettingsLoading(false) }
  }

  const saveRevenueSettings = async () => {
    const total = revenueSettings.adminPercentage + revenueSettings.companyPercentage
    if (total !== 100) {
      alert(`Admin and Company percentages must sum to 100%. Current sum: ${total}%`)
      return
    }

    setSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revenueSettings),
      })
      if (res.ok) {
        alert('Revenue split updated successfully!')
      } else {
        const error = await res.json()
        alert(`Failed to update: ${error.message}`)
      }
    } catch (e) { 
      console.error(e) 
      alert('Failed to save settings.')
    }
    finally { setSettingsSaving(false) }
  }

  const fetchFinances = async () => {
    setFinancesLoading(true)
    try {
      const res = await fetch('/api/admin/finances')
      if (res.ok) {
        const json = await res.json()
        setFinancesData(json)
      }
    } catch (e) { console.error(e) }
    finally { setFinancesLoading(false) }
  }

  const exportFinancesCSV = () => {
    if (!financesData) return
    let csv = "--- COMPANY POSITION ---\n"
    csv += "Metric,All-Time,This Month,This Week\n"
    csv += `Total Cash Collected,₦${financesData.company.totalCashCollected},₦${financesData.company.thisMonth.cashCollected},₦${financesData.company.thisWeek.cashCollected}\n`
    csv += `Recognized Revenue,₦${financesData.company.recognizedRevenue},₦${financesData.company.thisMonth.recognizedRevenue},₦${financesData.company.thisWeek.recognizedRevenue}\n`
    csv += `Outstanding Drops Liability,₦${financesData.company.outstandingLiability},,\n`
    csv += `Total Driver Payouts,₦${financesData.company.totalDriverPayouts},₦${financesData.company.thisMonth.driverPayouts},₦${financesData.company.thisWeek.driverPayouts}\n\n`
    
    csv += "--- DRIVERS ---\n"
    csv += "Name,Email,Status,Wallet Balance (₦),Total Trips,Avg ₦/Trip,Last Payout Date\n"
    financesData.drivers.list.forEach((d: any) => {
      csv += `"${d.name}","${d.email}","${d.status}",${d.walletBalance},${d.totalTrips},${d.avgPerTrip.toFixed(2)},${d.lastPayoutDate ? new Date(d.lastPayoutDate).toLocaleDateString() : 'Never'}\n`
    })
    
    csv += "\n--- RIDERS / DROPS ---\n"
    csv += "Name,Email,Drops Balance,Est. Naira Value,Total Trips Booked\n"
    financesData.riders.list.forEach((r: any) => {
      csv += `"${r.name}","${r.email}",${r.dropsBalance},${r.estNairaValue},${r.totalTripsBooked}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tovedrop-finances-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleAction = async (driverId: string, action: string) => {
    setProcessing(driverId)
    try {
      const res = await fetch('/api/admin/drivers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action }),
      })
      if (res.ok) await fetchData()
      else alert((await res.json()).message ?? 'Action failed')
    } catch { alert('Error') }
    finally { setProcessing(null) }
  }

  const handlePayoutAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this payout?`)) return
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/withdrawals/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, action })
      })
      if (res.ok) fetchData()
      else alert('Failed to update payout request.')
    } catch (e) {
      alert('Network error.')
    } finally {
      setProcessing(null)
    }
  }

  const handleFeedbackAction = async (id: string, action: 'review' | 'resolve') => {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/feedback/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: id, action })
      })
      if (res.ok) fetchData()
      else alert('Failed to update feedback.')
    } catch (e) {
      alert('Network error.')
    } finally {
      setProcessing(null)
    }
  }

  if (!data && !loading) return null

  const { stats, drivers, users, withdrawalRequests = [] } = data || { stats: {}, drivers: [], users: [], withdrawalRequests: [] }
  const pendingDrivers  = drivers.filter((d: any) => d.status === 'PENDING')
  const suspendedDrivers = drivers.filter((d: any) => d.status === 'SUSPENDED')
  const pendingPayouts = withdrawalRequests.filter((r: any) => r.status === 'PENDING')

  const allUsersList = [
    ...users.map((u: any) => ({ ...u, type: 'Rider', detailStatus: 'approved' })),
    ...drivers.map((d: any) => ({ ...d.user, type: 'Driver', detailStatus: d.status?.toLowerCase(), trips: d.totalTrips })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredUsers = allUsersList.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen" style={{ background: '#111111' }}>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col lg:static lg:z-auto transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: '210px', background: '#0e0e0e', borderRight: '1px solid #1a1a1a' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <a href="/" className="text-sm font-bold tracking-tight" style={{ color: '#f5f5f5' }}>
            TOVE<span style={{ color: 'var(--orange-brand)' }}>DROP</span>
          </a>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: '#555' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#333' }}>
            Admin
          </p>
        </div>

        {/* Nav items */}
        <nav className="px-3 space-y-0.5 flex-1">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs font-medium transition-colors"
                style={{
                  background: active ? '#1a1a1a' : 'transparent',
                  color: active ? 'var(--orange-brand)' : '#555',
                  borderRadius: '6px',
                }}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.id === 'approvals' && pendingDrivers.length > 0 && (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 tabular-nums"
                    style={{ background: '#1e1e1e', color: 'var(--orange-brand)', borderRadius: '4px' }}
                  >
                    {pendingDrivers.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-5 h-12"
          style={{ background: '#111111', borderBottom: '1px solid #1a1a1a' }}
        >
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{ color: '#555' }}>
            <Menu className="w-4 h-4" />
          </button>
          <p className="text-xs font-semibold" style={{ color: '#888' }}>
            {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'Admin Panel'}
          </p>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-7">
          
          {loading && (
            <div>
              <SkeletonStatCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-lg bg-surface-card border border-border-default p-4">
                  <Skeleton width={120} height={12} className="mb-4" />
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} />)}
                </div>
                <div className="rounded-lg bg-surface-card border border-border-default p-4">
                  <Skeleton width={120} height={12} className="mb-4" />
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Overview ── */}
          {!loading && activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Grouped stats card with glassmorphism */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Riders',       value: stats.totalUsers },
                  { label: 'Total Drivers',      value: stats.totalDrivers },
                  { label: 'Total Trips',        value: stats.totalTrips },
                  { label: 'Successful Referrals',value: stats.successfulReferrals, accent: true },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="relative overflow-hidden rounded-xl p-5 border border-[#333] transition-all hover:border-orange-brand/50 group"
                    style={{ background: 'linear-gradient(145deg, rgba(26,26,26,0.8) 0%, rgba(17,17,17,0.4) 100%)', backdropFilter: 'blur(10px)' }}
                  >
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-orange-brand/10 blur-xl group-hover:bg-orange-brand/20 transition-colors" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-2 text-[#888]">
                      {s.label}
                    </p>
                    <p
                      className="text-3xl font-bold tabular-nums tracking-tight"
                      style={{ color: s.accent ? 'var(--orange-brand)' : '#fff' }}
                    >
                      <CountUp end={s.value} duration={2.5} separator="," />
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Chart and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 rounded-xl p-5 border border-[#333] relative overflow-hidden" style={{ background: '#141414' }}>
                  <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-orange-brand/5 blur-[100px] pointer-events-none" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-6 text-[#555]">
                    Platform Growth (Last 7 Days)
                  </p>
                  <div className="h-[220px] w-full">
                    {data.chartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--orange-brand)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--orange-brand)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: 'var(--orange-brand)' }}
                          />
                          <Area type="monotone" dataKey="trips" stroke="var(--orange-brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-[#555]">No data available</div>
                    )}
                  </div>
                </div>

                {/* Live Activity Ticker */}
                <div className="rounded-xl p-5 border border-[#333] bg-[#141414] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#555] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Live Activity
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[220px]">
                    {data.recentActivity && data.recentActivity.length > 0 ? (
                      data.recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'TRIP' ? 'bg-orange-brand/10 text-orange-brand' : 'bg-purple-500/10 text-purple-500'}`}>
                            {activity.type === 'TRIP' ? <Car className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white leading-tight">{activity.title}</p>
                            <p className="text-[11px] text-[#888] mt-0.5 line-clamp-1">{activity.desc}</p>
                            <p className="text-[9px] text-[#555] mt-1">{new Date(activity.time).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#555] text-center mt-10">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Pending Approvals */}
              {pendingDrivers.length > 0 && (
                <div className="rounded-xl p-5 border border-[#333] bg-[#141414]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#555]">
                      Action Required: Pending Approvals
                    </p>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[11px] font-semibold text-orange-brand hover:underline"
                    >
                      Review All {pendingDrivers.length} →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pendingDrivers.slice(0, 4).map((d: any) => (
                      <div key={d.userId} className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-bold bg-[#333] text-[#aaa]">
                            {initials(d.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{d.user.name}</p>
                          <p className="text-[10px] text-[#666] truncate">{d.vehicleMake}</p>
                        </div>
                        <StatusChip status="pending" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Finances ── */}
          {!loading && activeTab === 'finances' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
                  Financial Overview
                </p>
                <button
                  onClick={exportFinancesCSV}
                  disabled={!financesData || financesLoading}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-[#222] disabled:opacity-50"
                  style={{ background: '#1a1a1a', color: '#f5f5f5', border: '1px solid #333' }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export Full Report (CSV)
                </button>
              </div>

              {financesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : !financesData ? (
                <div className="rounded-lg h-full flex flex-col items-center justify-center min-h-[120px]" style={{ background: '#111111', border: '1px dashed #222', padding: '20px' }}>
                  <p className="text-xs" style={{ color: '#444' }}>No data available.</p>
                </div>
              ) : (
                <>
                  {/* Section 1: Company Position */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: '#8b5cf6' }}>
                      Section 1: Company Position (Platform)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #2e1065' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#a78bfa' }}>Total Cash Collected</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>₦{financesData.company.totalCashCollected.toLocaleString()}</p>
                        <p className="text-[10px] mt-1" style={{ color: '#555' }}>All-Time via Paystack</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #2e1065' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#a78bfa' }}>Recognized Revenue</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>₦{financesData.company.recognizedRevenue.toLocaleString()}</p>
                        <p className="text-[10px] mt-1" style={{ color: '#555' }}>All-Time Earned Profit</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #2e1065' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#a78bfa' }}>Outstanding Liability</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>₦{financesData.company.outstandingLiability.toLocaleString()}</p>
                        <p className="text-[10px] mt-1" style={{ color: '#555' }}>Unredeemed Rider Drops</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #2e1065' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#a78bfa' }}>Total Driver Payouts</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>₦{financesData.company.totalDriverPayouts.toLocaleString()}</p>
                        <p className="text-[10px] mt-1" style={{ color: '#555' }}>All-Time Committed</p>
                      </div>
                    </div>

                    <div className="rounded-lg overflow-hidden" style={{ background: '#171717', border: '1px solid #222' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Period</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Cash Collected</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Recognized Revenue</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Driver Payouts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                            <td className="px-4 py-3 text-[11px] font-medium" style={{ color: '#f5f5f5' }}>This Week</td>
                            <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#888' }}>₦{financesData.company.thisWeek.cashCollected.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#22c55e' }}>+₦{financesData.company.thisWeek.recognizedRevenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#ef4444' }}>-₦{financesData.company.thisWeek.driverPayouts.toLocaleString()}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                            <td className="px-4 py-3 text-[11px] font-medium" style={{ color: '#f5f5f5' }}>This Month</td>
                            <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#888' }}>₦{financesData.company.thisMonth.cashCollected.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#22c55e' }}>+₦{financesData.company.thisMonth.recognizedRevenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#ef4444' }}>-₦{financesData.company.thisMonth.driverPayouts.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-[11px] font-medium" style={{ color: '#f5f5f5' }}>All-Time</td>
                            <td className="px-4 py-3 text-[11px] text-right font-bold" style={{ color: '#f5f5f5' }}>₦{financesData.company.totalCashCollected.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] text-right font-bold" style={{ color: '#22c55e' }}>+₦{financesData.company.recognizedRevenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] text-right font-bold" style={{ color: '#ef4444' }}>-₦{financesData.company.totalDriverPayouts.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Section 2: Drivers */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: 'var(--orange-brand)' }}>
                      Section 2: Drivers
                    </p>
                    <div className="rounded-lg p-4 mb-4 flex items-center gap-4" style={{ background: '#171717', border: '1px solid rgba(217,119,6,0.2)' }}>
                      <div className="p-2 rounded-md" style={{ background: 'rgba(217,119,6,0.1)' }}>
                        <Car className="w-5 h-5" style={{ color: 'var(--orange-brand)' }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--orange-brand)' }}>Total Across All Drivers</p>
                        <p className="text-xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>₦{financesData.drivers.totalBalances.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="rounded-lg overflow-hidden" style={{ background: '#171717', border: '1px solid #222' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Driver Name</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Status</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Wallet Balance (₦)</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Total Trips</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Avg ₦/Trip</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Last Payout Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financesData.drivers.list.map((d: any, i: number) => (
                            <tr key={d.id} className="cursor-pointer hover:bg-[#1e1e1e] transition-colors" onClick={() => router.push(`/admin/drivers/${d.id}`)} style={{ borderBottom: i < financesData.drivers.list.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                              <td className="px-4 py-3 text-[11px] font-medium" style={{ color: '#f5f5f5' }}>{d.name}</td>
                              <td className="px-4 py-3"><StatusChip status={d.status} /></td>
                              <td className="px-4 py-3 text-[11px] text-right font-bold" style={{ color: 'var(--orange-brand)' }}>₦{d.walletBalance.toLocaleString()}</td>
                              <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#888' }}>{d.totalTrips}</td>
                              <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#888' }}>₦{d.avgPerTrip.toFixed(0)}</td>
                              <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#555' }}>
                                {d.lastPayoutDate ? new Date(d.lastPayoutDate).toLocaleDateString() : 'Never'}
                              </td>
                            </tr>
                          ))}
                          {financesData.drivers.list.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-xs" style={{ color: '#444' }}>No drivers found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Section 3: Riders */}
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: '#64748b' }}>
                      Section 3: Riders / Drops
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #1e293b' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#94a3b8' }}>Total Drops in Circulation</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>{financesData.riders.totalDrops.toLocaleString()} <span className="text-xs" style={{ color: '#555' }}>drops</span></p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #1e293b' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#94a3b8' }}>Naira Value of Drops</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>₦{financesData.riders.totalNairaValue.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: '#171717', border: '1px solid #1e293b' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#94a3b8' }}>Avg Drops / Active Rider</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f5f5' }}>{financesData.riders.avgDropsPerRider.toFixed(1)} <span className="text-xs" style={{ color: '#555' }}>drops</span></p>
                      </div>
                    </div>

                    <div className="rounded-lg overflow-hidden" style={{ background: '#171717', border: '1px solid #222' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Rider Name</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Email</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Drops Balance</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Est. Naira Value</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Total Trips Booked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financesData.riders.list.map((r: any, i: number) => (
                            <tr key={r.id} style={{ borderBottom: i < financesData.riders.list.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                              <td className="px-4 py-3 text-[11px] font-medium" style={{ color: '#f5f5f5' }}>{r.name}</td>
                              <td className="px-4 py-3 text-[11px]" style={{ color: '#888' }}>{r.email}</td>
                              <td className="px-4 py-3 text-[11px] text-right font-bold" style={{ color: '#94a3b8' }}>{r.dropsBalance}</td>
                              <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#888' }}>
                                ₦{r.estNairaValue.toLocaleString()}
                                {!r.hasDropLots && r.dropsBalance > 0 && <span className="text-[9px] block text-orange-500">*approximate</span>}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-right" style={{ color: '#555' }}>{r.totalTripsBooked}</td>
                            </tr>
                          ))}
                          {financesData.riders.list.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-xs" style={{ color: '#444' }}>No active riders with drops found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* ── Revenue Split Settings ── */}
          {!loading && activeTab === 'revenue_split' && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-5" style={{ color: '#555' }}>
                Revenue Split Configuration
              </p>
              
              {settingsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="rounded-lg p-5" style={{ background: '#171717', border: '1px solid #222' }}>
                  <p className="text-sm mb-6" style={{ color: '#888' }}>
                    Drivers automatically receive a flat <strong>₦12</strong> fee per completed ride. Configure how the <em>remaining</em> balance of the booking fee is split between the Admin and the Company. The total must equal 100%.
                  </p>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5" style={{ color: '#555' }}>Admin Percentage (%)</label>
                      <input 
                        type="number"
                        min="0" max="100"
                        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--orange-brand)]"
                        style={{ background: '#111111', border: '1px solid #222', color: '#f5f5f5' }}
                        value={revenueSettings.adminPercentage}
                        onChange={e => setRevenueSettings({...revenueSettings, adminPercentage: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5" style={{ color: '#555' }}>Company (Platform) Percentage (%)</label>
                      <input 
                        type="number"
                        min="0" max="100"
                        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--orange-brand)]"
                        style={{ background: '#111111', border: '1px solid #222', color: '#f5f5f5' }}
                        value={revenueSettings.companyPercentage}
                        onChange={e => setRevenueSettings({...revenueSettings, companyPercentage: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-5" style={{ borderTop: '1px solid #1e1e1e' }}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span style={{ color: '#555' }}>Total: </span>
                        <span className="font-bold" style={{ color: (revenueSettings.adminPercentage + revenueSettings.companyPercentage) === 100 ? '#22c55e' : '#ef4444' }}>
                          {revenueSettings.adminPercentage + revenueSettings.companyPercentage}%
                        </span>
                      </div>
                      
                      <button
                        onClick={saveRevenueSettings}
                        disabled={settingsSaving || (revenueSettings.adminPercentage + revenueSettings.companyPercentage) !== 100}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                        style={{ background: 'var(--orange-brand)', color: '#000' }}
                      >
                        {settingsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Driver Approvals ── */}
          {!loading && activeTab === 'approvals' && (
            <div>
              {data.autoApproveDrivers && (
                <div className="mb-5 rounded-md flex items-start gap-2.5 p-3 text-xs" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong>⚠ Auto-approval is currently ON.</strong> New driver applications are being approved automatically without manual review. Turn this off in environment settings before real launch.
                  </div>
                </div>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-5" style={{ color: '#555' }}>
                Driver Approvals · {pendingDrivers.length} pending
              </p>

              {pendingDrivers.length === 0 ? (
                <div
                  className="rounded-lg flex items-start gap-3"
                  style={{ background: '#171717', border: '1px solid #222', padding: '20px' }}
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#22c55e' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#888' }}>All applications reviewed</p>
                    <p className="text-xs mt-0.5" style={{ color: '#444' }}>No pending driver applications at this time.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDrivers.map((driver: any) => (
                    <div
                      key={driver.userId}
                      className="rounded-lg"
                      style={{ background: '#171717', border: '1px solid #222', padding: '16px 20px' }}
                    >
                      {/* Driver identity row */}
                      <div className="flex items-center gap-3 mb-4" style={{ paddingBottom: '14px', borderBottom: '1px solid #1e1e1e' }}>
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs font-bold" style={{ background: '#1e1e1e', color: '#888' }}>
                            {initials(driver.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>{driver.user.name}</p>
                          <p className="text-[11px]" style={{ color: '#555' }}>
                            {driver.user.email} · {driver.phone}
                          </p>
                        </div>
                        <StatusChip status="pending" />
                      </div>

                      {/* Verification checklist */}
                      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] mb-2" style={{ color: '#444' }}>
                        Verification
                      </p>
                      <CheckRow done label="Name & Contact" detail={driver.user.name} />
                      <CheckRow done label="Vehicle" detail={`${driver.vehicleMake} ${driver.vehicleModel}`} />
                      <CheckRow done label="Plate Number" detail={driver.vehiclePlate} />
                      <CheckRow done label="License Number" detail={driver.licenseNumber} />

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4" style={{ paddingTop: '14px', borderTop: '1px solid #1e1e1e' }}>
                        <button
                          disabled={processing === driver.userId}
                          onClick={() => handleAction(driver.userId, 'approve')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)' }}
                        >
                          {processing === driver.userId ? '…' : 'Approve Driver'}
                        </button>
                        <button
                          disabled={processing === driver.userId}
                          onClick={() => handleAction(driver.userId, 'suspend')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md"
                          style={{ background: '#1e1e1e', color: '#555', borderRadius: '6px' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Payouts ── */}
          {!loading && activeTab === 'payouts' && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-5" style={{ color: '#555' }}>
                Pending Payouts · {pendingPayouts.length}
              </p>

              {withdrawalRequests.length === 0 ? (
                <div className="rounded-lg py-8 text-center" style={{ background: '#171717', border: '1px solid #1e1e1e' }}>
                  <p className="text-xs" style={{ color: '#444' }}>No withdrawal requests.</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden" style={{ background: '#171717', border: '1px solid #222' }}>
                  {withdrawalRequests.map((req: any, i: number) => (
                    <div
                      key={req.id}
                      className="flex items-start justify-between px-4 py-4"
                      style={{ borderBottom: i < withdrawalRequests.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    >
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-bold" style={{ background: '#1e1e1e', color: '#555' }}>
                            {initials(req.driver.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#f5f5f5' }}>{req.driver.user.name}</p>
                          <div className="text-[11px] mt-1 space-y-0.5" style={{ color: '#888' }}>
                            <p>Bank: <span className="text-white">{req.driver.bankName}</span></p>
                            <p>Acct: <span className="text-white">{req.driver.accountNumber}</span></p>
                            <p>Name: <span className="text-white">{req.driver.accountName}</span></p>
                            <p className="mt-1" style={{ color: '#555' }}>Requested: {new Date(req.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <p className="text-lg font-bold" style={{ color: '#22c55e', letterSpacing: '-0.02em' }}>
                          ₦{req.amount.toLocaleString()}
                        </p>
                        <div className="mt-1 mb-3">
                          <StatusChip status={req.status} />
                        </div>
                        {req.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              disabled={processing === req.id}
                              onClick={() => handlePayoutAction(req.id, 'approve')}
                              className="text-[10px] font-semibold px-3 py-1.5 rounded"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                            >
                              {processing === req.id ? '…' : 'Mark Paid'}
                            </button>
                            <button
                              disabled={processing === req.id}
                              onClick={() => handlePayoutAction(req.id, 'reject')}
                              className="text-[10px] font-semibold px-3 py-1.5 rounded"
                              style={{ background: '#1e1e1e', color: '#ef4444' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Reports / Suspended ── */}
          {!loading && activeTab === 'reports' && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-5" style={{ color: '#555' }}>
                Suspended Drivers · {suspendedDrivers.length}
              </p>

              {suspendedDrivers.length === 0 ? (
                <div
                  className="rounded-lg"
                  style={{ background: '#171717', border: '1px solid #1e1e1e', padding: '20px' }}
                >
                  <p className="text-xs" style={{ color: '#444' }}>No suspended drivers.</p>
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: '#171717', border: '1px solid #222' }}
                >
                  {suspendedDrivers.map((driver: any, i: number) => (
                    <div
                      key={driver.userId}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < suspendedDrivers.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    >
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-bold" style={{ background: '#1e1e1e', color: '#555' }}>
                          {initials(driver.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: '#888' }}>{driver.user.name}</p>
                        <p className="text-[11px]" style={{ color: '#444' }}>{driver.user.email}</p>
                      </div>
                      <StatusChip status="suspended" />
                      <button
                        disabled={processing === driver.userId}
                        onClick={() => handleAction(driver.userId, 'unsuspend')}
                        className="text-[11px] font-semibold px-2.5 py-1"
                        style={{ background: '#1e1e1e', color: '#22c55e', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.2)' }}
                      >
                        Reinstate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Feedback ── */}
          {!loading && activeTab === 'feedback' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f5]">User Feedback</h2>
                  <p className="text-sm text-[#888] mt-1">Review issues and feature suggestions from riders and drivers.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {!data?.feedbacks?.length ? (
                  <p className="text-sm text-[#555]">No feedback received yet.</p>
                ) : (
                  data.feedbacks.map((fb: any) => (
                    <div key={fb.id} className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-[#f5f5f5]">{fb.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-[#555]">{fb.user?.email}</p>
                        </div>
                        <StatusChip status={fb.status} />
                      </div>
                      <div className="mb-4">
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border",
                          fb.type === 'ISSUE' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {fb.type}
                        </span>
                      </div>
                      <p className="text-sm text-[#888] whitespace-pre-wrap mb-5">{fb.content}</p>
                      
                      {fb.status === 'OPEN' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFeedbackAction(fb.id, 'review')}
                            disabled={processing === fb.id}
                            className="flex-1 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] text-xs font-semibold py-2 rounded-md transition-colors"
                          >
                            {processing === fb.id ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : 'Mark Reviewed'}
                          </button>
                          <button
                            onClick={() => handleFeedbackAction(fb.id, 'resolve')}
                            disabled={processing === fb.id}
                            className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 text-xs font-semibold py-2 rounded-md transition-colors"
                          >
                            {processing === fb.id ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : 'Resolve'}
                          </button>
                        </div>
                      )}
                      {fb.status === 'REVIEWED' && (
                        <button
                          onClick={() => handleFeedbackAction(fb.id, 'resolve')}
                          disabled={processing === fb.id}
                          className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 text-xs font-semibold py-2 rounded-md transition-colors"
                        >
                          {processing === fb.id ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : 'Resolve'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Users Table ── */}
          {!loading && activeTab === 'users' && (
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#444' }} />
                  <input
                    type="text"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-1.5 rounded-md outline-none"
                    style={{
                      background: '#171717',
                      border: '1px solid #222',
                      color: '#f5f5f5',
                      borderRadius: '6px',
                    }}
                  />
                </div>
                <p className="text-[11px]" style={{ color: '#444' }}>{filteredUsers.length} users</p>
              </div>

              <div
                className="rounded-lg overflow-hidden"
                style={{ background: '#171717', border: '1px solid #222' }}
              >
                {/* Table head */}
                <div
                  className="grid text-[10px] font-semibold uppercase tracking-[0.05em] px-4 py-2.5"
                  style={{
                    gridTemplateColumns: '1fr 80px 100px 80px 100px',
                    borderBottom: '1px solid #1e1e1e',
                    color: '#444',
                  }}
                >
                  <span>User</span>
                  <span>Role</span>
                  <span className="hidden sm:block">Trips / Drops</span>
                  <span>Status</span>
                  <span />
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs" style={{ color: '#444' }}>No users matching "{search}"</p>
                  </div>
                ) : (
                  filteredUsers.map((user: any, i: number) => (
                    <div
                      key={user.id ?? i}
                      className="grid items-center px-4 py-2.5"
                      style={{
                        gridTemplateColumns: '1fr 80px 100px 80px 100px',
                        borderBottom: i < filteredUsers.length - 1 ? '1px solid #1e1e1e' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="w-6 h-6 shrink-0">
                          <AvatarFallback className="text-[9px] font-bold" style={{ background: '#222', color: '#666' }}>
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: '#f5f5f5' }}>{user.name}</p>
                          <p className="text-[11px] truncate" style={{ color: '#444' }}>{user.email}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 w-fit"
                        style={{
                          background: '#1e1e1e',
                          color: user.type === 'Driver' ? '#888' : '#666',
                          borderRadius: '4px',
                        }}
                      >
                        {user.type}
                      </span>
                      <span className="text-[11px] hidden sm:block" style={{ color: '#555' }}>
                        {user.type === 'Driver' ? `${user.trips ?? 0} trips` : `${user.dropsBalance ?? 0} drops`}
                      </span>
                      <StatusChip status={user.detailStatus ?? 'approved'} />
                      <div className="flex items-center justify-end gap-3 text-right">
                        <button
                          onClick={() => setSelectedActivityUser(user)}
                          className="text-[#888] hover:text-orange-brand transition-colors"
                          title="View Activity"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        {user.type === 'Driver' && (user.detailStatus === 'approved' || user.detailStatus === 'suspended') && (
                          <button
                            disabled={processing === user.id}
                            onClick={() => handleAction(user.id, user.detailStatus === 'suspended' ? 'unsuspend' : 'suspend')}
                            className="text-[11px] font-semibold hover:underline"
                            style={{ color: user.detailStatus === 'suspended' ? '#22c55e' : '#444' }}
                          >
                            {user.detailStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* ── Updates ── */}
          {!loading && activeTab === 'updates' && (
            <UpdatesTab />
          )}
          {/* ── Security ── */}
          {!loading && activeTab === 'security' && (
            <div>
              <div className="rounded-lg" style={{ background: '#171717', border: '1px solid #222', padding: '16px 20px' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>Admin Login Audit Log</p>
                  <button
                    onClick={fetchSecurityLogs}
                    className="text-[10px] font-semibold uppercase tracking-[0.05em] transition-opacity hover:opacity-100 opacity-50"
                    style={{ color: 'var(--orange-brand)' }}
                  >
                    Refresh
                  </button>
                </div>

                {securityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#444' }} />
                  </div>
                ) : securityLogs.length === 0 ? (
                  <p className="text-xs py-8 text-center" style={{ color: '#444' }}>No login attempts recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Time', 'Email', 'Result', 'IP Address', 'User Agent'].map(h => (
                            <th key={h} className="text-[10px] font-semibold uppercase tracking-[0.05em] pb-3 pr-4" style={{ color: '#444', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.map((log: any) => (
                          <tr key={log.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                            <td className="py-2.5 pr-4 text-[11px] tabular-nums" style={{ color: '#555', whiteSpace: 'nowrap' }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-4 text-[11px]" style={{ color: '#888' }}>{log.email}</td>
                            <td className="py-2.5 pr-4">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5"
                                style={{
                                  borderRadius: '4px',
                                  background: log.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                  color: log.success ? '#22c55e' : '#ef4444',
                                }}
                              >
                                {log.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-[11px] font-mono" style={{ color: '#555' }}>{log.ipAddress ?? '—'}</td>
                            <td className="py-2.5 text-[11px]" style={{ color: '#444', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.userAgent ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <p className="text-[10px] mt-4" style={{ color: '#333' }}>Showing last 50 entries · Includes both Step 1 and Step 2 attempts</p>
            </div>
          )}
        </main>
      </div>
      
      {selectedActivityUser && (
        <UserActivityModal 
          user={selectedActivityUser} 
          onClose={() => setSelectedActivityUser(null)} 
        />
      )}
    </div>
  )
}
