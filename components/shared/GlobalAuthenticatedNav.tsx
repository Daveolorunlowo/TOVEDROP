'use client'

import React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Car, Wallet, User, List, Route, MapPin, Gift, Search } from 'lucide-react'
import { FluidNav, NavTab } from '@/components/shared/FluidNav'
import { SignOutButton } from '@/components/sign-out-button'

const riderTabs: NavTab[] = [
  { id: 'book', label: 'Book', icon: Search, href: '/book', matchPrefix: true },
  { id: 'trips', label: 'My Trips', icon: MapPin, href: '/dashboard' },
  { id: 'drops', label: 'Drops', icon: Gift, href: '/dashboard/buy-drops' },
  { id: 'profile', label: 'Profile', icon: User, href: '/dashboard/settings' },
]

const driverTabs: NavTab[] = [
  { id: 'requests', label: 'Requests', icon: Car, href: '/driver', hasNotification: true },
  { id: 'trips', label: 'My Trips', icon: Route, href: '/driver/trips' }, // If it doesn't exist, they stay on /driver. But /driver has both.
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/driver/earnings' },
  { id: 'profile', label: 'Profile', icon: User, href: '/driver/settings' },
]

export function GlobalAuthenticatedNav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status !== 'authenticated' || !session?.user) return null

  // Don't show on admin or auth pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth') || pathname.startsWith('/apply')) {
    return null
  }

  // Don't show on landing page
  if (pathname === '/') return null

  const isDriver = session.user.role === 'DRIVER'
  const tabs = isDriver ? driverTabs : riderTabs

  // We can render a slim top bar and then the FluidNav
  return (
    <div className="w-full flex flex-col items-center pt-4 pb-2 px-4 sm:pt-6 sm:pb-4 pointer-events-none sticky top-0 z-40 bg-gradient-to-b from-[#111111] to-transparent">
      {/* Slim Top Bar (only visible on desktop, or keep it minimal on mobile) */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 pointer-events-auto">
        <Link
          href="/"
          className="text-lg sm:text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80"
          style={{ letterSpacing: '-0.02em' }}
        >
          <span className="text-white">TOVE</span>
          <span className="text-orange-brand">DROP</span>
        </Link>
        {/* On mobile, we might just hide the top-right controls or use a tiny avatar */}
        <div className="flex items-center gap-3">
          <Link href={isDriver ? '/driver/settings' : '/dashboard/settings'} className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center hover:border-orange-brand/50 transition-colors">
            <User className="w-4 h-4 text-[#888]" />
          </Link>
          <div className="pointer-events-auto">
            <SignOutButton
              variant="outline"
              className="text-xs border-[#222] bg-transparent hover:bg-[#1e1e1e] rounded-md px-3 py-1.5 !text-[#555] h-8"
            />
          </div>
        </div>
      </div>

      {/* Fluid Nav Centered */}
      <div className="pointer-events-auto">
        <FluidNav tabs={tabs} />
      </div>
    </div>
  )
}
