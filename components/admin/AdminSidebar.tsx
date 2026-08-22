'use client'

import Link from 'next/link'
import { LayoutDashboard, Users, Car, TrendingUp, Flag, ShieldAlert, LogOut, Hexagon } from 'lucide-react'
import { signOut } from 'next-auth/react'

export function AdminSidebar({ activeTab }: { activeTab: string }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Riders', icon: Users },
    { id: 'drivers', label: 'Drivers', icon: Car },
    { id: 'finances', label: 'Finances', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'security', label: 'Security', icon: ShieldAlert },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-surface-card border-r border-border-default shrink-0 z-10 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-brand/5 to-transparent opacity-50 pointer-events-none" />
      
      <div className="flex items-center gap-3 p-6 border-b border-border-subtle relative">
        <div className="relative">
          <Hexagon className="w-8 h-8 text-orange-brand absolute -inset-1 blur-sm opacity-50 animate-pulse" />
          <Hexagon className="w-6 h-6 text-orange-brand relative z-10 fill-orange-brand/20" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground relative z-10">
          Admin <span className="text-orange-brand">HQ</span>
        </h1>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-4 px-2">Menu</p>
        
        {tabs.map((t) => {
          const isActive = activeTab === t.id
          const Icon = t.icon
          return (
            <Link
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative group ${
                isActive 
                  ? 'text-white font-bold bg-orange-brand/10 border border-orange-brand/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground font-medium border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-brand rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-orange-brand scale-110' : 'group-hover:scale-110 group-hover:text-foreground'}`} />
              <span className="relative z-10">{t.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle relative z-10">
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center justify-center gap-2 px-3 py-3 w-full rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold text-sm border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
