'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Car, Wallet, User, MapPin, Gift, Search, Bell } from 'lucide-react'
import { NavTab, OrbitalNav } from '@/components/shared/OrbitalNav'
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
    <OrbitalNav tabs={tabs} unreadCount={unreadCount} />
  )
}
