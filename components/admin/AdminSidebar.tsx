'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, Car, DollarSign, FileText, ShieldAlert, LogOut, Menu, X, MessageSquare } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { id: 'riders', label: 'Riders', icon: Users, href: '/admin/riders' },
  { id: 'drivers', label: 'Drivers', icon: Car, href: '/admin/drivers' },
  { id: 'finances', label: 'Finances & Payouts', icon: DollarSign, href: '/admin/finances' },
  { id: 'reports', label: 'Reports', icon: FileText, href: '/admin/reports' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/admin/feedback' },
  { id: 'security', label: 'Security', icon: ShieldAlert, href: '/admin/security' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-orange-brand tracking-tight">TOVEDROP</h2>
          <p className="text-[10px] font-medium text-muted-foreground mt-1">Admin Portal</p>
        </div>
        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')
          const Icon = item.icon
          
          return (
            <Link key={item.id} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden ${
                isActive 
                  ? 'text-white' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50'
              }`}>
                {isActive && (
                  <motion.div 
                    layoutId="admin-sidebar-active"
                    className="absolute inset-0 bg-surface-elevated rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-orange-brand' : 'group-hover:text-foreground'}`} />
                <span className="font-medium text-sm relative z-10">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border-default/50">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface-elevated/50">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Exit Admin</span>
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border-default z-40 flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-orange-brand">Admin Portal</h2>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border-default bg-surface-card sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[280px] h-full bg-surface-card border-r border-border-default flex flex-col relative shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        </div>
      )}
    </>
  )
}
