"use client"

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SignOutButton({ variant = "outline", className = "" }: { variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", className?: string }) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <Button 
        variant={variant} 
        className={className} 
        onClick={() => setShowConfirm(true)}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-5 mx-auto">
              <LogOut className="w-7 h-7 text-red-500 ml-1" />
            </div>
            
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Sign out of Tovedrop?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              You will need to log in again to book your next ride.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                className="w-full font-bold py-6 rounded-xl"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Yes, Sign out
              </Button>
              <Button 
                variant="outline" 
                className="w-full font-bold py-6 rounded-xl"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
