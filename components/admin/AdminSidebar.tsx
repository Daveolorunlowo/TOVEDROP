'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Car, DollarSign, FileText, ShieldAlert, Menu, X, MessageSquare } from 'lucide-react'
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

  useEffect(() => { setMounted(true) }, [])

  const currentNav = navItems.find(item =>
    item.href === pathname || (pathname.startsWith(item.href) && item.href !== '/admin')
  )

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border">
        <Link href="/admin" className="text-sm font-bold tracking-tight text-foreground">
          TOVE<span className="text-primary">DROP</span>
        </Link>
        <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Navigation</p>
      </div>

      {/* Nav items */}
      <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')
          const Icon = item.icon
          return (
            <Link key={item.id} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-border hover:text-foreground'
              )}>
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <SignOutButton
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-border transition-colors gap-3 px-3 py-2.5 rounded-lg"
        />
      </div>
    </>
  )

  if (!mounted) return <div className="flex min-h-screen bg-background text-foreground" />

  return (
    <div className="flex min-h-screen bg-background text-foreground w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col lg:static lg:z-auto transition-transform duration-200 bg-card h-screen shrink-0 border-r border-border',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ width: '220px' }}>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-5 h-12 shrink-0 bg-card border-b border-border">
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-foreground">{currentNav?.label ?? 'Admin Panel'}</p>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
