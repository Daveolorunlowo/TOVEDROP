import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertSection } from './AlertSection'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default async function AnomaliesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch the latest anomaly report
  const latestReport = await prisma.anomalyReport.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      alerts: {
        orderBy: { riskScore: 'desc' }
      }
    }
  })

  if (!latestReport) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
        <h1 className="text-2xl font-bold text-foreground mb-4">Anomaly Radar</h1>
        <div className="bg-card rounded-2xl p-8 border border-border text-center shadow-sm">
          <p className="text-muted-foreground mb-2 text-sm">No anomaly reports have been generated yet.</p>
          <p className="text-xs text-muted-foreground/80">The automated bot runs daily at 2:00 AM.</p>
        </div>
      </div>
    )
  }

  const criticalAlerts = latestReport.alerts.filter(a => a.severity === 'CRITICAL')
  const investigateAlerts = latestReport.alerts.filter(a => a.severity === 'INVESTIGATE')
  const monitorAlerts = latestReport.alerts.filter(a => a.severity === 'MONITOR')

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center text-orange-brand">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Anomaly Radar</h1>
            <p className="text-xs text-muted-foreground">Automated behavioral risk scoring & fraud detection</p>
          </div>
        </div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-brand hover:underline px-3 py-1.5 rounded-lg bg-orange-brand/10 border border-orange-brand/20">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to HQ
        </Link>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Executive Summary</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Report generated: {new Date(latestReport.createdAt).toLocaleString()} • Period Analyzed: {latestReport.periodAnalyzed} hours
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
            <p className="text-red-500 font-black text-3xl tabular-nums">{criticalAlerts.length}</p>
            <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mt-1">Critical Alerts</p>
          </div>
          <div className="bg-orange-brand/10 p-4 rounded-xl border border-orange-brand/20">
            <p className="text-orange-brand font-black text-3xl tabular-nums">{investigateAlerts.length}</p>
            <p className="text-orange-brand text-xs font-bold uppercase tracking-wider mt-1">Investigate Alerts</p>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
            <p className="text-amber-500 font-black text-3xl tabular-nums">{monitorAlerts.length}</p>
            <p className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mt-1">Monitor Alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground border-t border-border pt-4">
          <div>Rides Analyzed: <span className="font-bold text-foreground tabular-nums">{latestReport.totalRides}</span></div>
          <div>Total Users: <span className="font-bold text-foreground tabular-nums">{latestReport.totalUsers}</span></div>
          <div>Total Drivers: <span className="font-bold text-foreground tabular-nums">{latestReport.totalDrivers}</span></div>
        </div>
      </div>

      {/* ALERTS */}
      <div className="space-y-6">
        <AlertSection title="🔴 CRITICAL (Risk Score 80+)" alerts={criticalAlerts} color="red" />
        <AlertSection title="🟠 INVESTIGATE (Risk Score 60-79)" alerts={investigateAlerts} color="orange" />
        <AlertSection title="🟡 MONITOR (Risk Score 40-59)" alerts={monitorAlerts} color="yellow" />
      </div>
    </div>
  )
}
