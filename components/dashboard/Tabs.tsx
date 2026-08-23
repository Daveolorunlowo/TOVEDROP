'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Car, History } from 'lucide-react'

export function DashboardTabs({
  tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trips', label: 'My Trips', icon: Car },
    { id: 'history', label: 'Drops & History', icon: History },
  ],
  storageKey = 'tovedrop_rider_tab',
  defaultTab = 'overview'
}: {
  tabs?: { id: string, label: string, icon?: any }[],
  storageKey?: string,
  defaultTab?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || defaultTab
  
  const [mounted, setMounted] = useState(false)

  // Restore last visited tab from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedTab = localStorage.getItem(storageKey)
    const urlTab = searchParams.get('tab')
    
    if (!urlTab && savedTab && savedTab !== defaultTab) {
      router.replace(`${window.location.pathname}?tab=${savedTab}`, { scroll: false })
    }
  }, [searchParams, router, storageKey, defaultTab])

  const setTab = (tab: string) => {
    localStorage.setItem(storageKey, tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('page') // Reset pagination on tab change
    params.delete('subtab')
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false })
  }

  // Prevent hydration mismatch by not rendering the active state until mounted
  if (!mounted) {
    return (
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 border-b border-border pb-px">
        {/* Skeleton layout matching tabs */}
        <div className="h-10 w-24 bg-muted/50 rounded-t-lg animate-pulse" />
        <div className="h-10 w-24 bg-muted/50 rounded-t-lg animate-pulse" />
        <div className="h-10 w-32 bg-muted/50 rounded-t-lg animate-pulse" />
      </div>
    )
  }



  return (
    <div id="guide-dash-tabs" className="flex overflow-x-auto hide-scrollbar gap-6 mb-6 border-b border-border">
      {tabs.map(tab => {
        const isActive = currentTab === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            id={`guide-tab-${tab.id}`}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap text-sm font-medium ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
