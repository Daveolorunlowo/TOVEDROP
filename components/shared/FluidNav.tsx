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
  const blobContainerRef = useRef<HTMLDivElement>(null)
  const dropletsContainerRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)
  const activeTabIdRef = useRef<string | null>(null)
  
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  
  // Find active tab based on current pathname
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

  // The core extreme liquid animation logic
  useEffect(() => {
    if (!navRef.current || !blobContainerRef.current) return
    const blob = blobContainerRef.current
    const dropletsContainer = dropletsContainerRef.current
    
    const targetEl = navRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
    if (!targetEl) return

    const toX = targetEl.offsetLeft
    const tabWidth = targetEl.offsetWidth
    
    // If reduced motion or first mount, just snap immediately
    if (isReducedMotion || activeTabIdRef.current === null) {
      blob.style.transition = 'none'
      blob.style.transform = `translateX(${toX}px)`
      blob.style.width = `${tabWidth}px`
      activeTabIdRef.current = activeTabId
      return
    }

    // Only animate if the tab actually changed
    if (activeTabIdRef.current === activeTabId) return
    activeTabIdRef.current = activeTabId

    // Get current actual position of the blob (supports rapid mid-flight clicks)
    const currentRect = blob.getBoundingClientRect()
    const containerRect = navRef.current.getBoundingClientRect()
    const currentX = currentRect.left - containerRect.left
    const currentWidth = currentRect.width

    const fromX = currentX
    isAnimatingRef.current = true

    // PHASE 3: Spawn detached droplet
    if (dropletsContainer && !isReducedMotion) {
      const dropSize = 24
      const fromCenterX = fromX + (currentWidth / 2) - (dropSize / 2)
      const toCenterX = toX + (tabWidth / 2) - (dropSize / 2)

      const droplet = document.createElement('div')
      droplet.className = 'absolute top-[50%] mt-[-12px] rounded-full bg-[var(--purple-brand)] pointer-events-none origin-center z-10'
      droplet.style.height = `${dropSize}px`
      droplet.style.width = `${dropSize}px`
      droplet.style.transform = `translateX(${fromCenterX}px) scale(1)`
      droplet.style.opacity = '1'
      
      dropletsContainer.appendChild(droplet)
      
      // Cap droplets to prevent DOM bloat during extreme rapid clicking
      if (dropletsContainer.children.length > 3) {
        dropletsContainer.removeChild(dropletsContainer.firstChild!)
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          droplet.style.transition = 'transform 0.55s cubic-bezier(0.3, 0.9, 0.4, 1), opacity 0.55s ease-in'
          droplet.style.transform = `translateX(${toCenterX}px) scale(0.2)`
          droplet.style.opacity = '0'
        })
      })

      droplet.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'opacity' && droplet.parentNode) {
          droplet.parentNode.removeChild(droplet)
        }
      })
    }

    // PHASE 1: Stretch Bridge
    const minX = Math.min(fromX, toX)
    const maxX = Math.max(fromX + currentWidth, toX + tabWidth)
    const stretchedWidth = maxX - minX

    blob.style.transition = 'width 0.22s ease-out, transform 0.22s ease-out'
    blob.style.transform = `translateX(${minX}px)`
    blob.style.width = `${stretchedWidth}px`

    // PHASE 2: Snap with extreme overshoot
    setTimeout(() => {
      blob.style.transition = 'width 0.4s cubic-bezier(0.34, 1.76, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.76, 0.64, 1)'
      blob.style.transform = `translateX(${toX}px)`
      blob.style.width = `${tabWidth}px`
      
      setTimeout(() => {
        isAnimatingRef.current = false
      }, 400) // End of Phase 2
    }, 220) // End of Phase 1

  }, [activeTabId, isReducedMotion])
  
  // Handle window resizing (snaps blob back to place if it gets misaligned)
  useEffect(() => {
    const handleResize = () => {
      if (!navRef.current || !blobContainerRef.current || isAnimatingRef.current) return
      const targetEl = navRef.current.querySelector(`[data-tab-id="${activeTabIdRef.current}"]`) as HTMLElement
      if (targetEl) {
        blobContainerRef.current.style.transition = 'none'
        blobContainerRef.current.style.transform = `translateX(${targetEl.offsetLeft}px)`
        blobContainerRef.current.style.width = `${targetEl.offsetWidth}px`
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Magnetic Hover Pull
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, tabId: string) => {
    if (tabId === activeTabId || isReducedMotion || isAnimatingRef.current) return
    const hoverEl = e.currentTarget
    const activeEl = navRef.current?.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
    const blob = blobContainerRef.current
    
    if (!activeEl || !blob) return
    
    const pullAmount = activeEl.offsetWidth * 0.15
    blob.style.transition = 'width 0.3s ease, transform 0.3s ease'
    
    if (hoverEl.offsetLeft > activeEl.offsetLeft) {
      // Pull Right
      blob.style.width = `${activeEl.offsetWidth + pullAmount}px`
      blob.style.transform = `translateX(${activeEl.offsetLeft}px)`
    } else {
      // Pull Left
      blob.style.width = `${activeEl.offsetWidth + pullAmount}px`
      blob.style.transform = `translateX(${activeEl.offsetLeft - pullAmount}px)`
    }
  }

  const handleMouseLeave = () => {
    if (isReducedMotion || isAnimatingRef.current) return
    const activeEl = navRef.current?.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
    const blob = blobContainerRef.current
    if (!activeEl || !blob) return
    
    blob.style.transition = 'width 0.3s ease, transform 0.3s ease'
    blob.style.width = `${activeEl.offsetWidth}px`
    blob.style.transform = `translateX(${activeEl.offsetLeft}px)`
  }

  return (
    <div className="relative w-full sm:w-auto" ref={navRef}>
      {/* EXTREME Goo Filter Definition */}
      {!isReducedMotion && (
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="tovedrop-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -11" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </svg>
      )}

      {/* Main Container */}
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
          
          {/* Droplets Container (Spawned via JS) */}
          <div ref={dropletsContainerRef} className="absolute inset-0 z-10" />
          
          {/* Active Tab Blob Wrapper (handles position/width) */}
          <div 
            ref={blobContainerRef}
            className="absolute top-1 bottom-1 sm:top-1.5 sm:bottom-1.5 origin-left left-0 z-20"
            style={{ willChange: 'transform, width' }}
          >
            {/* Inner Blob (handles idle wobble) */}
            <div 
              className={cn(
                "w-full h-full rounded-full",
                isReducedMotion ? "bg-white/10" : "bg-[var(--purple-brand)] animate-idle-wobble"
              )} 
            />
          </div>

          {/* Parallel Flex Layout inside Goo Layer for perfect alignment of unread dots */}
          <div className="absolute inset-0 flex sm:inline-flex px-2 sm:px-1.5 items-center w-full justify-around sm:justify-start z-30">
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
        <nav className="relative z-40 flex sm:inline-flex w-full items-center justify-around sm:justify-start px-2 sm:px-1.5 py-2 sm:py-1.5">
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
                  <span className="absolute top-1 right-[25%] sm:top-1.5 sm:right-2 w-2 h-2 rounded-full bg-orange-brand" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* Mobile spacing */}
      <div className="h-[68px] sm:hidden w-full" aria-hidden="true" />
    </div>
  )
}
