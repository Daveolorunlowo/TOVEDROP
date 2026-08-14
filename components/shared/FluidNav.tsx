'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface NavTab {
  id: string
  label: string
  icon: LucideIcon
  href: string
  hasNotification?: boolean
  matchPrefix?: boolean
}

export function FluidNav({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname()
  
  const navRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Find active tab based on current pathname
  const activeTabId = tabs.find(t => 
    t.matchPrefix ? pathname.startsWith(t.href) : pathname === t.href
  )?.id || tabs[0].id

  useEffect(() => {
    setIsMounted(true)
    setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Position the highly performant sliding pill
  useEffect(() => {
    if (!isMounted || !navRef.current || !pillRef.current) return
    
    // Find the container and active tab elements
    const container = navRef.current
    const activeEl = container.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
    
    if (!activeEl) return
    
    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    
    const leftOffset = activeRect.left - containerRect.left
    const width = activeRect.width
    
    // Use hardware accelerated CSS transforms for 60fps mobile performance
    if (isReducedMotion) {
      pillRef.current.style.transition = 'none'
    } else {
      pillRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
    
    pillRef.current.style.width = `${width}px`
    pillRef.current.style.transform = `translateX(${leftOffset}px) translateZ(0)`
    
  }, [activeTabId, isMounted, isReducedMotion])

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (!navRef.current || !pillRef.current) return
      const activeEl = navRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
      if (activeEl) {
        const containerRect = navRef.current.getBoundingClientRect()
        const activeRect = activeEl.getBoundingClientRect()
        
        pillRef.current.style.transition = 'none'
        pillRef.current.style.width = `${activeRect.width}px`
        pillRef.current.style.transform = `translateX(${activeRect.left - containerRect.left}px) translateZ(0)`
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTabId])

  return (
    <div className="relative w-full sm:w-auto">
      {/* Outer Wrapper for fixed positioning and safe area */}
      <div className={cn(
        "z-50 bg-[#111111] sm:bg-transparent sm:rounded-none border-t sm:border-0 border-[#222]",
        "fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:inline-flex flex-col",
        "pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 shadow-2xl sm:shadow-none"
      )}>
        {/* INNER WRAPPER */}
        <div 
          ref={navRef}
          className="relative w-full sm:w-auto sm:bg-[#1a1a1a] sm:rounded-full sm:border border-[#222]"
        >
          {/* SLIDING PILL BACKGROUND (Hardware Accelerated) */}
          <div 
            ref={pillRef}
            className="absolute top-1 bottom-1 sm:top-1.5 sm:bottom-1.5 left-0 z-10 pointer-events-none"
            style={{ 
              opacity: isMounted ? 1 : 0,
              willChange: 'transform, width' 
            }}
          >
            <div className={cn(
              "w-full h-full rounded-full shadow-md",
              isReducedMotion ? "bg-white/10" : "bg-[var(--purple-brand)]"
            )} />
          </div>

          {/* FOREGROUND LABELS */}
          <nav className="relative z-20 flex sm:inline-flex w-full items-center justify-around sm:justify-start px-2 sm:px-1.5 py-2 sm:py-1.5">
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id
              const Icon = tab.icon

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  data-tab-id={tab.id}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
                    "flex-1 sm:flex-none px-2 py-1.5 sm:px-5 sm:py-2 rounded-full",
                    "transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-brand",
                    isActive ? "text-white" : "text-[#888] hover:text-white"
                  )}
                >
                  <Icon 
                    className={cn("w-5 h-5 sm:w-4 sm:h-4 transition-transform duration-300", isActive ? "scale-110" : "scale-100")} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase mt-0.5 sm:mt-0 transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-80"
                  )}>
                    {tab.label}
                  </span>
                  
                  {/* Notification Dot */}
                  {tab.hasNotification && (
                    <span 
                      className={cn(
                        "absolute top-1 right-[25%] sm:top-1.5 sm:right-2 w-2 h-2 rounded-full transition-colors duration-300",
                        isActive ? "bg-white" : "bg-orange-brand"
                      )} 
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      
      {/* Mobile spacing to push content above the fixed nav */}
      <div className="h-[calc(68px+env(safe-area-inset-bottom,0px))] sm:hidden w-full" aria-hidden="true" />
    </div>
  )
}
