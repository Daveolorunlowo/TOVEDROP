"use client"

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SignOutButton({ variant = "outline", className = "" }: { variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", className?: string }) {
  return (
    <Button 
      variant={variant} 
      className={className} 
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  )
}
