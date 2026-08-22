import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { DriverTabs } from '@/components/driver/Tabs'
import { RequestsTab } from '@/components/driver/RequestsTab'
import { MyTripsTab } from '@/components/driver/MyTripsTab'
import { WalletTab } from '@/components/driver/WalletTab'
import { ProfileTab } from '@/components/driver/ProfileTab'
import { DriverPageClientWrapper } from '@/components/driver/DriverPageClientWrapper'
import { ClientAutoRefresher } from '@/components/driver/ClientAutoRefresher'
import { Star, Clock, XCircle, Car } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const initials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '?'

export default async function DriverDashboardPage({ 
  searchParams 
}: { 
  searchParams: { tab?: string, page?: string, subtab?: string } 
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { driverProfile: true }
  })

  if (!user) redirect('/auth')

  if (user.role !== 'DRIVER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
        <Car className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Not a Driver Yet?</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          You need to apply and be approved before you can access the driver dashboard.
        </p>
        <Link href="/apply">
          <Button className="bg-orange-brand hover:brightness-110 text-primary-foreground font-bold">
            Apply to Drive
          </Button>
        </Link>
      </div>
    )
  }

  const driverProfile = user.driverProfile
  if (!driverProfile) redirect('/apply')

  const status = driverProfile.status

  if (status === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
        <Clock className="w-12 h-12 mb-4 text-orange-brand" />
        <h2 className="text-xl font-bold mb-2">Application Under Review</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We are currently reviewing your driver application. This process usually takes 24-48 hours. We'll email you once you're approved.
        </p>
      </div>
    )
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
        <XCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Account Suspended</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your driver account has been suspended. Please contact support for more information or to appeal this decision.
        </p>
      </div>
    )
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
        <XCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Application Not Approved</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Unfortunately, your application to drive with TOVEDROP was not approved at this time.
        </p>
        <Link href="/apply">
          <Button variant="outline" className="border-border hover:bg-surface-elevated">
            Reapply
          </Button>
        </Link>
      </div>
    )
  }

  const tab = searchParams.tab || 'requests'

  return (
    <div className="bg-background min-h-screen pb-20">
      
      {/* ── Client Wrapper handles LocationBroadcaster & Push Notifications ── */}
      <DriverPageClientWrapper driverId={driverProfile.id} driverName={user.name!} />

      <div className="max-w-5xl mx-auto px-5 py-8">
        
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4 min-w-0 max-w-full">
            <Avatar className="w-11 h-11 border border-border">
              <AvatarFallback className="text-sm font-bold bg-surface-elevated text-muted-foreground">
                {initials(user.name!)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-0.5 text-muted-foreground">
                Driver Dashboard
              </p>
              <h1 className="text-2xl font-bold break-words text-foreground tracking-tight">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
                  Approved
                </span>
                {driverProfile.rating > 0 && (
                  <span className="flex items-center gap-1 text-[11px] whitespace-nowrap text-muted-foreground">
                    <Star className="w-3 h-3 text-orange-brand fill-orange-brand" />
                    {driverProfile.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ClientAutoRefresher />
        </div>

        {/* ── Tabs Navigation ── */}
        <DriverTabs />

        {/* ── Tab Content ── */}
        <Suspense fallback={
          <div className="py-10 flex flex-col gap-4">
            <div className="h-32 bg-muted/10 animate-pulse rounded-xl" />
            <div className="h-32 bg-muted/10 animate-pulse rounded-xl" />
          </div>
        } key={tab + (searchParams.page || '') + (searchParams.subtab || '')}>
          {tab === 'requests' && <RequestsTab userId={user.id} searchParams={searchParams} />}
          {tab === 'trips' && <MyTripsTab driverId={user.id} searchParams={searchParams} />}
          {tab === 'wallet' && <WalletTab driverId={driverProfile.id} searchParams={searchParams} />}
          {tab === 'profile' && <ProfileTab driverId={driverProfile.id} user={user} />}
        </Suspense>

      </div>
    </div>
  )
}
