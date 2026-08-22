import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertSection } from './AlertSection';

export default async function AnomaliesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch the latest anomaly report
  const latestReport = await prisma.anomalyReport.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      alerts: {
        orderBy: { riskScore: 'desc' }
      }
    }
  });

  if (!latestReport) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Anomaly Radar</h1>
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
          <p className="text-gray-500 mb-4">No anomaly reports have been generated yet.</p>
          <p className="text-sm text-gray-400">The automated bot runs daily at 2:00 AM.</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = latestReport.alerts.filter(a => a.severity === 'CRITICAL');
  const investigateAlerts = latestReport.alerts.filter(a => a.severity === 'INVESTIGATE');
  const monitorAlerts = latestReport.alerts.filter(a => a.severity === 'MONITOR');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Anomaly Radar</h1>
        <Link href="/admin" className="text-blue-500 hover:underline">
          &larr; Back to Admin
        </Link>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
        <p className="text-sm text-gray-500 mb-6">
          Report generated: {new Date(latestReport.createdAt).toLocaleString()} | 
          Period Analyzed: {latestReport.periodAnalyzed} hours
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-red-700 font-bold text-2xl">{criticalAlerts.length}</p>
            <p className="text-red-600 text-sm font-medium">Critical Alerts</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <p className="text-orange-700 font-bold text-2xl">{investigateAlerts.length}</p>
            <p className="text-orange-600 text-sm font-medium">Investigate Alerts</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
            <p className="text-yellow-700 font-bold text-2xl">{monitorAlerts.length}</p>
            <p className="text-yellow-600 text-sm font-medium">Monitor Alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t pt-4">
          <div>Rides Analyzed: <span className="font-bold text-gray-900">{latestReport.totalRides}</span></div>
          <div>Total Users: <span className="font-bold text-gray-900">{latestReport.totalUsers}</span></div>
          <div>Total Drivers: <span className="font-bold text-gray-900">{latestReport.totalDrivers}</span></div>
        </div>
      </div>

      {/* ALERTS */}
      <div className="space-y-6">
        <AlertSection title="🔴 CRITICAL (Risk Score 80+)" alerts={criticalAlerts} color="red" />
        <AlertSection title="🟠 INVESTIGATE (Risk Score 60-79)" alerts={investigateAlerts} color="orange" />
        <AlertSection title="🟡 MONITOR (Risk Score 40-59)" alerts={monitorAlerts} color="yellow" />
      </div>
    </div>
  );
}
