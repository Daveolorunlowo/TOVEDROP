'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, LayoutDashboard, Users, Car, TrendingUp, ShieldAlert, Banknote, Bell, MessageSquare, Flag, PieChart } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CommandPalette({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-lg rounded-xl overflow-hidden bg-card border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col bg-transparent w-full h-full text-foreground" label="Command Menu">
          <div className="flex items-center border-b border-white/10 px-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <Command.Input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none p-4 text-sm placeholder:text-gray-500" 
              placeholder="Type a command or search..." 
            />
            <div className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">ESC</div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-semibold text-gray-500 px-2 py-1.5 [&_[cmdk-group-items]]:mt-1">
              {[
                { id: 'overview',  label: 'Overview', icon: LayoutDashboard },
                { id: 'finances',  label: 'Finances', icon: TrendingUp },
                { id: 'revenue_split', label: 'Revenue Split', icon: PieChart },
                { id: 'approvals', label: 'Driver Approvals', icon: Car },
                { id: 'payouts',   label: 'Payouts', icon: Banknote },
                { id: 'updates',   label: 'Updates', icon: Bell },
                { id: 'users',     label: 'Users', icon: Users },
                { id: 'security',  label: 'Security', icon: ShieldAlert },
              ].map((item) => (
                <Command.Item
                  key={item.id}
                  onSelect={() => {
                    setActiveTab(item.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer aria-selected:bg-orange-brand/20 aria-selected:text-orange-brand transition-colors text-gray-300"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className="text-xs font-semibold text-gray-500 px-2 py-1.5 mt-2 [&_[cmdk-group-items]]:mt-1 border-t border-white/5">
              <Command.Item
                onSelect={() => {
                  router.push('/')
                  setOpen(false)
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer aria-selected:bg-white/10 transition-colors text-gray-300"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Main App
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
