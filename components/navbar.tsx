"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useDropsBalance } from '@/hooks/useDropsBalance'
import { useBookRideNavigation } from '@/hooks/useBookRideNavigation'

function initials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function DropCoin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--purple-brand)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
    </svg>
  )
}

const navLinks = [
  { href: '/dashboard', label: 'Book a Ride', isBookRide: true },
  { href: '/apply', label: 'Become a Driver' },
]

export function Navbar() {
  const handleBookRideClick = useBookRideNavigation()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { balance: dropsBalance, loading: dropsLoading } = useDropsBalance()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'border-b border-white/8 shadow-[0_2px_32px_rgba(0,0,0,0.4)]'
            : 'border-b border-transparent'
        )}
        style={scrolled ? { background: 'rgba(9,9,21,0.82)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } : { background: 'transparent' }}
        aria-label="Site header"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link href="/" className="shrink-0 select-none" style={{ letterSpacing: '-0.025em' }} aria-label="TOVEDROP home">
              <span className="text-foreground font-black" style={{ fontSize: '22px' }}>TOVE</span>
              <span className="text-orange-brand font-black" style={{ fontSize: '25px' }}>DROP</span>
            </Link>

            {/* Desktop center links */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={link.isBookRide ? handleBookRideClick : undefined}
                  className="text-[13.5px] font-medium text-foreground/60 hover:text-foreground transition-colors duration-200 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side: Drops + Auth */}
            <div className="hidden md:flex items-center gap-3">
              {mounted && status === 'authenticated' && session?.user && (
                <>
                  <Link href="/dashboard/buy-drops" className="group flex items-center gap-1.5 bg-surface-elevated border border-border-default hover:border-purple-brand/50 hover:bg-surface-elevated/80 rounded-full px-2.5 py-1.5 transition-all cursor-pointer" title="Buy more Drops">
                    <DropCoin className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                    {dropsLoading ? (
                      <div className="h-4 w-6 bg-border-default animate-pulse rounded" />
                    ) : (
                      <span className="text-[12px] font-bold text-primary tabular-nums">{dropsBalance ?? session.user.dropsBalance ?? 0}</span>
                    )}
                    <span className="text-[11px] text-purple-brand font-semibold mr-0.5">Drops</span>
                    <span className="text-[10px] font-black text-foreground bg-purple-brand rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      +
                    </span>
                  </Link>
                  <div className="relative shrink-0 ml-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                      >
                        {initials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {session.user.role === 'DRIVER' && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-status-success border-2 border-bg-deep"
                      >
                        <Check className="w-2 h-2 text-foreground" />
                      </span>
                    )}
                  </div>
                </>
              )}
              {!mounted || status === 'loading' ? (
                <div className="w-24 h-9 animate-pulse bg-white/8 rounded-full" />
              ) : status === 'authenticated' ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-[13px] font-semibold text-foreground/65 hover:text-foreground border border-white/12 hover:border-white/35 px-5 py-2 rounded-full transition-all duration-200 hover:bg-white/5"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="text-[13px] font-semibold text-foreground/65 hover:text-foreground transition-colors duration-200 px-2"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth?tab=signup"
                    className="text-[13px] font-bold text-foreground px-5 py-2 rounded-full transition-all duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn('md:hidden fixed top-0 right-0 h-screen w-72 z-40 border-l border-white/8 transition-transform duration-300 ease-in-out', mobileOpen ? 'translate-x-0' : 'translate-x-full')}
        style={{ background: 'rgba(9,9,21,0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8">
          <Link href="/" onClick={() => setMobileOpen(false)} style={{ letterSpacing: '-0.025em' }}>
            <span className="text-foreground font-black text-xl">TOVE</span>
            <span className="text-orange-brand font-black" style={{ fontSize: '22px' }}>DROP</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-full text-foreground/50 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex flex-col p-5 gap-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={(e) => { 
                if (link.isBookRide) {
                  handleBookRideClick(e);
                }
                setMobileOpen(false);
              }} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/65 hover:text-foreground hover:bg-white/5 transition-all">
              {link.label}
            </Link>
          ))}
          {mounted && status === 'authenticated' && session?.user && (
            <Link href="/dashboard/buy-drops" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 mt-3 bg-surface-elevated border border-border-default rounded-xl hover:border-purple-brand/50 transition-colors">
              <div className="flex items-center gap-2">
                <DropCoin className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold text-primary">{session.user.dropsBalance || 0}</span>
                <span className="text-xs text-purple-brand font-semibold">Drops</span>
              </div>
              <span className="text-[10px] font-bold text-foreground bg-purple-brand px-2 py-1 rounded">Buy More +</span>
            </Link>
          )}
          <div className="flex flex-col gap-2 mt-5 pt-5 border-t border-white/8">
            {!mounted || status === 'loading' ? null : status === 'authenticated' ? (
              <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }) }} className="text-center text-sm font-semibold text-foreground/75 border border-white/12 px-4 py-2.5 rounded-xl hover:border-white/35 hover:bg-white/5 transition-all">Sign Out</button>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMobileOpen(false)} className="text-center text-sm font-semibold text-foreground border border-white/12 px-4 py-2.5 rounded-xl hover:border-white/35 hover:bg-white/5 transition-all">Log In</Link>
                <Link href="/auth?tab=signup" onClick={() => setMobileOpen(false)} className="text-center text-sm font-bold text-foreground px-4 py-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-background/60 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
    </>
  )
}