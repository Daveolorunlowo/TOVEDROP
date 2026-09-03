'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { LiveMap } from '@/components/admin/LiveMap'
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
import { SignOutButton } from '@/components/sign-out-button'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
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
  const s = map[status.toLowerCase()] ?? { label: status, color: 'var(--muted-foreground)', bg: 'var(--border)' }
  return (
    <span
      className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5"
      style={{ background: s.bg, color: s.color, borderRadius: '4px' }}
    >
      {s.label}
    </span>
  )
}

function CheckRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
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
      <p className="text-[10px] font-semibold tracking-wide" style={{ color: done ? '#22c55e' : '#444' }}>
        {detail}
      </p>
    </div>
  )
}

export function AdminLegacyClient({ initialTab }: { initialTab: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)
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
  const [confirmAction, setConfirmAction] = useState<{ id: string, action: string, type: 'payout' | 'feedback' } | null>(null)
  const [triggeringReminders, setTriggeringReminders] = useState(false)

  const triggerReminders = async () => {
    setTriggeringReminders(true)
    try {
      const res = await fetch('/api/admin/reminders/trigger', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`Successfully triggered ${data.remindersSent} reminders!`)
      } else {
        alert(`Failed to trigger reminders: ${data.error}`)
      }
    } catch (e) {
      alert('Error triggering reminders')
    } finally {
      setTriggeringReminders(false)
    }
  }

  const fetchData = async () => {
    const start = Date.now()
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setData(await res.json())
      else if (res.status === 401) router.push('/auth')
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
    setConfirmAction({ id, action, type: 'payout' })
  }

  const handleFeedbackAction = async (id: string, action: 'review' | 'resolve') => {
    setConfirmAction({ id, action, type: 'feedback' })
  }

  const executeAction = async () => {
    if (!confirmAction) return
    const { id, action, type } = confirmAction
    setProcessing(id)
    try {
      const endpoint = type === 'payout' ? '/api/admin/withdrawals/manage' : '/api/admin/feedback/manage'
      const payload = type === 'payout' ? { withdrawalId: id, action } : { feedbackId: id, action }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) fetchData()
      else alert(`Failed to update ${type}.`)
    } catch (e) {
      alert('Network error.')
    } finally {
      setProcessing(null)
      setConfirmAction(null)
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
    <>
      <CommandPalette activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading && (
            <div>
              <SkeletonStatCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-lg bg-card border border-border p-4">
                  <Skeleton width={120} height={12} className="mb-4" />
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} />)}
                </div>
                <div className="rounded-lg bg-card border border-border p-4">
                  <Skeleton width={120} height={12} className="mb-4" />
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Overview ── */}
          {!loading && activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Grouped stats card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Riders',       value: stats.totalUsers },
                  { label: 'Total Drivers',      value: stats.totalDrivers },
                  { label: 'Total Trips',        value: stats.totalTrips },
                  { label: 'Platform Revenue',   value: '$0.00', accent: true },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="relative overflow-hidden rounded-xl p-5 bg-card border border-border"
                  >
                    <p className="text-[11px] font-semibold mb-2 text-muted-foreground transition-colors">
                      {s.label}
                    </p>
                    <p
                      className="text-3xl font-bold tabular-nums tracking-tight relative z-10"
                      style={{ color: s.accent ? 'var(--orange-brand)' : '#fff' }}
                    >
                      {typeof s.value === 'number' ? <CountUp end={s.value} duration={2.5} separator="," /> : s.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Anomaly Radar Banner */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-red-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-400">Anomaly Radar Scanner</h3>
                    <p className="text-xs text-red-400/80">View automated security, fraud, and anomaly reports.</p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/admin/anomalies')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  View Reports &rarr;
                </button>
              </motion.div>

              {/* Manual Trigger for Trip Reminders */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card border border-blue-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-400">Scheduled Trip Reminders</h3>
                    <p className="text-xs text-blue-400/80">Manually fire Resend email and Web Push notifications to drivers for upcoming trips (15-20 min away).</p>
                  </div>
                </div>
                <button 
                  onClick={triggerReminders}
                  disabled={triggeringReminders}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {triggeringReminders ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Trigger Now &rarr;
                </button>
              </motion.div>
              
              {/* Chart and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="lg:col-span-2 rounded-xl p-5 bg-card border border-border"
                >
                  <p className="text-[11px] font-semibold mb-6 text-muted-foreground">
                    Platform Growth (Last 7 Days)
                  </p>
                  <div className="h-[220px] w-full relative z-10">
                    {data.chartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--orange-brand)" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="var(--orange-brand)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: 'var(--orange-brand)', fontWeight: 'bold' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                          />
                          <Area type="monotone" dataKey="trips" stroke="var(--orange-brand)" strokeWidth={4} fillOpacity={1} fill="url(#colorTrips)" activeDot={{ r: 6, fill: 'var(--orange-brand)', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-[#555]">No data available</div>
                    )}
                  </div>
                </motion.div>

                {/* Live Activity Ticker */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="rounded-xl p-5 bg-card border border-border flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                      Live Activity
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[220px]">
                    <AnimatePresence>
                      {data.recentActivity && data.recentActivity.length > 0 ? (
                        data.recentActivity.map((activity: any, idx: number) => (
                          <motion.div 
                            key={activity.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${activity.type === 'TRIP' ? 'bg-orange-brand/20 text-orange-brand shadow-orange-brand/20' : 'bg-purple-500/20 text-purple-400 shadow-purple-500/20'}`}>
                              {activity.type === 'TRIP' ? <Car className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground leading-tight">{activity.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{activity.desc}</p>
                              <p className="text-[9px] text-[#666] mt-1">{new Date(activity.time).toLocaleTimeString()}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-xs text-[#666] text-center mt-10">No recent activity</p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
              
              {/* Map and Pending Approvals Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Live Tracking Map */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="lg:col-span-2 rounded-xl p-1 bg-card border border-border h-[350px]"
                >
                  <LiveMap />
                </motion.div>

                {/* Pending Approvals */}
                {pendingDrivers.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl p-5 bg-card border border-border flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        Pending Approvals
                      </p>
                      <button
                        onClick={() => setActiveTab('approvals')}
                        className="text-[11px] font-semibold text-orange-brand hover:text-orange-400 hover:underline transition-colors"
                      >
                        Review All {pendingDrivers.length} →
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-2">
                      {pendingDrivers.map((d: any) => (
                        <div key={d.userId} className="flex items-center gap-3 p-3 rounded-lg bg-background/20 border border-border transition-colors group cursor-pointer" onClick={() => setActiveTab('approvals')}>
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-white/10 text-[#fff]">
                              {initials(d.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate group-hover:text-orange-brand transition-colors">{d.user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{d.vehicleMake}</p>
                          </div>
                          <StatusChip status="pending" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl p-5 bg-card border border-border flex items-center justify-center text-center"
                  >
                    <div>
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-gray-500 font-semibold">All Caught Up</p>
                      <p className="text-[10px] text-gray-600 mt-1">No pending driver approvals</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Finances ── */}
          {!loading && activeTab === 'finances' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              <div className="flex items-center justify-between bg-card p-4 rounded-xl mb-6 border border-border">
                <div>
                  <p className="text-sm font-bold text-foreground tracking-wide">Financial Command Center</p>
                  <p className="text-[11px] text-gray-400 mt-1">Real-time overview of platform revenue, liabilities, and payouts.</p>
                </div>
                <button
                  onClick={exportFinancesCSV}
                  disabled={!financesData || financesLoading}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50 bg-card border border-border text-foreground"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-brand" />
                  Export CSV Report
                </button>
              </div>

              {financesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : !financesData ? (
                <div className="rounded-lg h-full flex flex-col items-center justify-center min-h-[120px]" style={{ background: 'var(--background)', border: '1px dashed var(--border)', padding: '20px' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No data available.</p>
                </div>
              ) : (
                <>
                  {/* Section 1: Company Position */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">Platform Position</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                      {[
                        { label: 'Total Cash Collected', value: `₦${financesData.company.totalCashCollected.toLocaleString()}`, sub: 'All-Time via Paystack' },
                        { label: 'Recognized Revenue', value: `₦${financesData.company.recognizedRevenue.toLocaleString()}`, sub: 'All-Time Earned Profit' },
                        { label: 'Outstanding Liability', value: `₦${financesData.company.outstandingLiability.toLocaleString()}`, sub: 'Unredeemed Rider Drops' },
                        { label: 'Total Driver Payouts', value: `₦${financesData.company.totalDriverPayouts.toLocaleString()}`, sub: 'All-Time Committed' },
                      ].map((stat, i) => (
                        <motion.div 
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-card p-5 rounded-xl border border-border"
                        >
                          <p className="text-[10px] font-semibold text-gray-400 mb-2">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{stat.value}</p>
                          <p className="text-[10px] text-gray-500 mt-2">{stat.sub}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-card rounded-xl overflow-x-auto border border-border">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-white/5 border-b border-border">
                          <tr>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400">Period</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Cash Collected</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Recognized Revenue</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Driver Payouts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4 text-sm font-medium text-foreground">This Week</td>
                            <td className="px-5 py-4 text-sm text-right text-gray-300">₦{financesData.company.thisWeek.cashCollected.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm text-right font-semibold text-green-400">+₦{financesData.company.thisWeek.recognizedRevenue.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm text-right font-semibold text-red-400">-₦{financesData.company.thisWeek.driverPayouts.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4 text-sm font-medium text-foreground">This Month</td>
                            <td className="px-5 py-4 text-sm text-right text-gray-300">₦{financesData.company.thisMonth.cashCollected.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm text-right font-semibold text-green-400">+₦{financesData.company.thisMonth.recognizedRevenue.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm text-right font-semibold text-red-400">-₦{financesData.company.thisMonth.driverPayouts.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-white/5 border-t-2 border-border">
                            <td className="px-5 py-4 text-sm font-bold text-foreground tracking-wider">All-Time</td>
                            <td className="px-5 py-4 text-sm text-right font-bold text-foreground">₦{financesData.company.totalCashCollected.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm text-right font-bold text-green-400">+₦{financesData.company.recognizedRevenue.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm text-right font-bold text-red-400">-₦{financesData.company.totalDriverPayouts.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Section 2: Drivers */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-orange-brand/20 text-orange-brand">
                        <Car className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">Driver Balances</h2>
                    </div>

                    <div className="bg-card rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-6 border border-border">
                      <div>
                        <p className="text-[10px] font-semibold text-orange-400 mb-1">Total Outstanding Driver Balances</p>
                        <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">₦{financesData.drivers.totalBalances.toLocaleString()}</p>
                      </div>
                      <div className="h-10 w-px bg-border hidden sm:block"></div>
                      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                        This is the sum of all driver wallet balances that have not yet been paid out via Paystack transfers.
                      </p>
                    </div>
                    
                    <div className="bg-card rounded-xl overflow-x-auto border border-border">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-white/5 border-b border-border">
                          <tr>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400">Driver Name</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400">Status</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Wallet Balance</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Total Trips</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Avg ₦/Trip</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Last Payout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {financesData.drivers.list.map((d: any, i: number) => (
                            <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-5 py-4 text-sm font-medium text-foreground group-hover:text-orange-brand transition-colors">{d.name}</td>
                              <td className="px-5 py-4"><StatusChip status={d.status} /></td>
                              <td className="px-5 py-4 text-sm text-right font-bold text-orange-400">₦{d.walletBalance.toLocaleString()}</td>
                              <td className="px-5 py-4 text-sm text-right text-gray-300">{d.totalTrips}</td>
                              <td className="px-5 py-4 text-sm text-right text-gray-400">₦{d.avgPerTrip.toFixed(0)}</td>
                              <td className="px-5 py-4 text-xs text-right text-gray-500">
                                {d.lastPayoutDate ? new Date(d.lastPayoutDate).toLocaleDateString() : 'Never'}
                              </td>
                            </tr>
                          ))}
                          {financesData.drivers.list.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">No drivers found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Section 3: Riders */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">Rider Drops Economy</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                      <div className="bg-card rounded-xl p-5 border border-blue-500/20">
                        <p className="text-[10px] font-semibold text-blue-400 mb-1">Total Drops in Circulation</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{financesData.riders.totalDrops.toLocaleString()} <span className="text-sm font-medium text-gray-500">drops</span></p>
                      </div>
                      <div className="bg-card rounded-xl p-5 border border-border">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1">Est. Naira Value of Drops</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">₦{financesData.riders.totalNairaValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-card rounded-xl p-5 border border-border">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1">Avg Drops / Active Rider</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{financesData.riders.avgDropsPerRider.toFixed(1)} <span className="text-sm font-medium text-gray-500">drops</span></p>
                      </div>
                    </div>

                    <div className="bg-card rounded-xl overflow-x-auto border border-border">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-white/5 border-b border-border">
                          <tr>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400">Rider Name</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400">Email</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Drops Balance</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Est. Naira Value</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-400 text-right">Total Trips</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {financesData.riders.list.map((r: any) => (
                            <tr key={r.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-5 py-4 text-sm font-medium text-foreground">{r.name}</td>
                              <td className="px-5 py-4 text-sm text-gray-400">{r.email}</td>
                              <td className="px-5 py-4 text-sm text-right font-bold text-blue-400">{r.dropsBalance}</td>
                              <td className="px-5 py-4 text-sm text-right text-gray-300">
                                ₦{r.estNairaValue.toLocaleString()}
                                {!r.hasDropLots && r.dropsBalance > 0 && <span className="text-[10px] block text-orange-400 mt-0.5 opacity-80">*approximate</span>}
                              </td>
                              <td className="px-5 py-4 text-sm text-right text-gray-400">{r.totalTripsBooked}</td>
                            </tr>
                          ))}
                          {financesData.riders.list.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No active riders with drops found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </motion.div>
          )}

          {/* ── Revenue Split Settings ── */}
          {!loading && activeTab === 'revenue_split' && (
            <div>
              <p className="text-[11px] font-semibold mb-5" style={{ color: 'var(--muted-foreground)' }}>
                Revenue Split Configuration
              </p>
              
              {settingsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="rounded-lg p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
                    Drivers automatically receive a flat <strong>₦12</strong> fee per completed ride. Configure how the <em>remaining</em> balance of the booking fee is split between the Admin and the Company. The total must equal 100%.
                  </p>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Admin Percentage (%)</label>
                      <input 
                        type="number"
                        min="0" max="100"
                        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--orange-brand)]"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        value={revenueSettings.adminPercentage}
                        onChange={e => setRevenueSettings({...revenueSettings, adminPercentage: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Company (Platform) Percentage (%)</label>
                      <input 
                        type="number"
                        min="0" max="100"
                        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--orange-brand)]"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        value={revenueSettings.companyPercentage}
                        onChange={e => setRevenueSettings({...revenueSettings, companyPercentage: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span style={{ color: 'var(--muted-foreground)' }}>Total: </span>
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
              <p className="text-[11px] font-semibold mb-5" style={{ color: 'var(--muted-foreground)' }}>
                Driver Approvals · {pendingDrivers.length} pending
              </p>

              {pendingDrivers.length === 0 ? (
                <div
                  className="rounded-lg flex items-start gap-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px' }}
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#22c55e' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>All applications reviewed</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>No pending driver applications at this time.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDrivers.map((driver: any) => (
                    <div
                      key={driver.userId}
                      className="rounded-lg"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px' }}
                    >
                      {/* Driver identity row */}
                      <div className="flex items-center gap-3 mb-4" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs font-bold" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                            {initials(driver.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{driver.user.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                            {driver.user.email} · {driver.phone}
                          </p>
                        </div>
                        <StatusChip status="pending" />
                      </div>

                      {/* Verification checklist */}
                      <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                        Verification
                      </p>
                      <CheckRow done label="Name & Contact" detail={driver.user.name} />
                      <CheckRow done label="Vehicle" detail={`${driver.vehicleMake} ${driver.vehicleModel}`} />
                      <CheckRow done label="Plate Number" detail={driver.vehiclePlate} />
                      <CheckRow done label="License Number" detail={driver.licenseNumber} />

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4" style={{ paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
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
                          style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: '6px' }}
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
              <p className="text-[11px] font-semibold mb-5" style={{ color: 'var(--muted-foreground)' }}>
                Pending Payouts · {pendingPayouts.length}
              </p>

              {withdrawalRequests.length === 0 ? (
                <div className="rounded-lg py-8 text-center" style={{ background: 'var(--card)', border: '1px solid #1e1e1e' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No withdrawal requests.</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  {withdrawalRequests.map((req: any, i: number) => (
                    <div
                      key={req.id}
                      className="flex items-start justify-between px-4 py-4"
                      style={{ borderBottom: i < withdrawalRequests.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    >
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                            {initials(req.driver.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{req.driver.user.name}</p>
                          <div className="text-[11px] mt-1 space-y-0.5" style={{ color: 'var(--muted-foreground)' }}>
                            <p>Bank: <span className="text-foreground">{req.driver.bankName}</span></p>
                            <p>Acct: <span className="text-foreground">{req.driver.accountNumber}</span></p>
                            <p>Name: <span className="text-foreground">{req.driver.accountName}</span></p>
                            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Requested: {new Date(req.createdAt).toLocaleString()}</p>
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
                              style={{ background: 'var(--card)', color: '#ef4444' }}
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
              <p className="text-[11px] font-semibold mb-5" style={{ color: 'var(--muted-foreground)' }}>
                Suspended Drivers · {suspendedDrivers.length}
              </p>

              {suspendedDrivers.length === 0 ? (
                <div
                  className="rounded-lg"
                  style={{ background: 'var(--card)', border: '1px solid #1e1e1e', padding: '20px' }}
                >
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No suspended drivers.</p>
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {suspendedDrivers.map((driver: any, i: number) => (
                    <div
                      key={driver.userId}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < suspendedDrivers.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    >
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                          {initials(driver.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{driver.user.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{driver.user.email}</p>
                      </div>
                      <StatusChip status="suspended" />
                      <button
                        disabled={processing === driver.userId}
                        onClick={() => handleAction(driver.userId, 'unsuspend')}
                        className="text-[11px] font-semibold px-2.5 py-1"
                        style={{ background: 'var(--card)', color: '#22c55e', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.2)' }}
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
                  <p className="text-sm text-muted-foreground mt-1">Review issues and feature suggestions from riders and drivers.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {!data?.feedbacks?.length ? (
                  <p className="text-sm text-[#555]">No feedback received yet.</p>
                ) : (
                  data.feedbacks.map((fb: any) => (
                    <div key={fb.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-[#f5f5f5]">{fb.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-[#555]">{fb.user?.email}</p>
                        </div>
                        <StatusChip status={fb.status} />
                      </div>
                      <div className="mb-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded border",
                          fb.type === 'ISSUE' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {fb.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-5">{fb.content}</p>
                      
                      {fb.status === 'OPEN' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFeedbackAction(fb.id, 'review')}
                            disabled={processing === fb.id}
                            className="flex-1 bg-card hover:bg-[#252525] border border-border text-xs font-semibold py-2 rounded-md transition-colors"
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-1.5 rounded-md outline-none"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      borderRadius: '6px',
                    }}
                  />
                </div>
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{filteredUsers.length} users</p>
              </div>

              <div
                className="rounded-lg overflow-x-auto"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-[500px]">
                {/* Table head */}
                <div
                  className="grid text-[10px] font-semibold px-4 py-2.5"
                  style={{
                    gridTemplateColumns: '1fr 80px 100px 80px 100px',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
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
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No users matching "{search}"</p>
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
                          <AvatarFallback className="text-[9px] font-bold" style={{ background: 'var(--border)', color: '#666' }}>
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{user.name}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{user.email}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 w-fit"
                        style={{
                          background: 'var(--card)',
                          color: user.type === 'Driver' ? '#888' : '#666',
                          borderRadius: '4px',
                        }}
                      >
                        {user.type}
                      </span>
                      <span className="text-[11px] hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                        {user.type === 'Driver' ? `${user.trips ?? 0} trips` : `${user.dropsBalance ?? 0} drops`}
                      </span>
                      <StatusChip status={user.detailStatus ?? 'approved'} />
                      <div className="flex items-center justify-end gap-3 text-right">
                        <button
                          onClick={() => setSelectedActivityUser(user)}
                          className="text-muted-foreground hover:text-orange-brand transition-colors"
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
            </div>
          )}
          {/* ── Updates ── */}
          {!loading && activeTab === 'updates' && (
            <UpdatesTab />
          )}
          {/* ── Security ── */}
          {!loading && activeTab === 'security' && (
            <div>
              <div className="rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>Admin Login Audit Log</p>
                  <button
                    onClick={fetchSecurityLogs}
                    className="text-[10px] font-semibold transition-opacity hover:opacity-100 opacity-50"
                    style={{ color: 'var(--orange-brand)' }}
                  >
                    Refresh
                  </button>
                </div>

                {securityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                ) : securityLogs.length === 0 ? (
                  <p className="text-xs py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>No login attempts recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Time', 'Email', 'Result', 'IP Address', 'User Agent'].map(h => (
                            <th key={h} className="text-[10px] font-semibold pb-3 pr-4" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.map((log: any) => (
                          <tr key={log.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                            <td className="py-2.5 pr-4 text-[11px] tabular-nums" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-4 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{log.email}</td>
                            <td className="py-2.5 pr-4">
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5"
                                style={{
                                  borderRadius: '4px',
                                  background: log.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                  color: log.success ? '#22c55e' : '#ef4444',
                                }}
                              >
                                {log.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>{log.ipAddress ?? '—'}</td>
                            <td className="py-2.5 text-[11px]" style={{ color: 'var(--muted-foreground)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.userAgent ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <p className="text-[10px] mt-4" style={{ color: 'var(--muted-foreground)' }}>Showing last 50 entries · Includes both Step 1 and Step 2 attempts</p>
            </div>
          )}
      {selectedActivityUser && (
        <UserActivityModal 
          user={selectedActivityUser} 
          onClose={() => setSelectedActivityUser(null)} 
        />
      )}

      {/* Admin Action Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.type === 'payout' ? 'Confirm Payout Action' : 'Confirm Feedback Action'}
        description={
          confirmAction?.type === 'payout' 
            ? `Are you sure you want to ${confirmAction.action} this payout request?`
            : `Are you sure you want to mark this feedback as ${confirmAction?.action === 'resolve' ? 'resolved' : 'under review'}?`
        }
        confirmText={confirmAction?.action === 'approve' || confirmAction?.action === 'resolve' ? 'Confirm' : 'Confirm Action'}
        isDestructive={confirmAction?.action === 'reject'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeAction}
      />
    </>
  )
}
