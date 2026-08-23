'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavTab {
  id: string
  label: string
  icon: LucideIcon
  href: string
  hasNotification?: boolean
  matchPrefix?: boolean
}

interface OrbitalNavProps {
  tabs: NavTab[]
  unreadCount?: number
}

export function OrbitalNav({ tabs, unreadCount = 0 }: OrbitalNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Track current tab
  const activeTabIndex = tabs.findIndex(t => 
    t.matchPrefix ? pathname.startsWith(t.href) : pathname === t.href
  )
  const validActiveIndex = activeTabIndex >= 0 ? activeTabIndex : 0
  const activeTab = tabs[validActiveIndex]
  const ActiveIcon = activeTab.icon

  // Consolidate notifications
  const hasAnyNotification = unreadCount > 0 || tabs.some(t => t.hasNotification)

  useEffect(() => {
    setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Click outside & Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const firstNode = containerRef.current.querySelector('[data-node-index="0"]') as HTMLAnchorElement
      if (firstNode) firstNode.focus()
    }
  }, [isOpen])

  // Node position calculations
  const isMobile = windowWidth < 640
  const radius = isMobile ? 110 : 140
  
  // Mobile: 180 to 360 (semi-circle over top)
  // Desktop: 180 to 270 (quarter-circle top-left)
  const startAngle = 180
  const endAngle = isMobile ? 360 : 270
  const angleStep = (endAngle - startAngle) / (tabs.length - 1)

  return (
    <>
      {/* SR-Only Fallback Nav for Accessibility */}
      <nav className="sr-only" aria-label="Main Navigation">
        <ul>
          {tabs.map(tab => (
            <li key={`sr-${tab.id}`}>
              <Link href={tab.href}>{tab.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Backdrop for mobile */}
      <div 
        className={cn(
          "fixed inset-0 bg-[#0a0a0f]/40 z-40 transition-opacity sm:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      <div 
        ref={containerRef}
        className={cn(
          "fixed z-50",
          // Mobile: bottom center. Desktop: bottom right
          "bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2",
          "sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
        )}
      >
        {/* Orbital Guide Ring */}
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 border-dashed pointer-events-none transition-all duration-500",
            isOpen ? "opacity-100" : "opacity-0 scale-50"
          )}
          style={{ width: radius * 2, height: radius * 2 }}
        />

        {/* Orbit Nodes */}
        {tabs.map((tab, index) => {
          const angle = startAngle + (index * angleStep)
          const angleRad = (angle * Math.PI) / 180
          const x = radius * Math.cos(angleRad)
          const y = radius * Math.sin(angleRad)
          const isActive = index === validActiveIndex
          
          // Reverse stagger for closing
          const staggerDelay = isOpen ? index * 40 : (tabs.length - 1 - index) * 40

          return (
            <Link
              key={tab.id}
              id={`guide-nav-${tab.id}`}
              href={tab.href}
              data-node-index={index}
              onClick={() => setIsOpen(false)}
              className={cn(
                "absolute top-1/2 left-1/2 flex items-center justify-center w-12 h-12 -mt-6 -ml-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary bg-card border hover:bg-[#2a2a2a] transition-colors",
                isOpen ? "pointer-events-auto" : "pointer-events-none",
                isActive ? "border-primary shadow-[0_0_12px_rgba(34,197,94,0.3)]" : "border-border"
              )}
              style={{
                transform: isOpen ? `translate(${x}px, ${y}px) scale(1)` : `translate(0px, 0px) scale(0.3)`,
                opacity: isOpen ? 1 : 0,
                transition: isReducedMotion 
                  ? 'opacity 0.2s ease, transform 0s'
                  : `transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${staggerDelay}ms, opacity 0.4s ease ${staggerDelay}ms, border-color 0.2s ease, background-color 0.2s ease`,
              }}
              aria-label={`Go to ${tab.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon 
                className={cn("w-5 h-5", isActive ? "text-primary" : "text-foreground")} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              
              {/* Node Notification Badge */}
              {(tab.hasNotification || (tab.id === 'updates' && unreadCount > 0)) && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-[#1e1e1e]"></span>
                </span>
              )}
            </Link>
          )
        })}

        {/* The Hub */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative flex items-center justify-center w-[60px] h-[60px] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] z-10",
            "bg-primary shadow-[0_0_24px_rgba(34,197,94,0.4)]",
            "active:scale-95 transition-transform duration-300"
          )}
          style={{
            transform: isOpen ? 'rotate(135deg) scale(0.92)' : 'rotate(0deg) scale(1)',
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? (
            <div className="w-6 h-6 flex items-center justify-center text-foreground" style={{ transform: 'rotate(-135deg)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          ) : (
            <ActiveIcon className="w-6 h-6 text-foreground" strokeWidth={2.5} />
          )}

          {/* Hub Notification Badge (hidden when open) */}
          {!isOpen && hasAnyNotification && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-primary border-2 border-[#111] text-[9px] font-bold text-primary-foreground">
                {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : ''}
              </span>
            </span>
          )}
        </button>
      </div>
    </>
  )
}
