"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-deep/80 backdrop-blur-md border-t border-border-default pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            pathname === '/dashboard' ? "text-primary" : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link 
          href="/dashboard/history" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            pathname === '/dashboard/history' ? "text-primary" : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">History</span>
        </Link>
      </div>
    </div>
  )
}
