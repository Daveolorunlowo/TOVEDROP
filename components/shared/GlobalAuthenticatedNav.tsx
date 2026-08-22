'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Car, Wallet, User, MapPin, Gift, Search, Bell } from 'lucide-react'
import { NavTab, OrbitalNav } from '@/components/shared/OrbitalNav'
import { SignOutButton } from '@/components/sign-out-button'
import { ThemeToggle } from '@/components/theme-toggle'
const riderTabs: NavTab[] = [
  { id: 'book', label: 'Book', icon: Search, href: '/book', matchPrefix: true },
  { id: 'trips', label: 'My Trips', icon: MapPin, href: '/dashboard' },
  { id: 'drops', label: 'Drops', icon: Gift, href: '/dashboard/buy-drops' },
  { id: 'updates', label: 'Updates', icon: Bell, href: '/updates' },
  { id: 'profile', label: 'Profile', icon: User, href: '/dashboard/settings' },
]

const driverTabs: NavTab[] = [
  { id: 'requests', label: 'Requests', icon: Car, href: '/driver' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/driver/earnings' },
  { id: 'updates', label: 'Updates', icon: Bell, href: '/updates' },
  { id: 'profile', label: 'Profile', icon: User, href: '/driver/settings' },
]

export function GlobalAuthenticatedNav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/updates/unread-count')
        .then(res => res.json())
        .then(data => {
          if (data.count !== undefined) setUnreadCount(data.count)
        })
        .catch(err => console.error(err))
    }
  }, [status, session?.user, pathname])


  if (status !== 'authenticated' || !session?.user) return null

  // Don't show on admin or auth pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth') || pathname.startsWith('/apply')) {
    return null
  }

  // Don't show on landing page
  if (pathname === '/') return null

  const isDriver = session.user.role === 'DRIVER'
  const tabs = isDriver ? driverTabs : riderTabs

  return (
    <div className="w-full flex flex-col items-center pt-4 pb-2 px-4 sm:pt-6 sm:pb-4 pointer-events-none sticky top-0 z-40 bg-gradient-to-b from-background to-transparent">
      {/* Slim Top Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 pointer-events-auto">
        <Link
          id="guide-nav-logo"
          href="/"
          className="text-lg sm:text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80"
          style={{ letterSpacing: '-0.02em' }}
        >
          <span className="text-foreground">TOVE</span>
          <span className="text-orange-brand">DROP</span>
        </Link>
        <div className="flex items-center gap-3 pointer-events-auto">
          <ThemeToggle />
          <Link id="guide-nav-profile" href={isDriver ? '/driver/settings' : '/dashboard/settings'} className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-orange-brand/50 transition-colors">
            <User className="w-4 h-4 text-muted-foreground" />
          </Link>
          <SignOutButton
            variant="outline"
            className="text-xs border-border bg-transparent hover:bg-card rounded-md px-3 py-1.5 !text-muted-foreground h-8"
          />
        </div>
      </div>

      {/* Orbital Nav replaces FluidNav */}
      <div className="pointer-events-auto">
        <OrbitalNav tabs={tabs} unreadCount={unreadCount} />
      </div>
    </div>
  )
}
