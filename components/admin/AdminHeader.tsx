'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useState } from 'react'

export function AdminHeader({ adminName }: { adminName: string }) {
  const initials = adminName.slice(0, 2).toUpperCase()
  const [notifications, setNotifications] = useState(3)

  return (
    <header className="h-20 shrink-0 border-b border-border-default bg-surface-card/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      
      {/* Mobile Menu Toggle (future proofing) */}
      <div className="md:hidden flex items-center gap-4">
        <button className="text-foreground p-2 rounded-xl hover:bg-surface-elevated">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Global Search */}
      <div className="hidden md:flex flex-1 max-w-md relative group">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-brand transition-colors" />
        <input 
          type="text" 
          placeholder="Search riders, drivers, or transactions..." 
          className="w-full bg-surface-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-brand focus:ring-1 focus:ring-orange-brand transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-border-subtle hover:border-orange-brand/30 transition-colors">
          <Bell className="w-4 h-4 text-foreground" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-brand rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-surface-card animate-in zoom-in">
              {notifications}
            </span>
          )}
        </button>
        
        <div className="h-8 w-px bg-border-default mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground leading-none">{adminName}</p>
            <p className="text-[10px] uppercase tracking-widest text-orange-brand font-semibold mt-1">Super Admin</p>
          </div>
          <Avatar className="w-10 h-10 border-2 border-orange-brand/20 p-0.5 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
            <div className="w-full h-full bg-surface-elevated rounded-full flex items-center justify-center">
              <AvatarFallback className="text-xs font-bold bg-transparent text-foreground">
                {initials}
              </AvatarFallback>
            </div>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
