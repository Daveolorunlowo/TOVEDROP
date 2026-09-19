'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Search, Users, Car, TrendingUp,
  Flag, FileText, LayoutDashboard, Menu, X,
  Loader2, Check, ShieldAlert
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SkeletonStatCard, SkeletonTableRow } from '@/components/shared/SkeletonVariants'
import { Skeleton } from '@/components/shared/Skeleton'
import { cn } from '@/lib/utils'

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
  { id: 'revenue',   label: 'Revenue',          icon: TrendingUp },
  { id: 'approvals', label: 'Driver Approvals',  icon: Car },
  { id: 'reports',   label: 'Reports',           icon: Flag },
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
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [revenueLoading, setRevenueLoading] = useState(false)

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
    if (activeTab === 'revenue') fetchRevenue()
  }, [activeTab])

  const fetchRevenue = async () => {
    setRevenueLoading(true)
    try {
      const res = await fetch('/api/admin/revenue')
      if (res.ok) {
        const json = await res.json()
        setRevenueData(json.platformRevenues || [])
      }
    } catch (e) { console.error(e) }
    finally { setRevenueLoading(false) }
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

  if (!data && !loading) return null

  const { stats, drivers, users } = data || { stats: {}, drivers: [], users: [] }
  const pendingDrivers  = drivers.filter((d: any) => d.status === 'PENDING')
  const suspendedDrivers = drivers.filter((d: any) => d.status === 'SUSPENDED')

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
            <div>
              {/* Grouped stats card */}
              <div
                className="rounded-lg mb-6"
                style={{ background: '#171717', border: '1px solid #222', padding: '16px 20px' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4" style={{ color: '#555' }}>
                  Platform Stats
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
                  {[
                    { label: 'Total Riders',       value: String(stats.totalUsers) },
                    { label: 'Total Drivers',      value: String(stats.totalDrivers) },
                    { label: 'Total Trips',        value: String(stats.totalTrips) },
                    { label: 'Pending Approvals',  value: String(pendingDrivers.length), accent: pendingDrivers.length > 0 },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className={cn(i > 0 && 'pl-5 sm:border-l')}
                      style={{ borderColor: '#1e1e1e', paddingRight: i < 3 ? '20px' : undefined }}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.05em] mb-1" style={{ color: '#555' }}>
                        {s.label}
                      </p>
                      <p
                        className="text-2xl font-bold tabular-nums"
                        style={{ color: s.accent ? 'var(--orange-brand)' : '#f5f5f5', letterSpacing: '-0.02em' }}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
                {pendingDrivers.length > 0 && (
                  <div style={{ borderTop: '1px solid #1e1e1e', marginTop: '14px', paddingTop: '10px' }}>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[11px] font-semibold"
                      style={{ color: 'var(--orange-brand)' }}
                    >
                      Review {pendingDrivers.length} pending application{pendingDrivers.length !== 1 ? 's' : ''} →
                    </button>
                  </div>
                )}
              </div>

              {/* Two compact lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pending approvals preview */}
                <div
                  className="rounded-lg"
                  style={{ background: '#171717', border: '1px solid #222', padding: '16px 20px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
                      Pending Approvals
                    </p>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[11px] font-semibold"
                      style={{ color: 'var(--orange-brand)' }}
                    >
                      View all →
                    </button>
                  </div>
                  {pendingDrivers.length === 0 ? (
                    <p className="text-xs" style={{ color: '#444' }}>All caught up.</p>
                  ) : (
                    <div>
                      {pendingDrivers.slice(0, 4).map((d: any, i: number) => (
                        <div
                          key={d.userId}
                          className="flex items-center gap-3 py-2.5"
                          style={{ borderBottom: i < Math.min(pendingDrivers.length, 4) - 1 ? '1px solid #1e1e1e' : 'none' }}
                        >
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold" style={{ background: '#222', color: '#888' }}>
                              {initials(d.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#f5f5f5' }}>{d.user.name}</p>
                            <p className="text-[11px]" style={{ color: '#555' }}>{d.vehicleMake} {d.vehicleModel}</p>
                          </div>
                          <StatusChip status="pending" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suspended drivers */}
                <div
                  className="rounded-lg"
                  style={{ background: '#171717', border: '1px solid #222', padding: '16px 20px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
                      Suspended Drivers
                    </p>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-[11px] font-semibold"
                      style={{ color: '#888' }}
                    >
                      View all →
                    </button>
                  </div>
                  {suspendedDrivers.length === 0 ? (
                    <p className="text-xs" style={{ color: '#444' }}>No suspended drivers.</p>
                  ) : (
                    <div>
                      {suspendedDrivers.slice(0, 4).map((d: any, i: number) => (
                        <div
                          key={d.userId}
                          className="flex items-center gap-3 py-2.5"
                          style={{ borderBottom: i < Math.min(suspendedDrivers.length, 4) - 1 ? '1px solid #1e1e1e' : 'none' }}
                        >
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold" style={{ background: '#1e1e1e', color: '#555' }}>
                              {initials(d.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#888' }}>{d.user.name}</p>
                            <p className="text-[11px]" style={{ color: '#444' }}>{d.rating > 0 ? d.rating.toFixed(1) + ' avg' : 'No ratings'}</p>
                          </div>
                          <StatusChip status="suspended" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Revenue ── */}
          {!loading && activeTab === 'revenue' && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-5" style={{ color: '#555' }}>
                Platform Revenue Log
              </p>
              {revenueLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : revenueData.length === 0 ? (
                <div
                  className="rounded-lg h-full flex flex-col items-center justify-center min-h-[120px]"
                  style={{ background: '#111111', border: '1px dashed #222', padding: '20px' }}
                >
                  <p className="text-xs" style={{ color: '#444' }}>No revenue records found.</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden" style={{ background: '#171717', border: '1px solid #222' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#555', borderBottom: '1px solid #222' }}>Date</th>
                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Trip</th>
                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555', borderBottom: '1px solid #222' }}>Driver</th>
                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Driver Earnings</th>
                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: '#555', borderBottom: '1px solid #222' }}>Platform Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.map((rev, i) => (
                          <tr key={rev.id} style={{ borderBottom: i < revenueData.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                            <td className="px-4 py-3 text-[11px] whitespace-nowrap" style={{ color: '#888' }}>
                              {new Date(rev.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-[11px] whitespace-nowrap" style={{ color: '#555' }}>
                              {rev.trip?.pickup ? `${rev.trip.pickup.split(',')[0]} → ${rev.trip.destination.split(',')[0]}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#f5f5f5' }}>
                              {rev.trip?.driver?.user?.name || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-[11px] text-right whitespace-nowrap" style={{ color: '#22c55e' }}>
                              +₦{rev.trip?.walletTransactions?.find((t: any) => t.type === 'RIDE_EARNING')?.amount?.toLocaleString() || 0}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-right whitespace-nowrap" style={{ color: '#f5f5f5' }}>
                              +₦{rev.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        onClick={() => handleAction(driver.userId, 'approve')}
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
                    gridTemplateColumns: '1fr 80px 100px 80px 60px',
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
                        gridTemplateColumns: '1fr 80px 100px 80px 60px',
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
                      <div className="text-right">
                        {user.type === 'Driver' && user.detailStatus === 'approved' && (
                          <button
                            disabled={processing === user.id}
                            onClick={() => handleAction(user.id, 'suspend')}
                            className="text-[11px] font-semibold hover:underline"
                            style={{ color: '#444' }}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
    </div>
  )
}
