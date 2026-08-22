import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'
import { TripPoller } from '@/components/trip-poller'
import { Suspense } from 'react'
import { Menu, Search, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/dashboard/BottomNav'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  if (session.user.role !== 'RIDER') {
    redirect(getRoleRedirectPath(session.user.role as string, session.user.driverStatus as string | null))
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/auth')

  return (
    <div className="bg-bg-deep min-h-screen pb-24 relative font-sans">
      <TripPoller userId={user.id} />

      <div className="max-w-md mx-auto px-5 py-6">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/settings" className="p-2 -ml-2 text-white hover:text-primary transition-colors">
            <Menu className="w-6 h-6" />
          </Link>
          <Link href="/dashboard/buy-drops" className="flex items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-full border border-border-default hover:border-primary/50 transition-colors">
            <span className="text-white font-bold text-sm">{user.dropsBalance}</span>
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Drops 🪙</span>
          </Link>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white/70 mb-1">
            Hello, {user.name?.split(' ')[0]}
          </h1>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Where to next?
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <Link href="/book" className="absolute inset-0 z-10" aria-label="Book a ride"></Link>
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search Destination..." 
              className="pl-12 h-14 text-lg bg-surface-card border-border-default text-white rounded-2xl cursor-pointer pointer-events-none"
              readOnly
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          </div>
        </div>

        {/* Recent Places */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-border-subtle" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Recent Places</span>
            <div className="h-[1px] flex-1 bg-border-subtle" />
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Library', desc: 'Main Campus' },
              { name: 'North Dorms', desc: 'Student Housing' }
            ].map((place, i) => (
              <Link 
                key={i} 
                href={`/book?dest=${encodeURIComponent(place.name)}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface-card border border-border-default hover:border-primary/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-[15px]">{place.name}</h3>
                  <p className="text-text-secondary text-xs mt-0.5">{place.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Fixed Bottom Button & Nav container */}
      <div className="fixed bottom-[80px] left-0 right-0 px-5 z-40 flex justify-center pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <Button 
            asChild 
            size="lg" 
            className="w-full h-14 rounded-2xl text-[15px] font-bold shadow-[0_8px_30px_rgba(249,115,22,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Link href="/book">
              BOOK RIDE
            </Link>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}