'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Route, Wallet, User } from 'lucide-react'

export function DriverTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'requests'
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTab = localStorage.getItem('tovedrop_driver_tab')
    const urlTab = searchParams.get('tab')
    
    if (!urlTab && savedTab && savedTab !== 'requests') {
      router.replace(`${window.location.pathname}?tab=${savedTab}`, { scroll: false })
    }
  }, [searchParams, router])

  const setTab = (tab: string) => {
    localStorage.setItem('tovedrop_driver_tab', tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('page') 
    params.delete('subtab')
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false })
  }

  if (!mounted) {
    return (
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 border-b border-border pb-px mt-6">
        <div className="h-10 w-24 bg-muted/50 rounded-t-lg animate-pulse" />
        <div className="h-10 w-24 bg-muted/50 rounded-t-lg animate-pulse" />
        <div className="h-10 w-24 bg-muted/50 rounded-t-lg animate-pulse" />
        <div className="h-10 w-24 bg-muted/50 rounded-t-lg animate-pulse" />
      </div>
    )
  }

  const tabs = [
    { id: 'requests', label: 'Requests', icon: LayoutDashboard },
    { id: 'trips', label: 'My Trips', icon: Route },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-6 mb-6 mt-6 border-b border-border">
      {tabs.map(tab => {
        const isActive = currentTab === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap text-sm font-medium ${
              isActive
                ? 'border-orange-brand text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
