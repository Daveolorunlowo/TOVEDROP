'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Car, DollarSign, FileText, ShieldAlert, Menu, X, MessageSquare, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SignOutButton } from '@/components/sign-out-button'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { id: 'riders', label: 'Riders', icon: Users, href: '/admin/riders' },
  { id: 'drivers', label: 'Drivers', icon: Car, href: '/admin/drivers' },
  { id: 'finances', label: 'Finances & Payouts', icon: DollarSign, href: '/admin/finances' },
  { id: 'reports', label: 'Reports', icon: FileText, href: '/admin/reports' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/admin/feedback' },
  { id: 'security', label: 'Security', icon: ShieldAlert, href: '/admin/security' },
]

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentNav = navItems.find(item => item.href === pathname || (pathname.startsWith(item.href) && item.href !== '/admin'))

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/admin" className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          TOVE<span style={{ color: 'var(--orange-brand)' }}>DROP</span>
        </Link>
        <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          Admin
        </p>
      </div>

      {/* Nav items */}
      <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')
          const Icon = item.icon
          
          return (
            <Link key={item.id} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs font-medium transition-colors"
                style={{
                  background: active ? '#1a1a1a' : 'transparent',
                  color: active ? 'var(--orange-brand)' : '#555',
                  borderRadius: '6px',
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <SignOutButton 
          variant="ghost" 
          className="w-full justify-start text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] transition-colors gap-2.5 px-3 py-2 rounded-md" 
        >
        </SignOutButton>
      </div>
    </>
  )

  if (!mounted) return <div className="flex min-h-screen bg-background text-foreground" /> // Avoid hydration mismatch

  return (
    <div className="flex min-h-screen bg-background text-foreground w-full">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col lg:static lg:z-auto transition-transform duration-200 bg-card shadow-sm h-screen shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ width: '210px', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-5 h-12 shrink-0 bg-card border-b border-border shadow-sm"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: '0' }}
        >
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{ color: 'var(--muted-foreground)' }}>
            <Menu className="w-4 h-4" />
          </button>
          <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            {currentNav?.label ?? 'Admin Panel'}
          </p>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
