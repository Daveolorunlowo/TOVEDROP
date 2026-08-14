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
  
  // State for the active blob geometry
  const [blobStyle, setBlobStyle] = useState({ left: 0, width: 0, opacity: 0 })
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [hoveredTab, setHoveredTab] = useState<{ id: string; left: number; width: number } | null>(null)
  
  // Find active tab
  const activeTabId = tabs.find(t => 
    t.matchPrefix ? pathname.startsWith(t.href) : pathname === t.href
  )?.id || tabs[0].id

  useEffect(() => {
    setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Update blob position on mount, window resize, and pathname change
  useEffect(() => {
    const updatePosition = () => {
      if (!navRef.current) return
      const activeEl = navRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
      if (activeEl) {
        setBlobStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        })
      }
    }
    
    updatePosition()
    window.addEventListener('resize', updatePosition)
    const timer = setTimeout(updatePosition, 50)
    
    return () => {
      window.removeEventListener('resize', updatePosition)
      clearTimeout(timer)
    }
  }, [activeTabId, tabs, pathname]) // Re-run on pathname change to ensure layout shifts are caught

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, tabId: string) => {
    if (tabId === activeTabId || isReducedMotion) return
    const el = e.currentTarget
    setHoveredTab({
      id: tabId,
      left: el.offsetLeft + el.offsetWidth / 2 - 16, // Center a small 32px blob
      width: 32,
    })
  }

  const handleMouseLeave = () => {
    setHoveredTab(null)
  }

  return (
    <div className="relative w-full sm:w-auto" ref={navRef}>
      {/* SVG Filter Definition */}
      {!isReducedMotion && (
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="tovedrop-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </svg>
      )}

      {/* 
        Container wrapping BOTH the goo layer and label layer. 
        Mobile: Fixed to bottom edge, full width. 
        Desktop: Auto width pill, positioned normally. 
      */}
      <div className={cn(
        "z-50 bg-[#111111] sm:bg-[#1a1a1a] sm:rounded-full border-t sm:border border-[#222]",
        "fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:inline-flex",
        "pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 shadow-2xl sm:shadow-none"
      )}>
        
        {/* ======================= */}
        {/* LAYER 1: GOO BACKGROUND */}
        {/* ======================= */}
        <div 
          className="absolute inset-0 overflow-hidden sm:rounded-full pointer-events-none"
          style={!isReducedMotion ? { filter: 'url(#tovedrop-goo)' } : {}}
        >
          {/* Base Background Blob inside filter to merge with active blob */}
          <div className="absolute inset-0 bg-[#1a1a1a]" />
          
          {/* Active Tab Blob */}
          <div 
            className="absolute top-1 bottom-1 sm:top-1.5 sm:bottom-1.5 rounded-full origin-left left-0"
            style={{
              background: 'var(--purple-brand)',
              transform: `translateX(${blobStyle.left}px) translateZ(0)`,
              width: blobStyle.width,
              opacity: blobStyle.opacity,
              willChange: 'transform, width',
              // Different easing for transform vs width creates the liquid stretch
              transition: isReducedMotion 
                ? 'background-color 200ms ease' 
                : 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), width 550ms cubic-bezier(0.65, -0.4, 0.3, 1.4)'
            }}
          />

          {/* Hover Ripple Blobs */}
          {!isReducedMotion && hoveredTab && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full opacity-40 transition-all duration-300 pointer-events-none left-0"
              style={{
                background: 'var(--purple-light)',
                transform: `translateX(${hoveredTab.left}px) translateZ(0)`,
                width: hoveredTab.width,
                willChange: 'transform',
              }}
            />
          )}

          {/* Parallel Flex Layout inside Goo Layer for perfect alignment of unread dots */}
          <div className="absolute inset-0 flex sm:inline-flex px-2 sm:px-1.5 items-center w-full justify-around sm:justify-start">
            {tabs.map(tab => (
              <div 
                key={`goo-${tab.id}`} 
                className="relative flex-1 sm:flex-none flex items-center justify-center px-2 py-1.5 sm:px-5 sm:py-2 h-full"
              >
                {tab.hasNotification && tab.id !== activeTabId && !isReducedMotion && (
                  <div 
                    className="absolute top-2 right-[25%] sm:top-2 sm:right-3 w-3 h-3 rounded-full" 
                    style={{ 
                      background: 'var(--orange-brand)',
                      animation: 'blob-breathe 2s ease-in-out infinite' 
                    }} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ======================= */}
        {/* LAYER 2: FOREGROUND LABELS */}
        {/* ======================= */}
        <nav className="relative z-10 flex sm:inline-flex w-full items-center justify-around sm:justify-start px-2 sm:px-1.5 py-2 sm:py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id
            const Icon = tab.icon

            return (
              <Link
                key={tab.id}
                href={tab.href}
                data-tab-id={tab.id}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={(e) => handleMouseEnter(e, tab.id)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
                  "flex-1 sm:flex-none px-2 py-1.5 sm:px-5 sm:py-2 rounded-full",
                  "transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-brand",
                  isActive ? "text-white" : "text-[#888] hover:text-white"
                )}
              >
                <Icon 
                  className={cn("w-5 h-5 sm:w-4 sm:h-4 transition-all duration-300", isActive ? "scale-110" : "scale-100")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase mt-0.5 sm:mt-0",
                  isActive ? "opacity-100" : "opacity-80"
                )}>
                  {tab.label}
                </span>
                
                {/* Fallback Unread Dot (if reduced motion is on) */}
                {isReducedMotion && tab.hasNotification && !isActive && (
                  <span className="absolute top-1 right-[25%] sm:top-1.5 sm:right-2 w-2 h-2 rounded-full" style={{ background: 'var(--orange-brand)' }} />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* 
        On mobile, the fixed bottom bar might cover content. 
        Add an invisible spacer block so page content doesn't get hidden behind it. 
      */}
      <div className="h-[68px] sm:hidden w-full" aria-hidden="true" />
    </div>
  )
}
