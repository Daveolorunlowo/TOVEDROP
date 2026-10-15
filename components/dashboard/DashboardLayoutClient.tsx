'use client'

import { TripPoller } from '@/components/trip-poller'
import { RiderNotificationBanner } from '@/components/dashboard/RiderNotificationBanner'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userId: string
}

export function DashboardLayoutClient({ children, userId }: DashboardLayoutClientProps) {
  return (
    <div className="flex min-h-screen text-foreground w-full">
      {/* Real-time Push & In-App Poller with audio alerts for all rider routes */}
      {userId && <TripPoller userId={userId} />}
      
      {/* Rider Notification Opt-in & Health Sync Banner */}
      <RiderNotificationBanner />

      <main className="flex-1 w-full min-w-0">
        {children}
      </main>
    </div>
  )
}
