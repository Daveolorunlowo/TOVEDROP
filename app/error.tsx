"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const HollowDropCoin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
    <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M5 15 L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { data: session } = useSession()

  useEffect(() => {
    console.error(error)
  }, [error])

  let dashboardPath = '/'
  if (session?.user) {
    if (session.user.role === 'ADMIN') dashboardPath = '/admin'
    else if (session.user.role === 'DRIVER') dashboardPath = '/driver'
    else dashboardPath = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        
        <div className="mb-6">
          <HollowDropCoin className="w-20 h-20 md:w-28 md:h-28 text-foreground/40 mx-auto" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tighter">
          Something went wrong
        </h1>

        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          An unexpected error occurred.
        </h2>
        
        <p className="text-sm md:text-base text-muted-foreground mb-10 max-w-[400px]">
          Try refreshing the page or navigating back home. Let's get you back on route.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-md text-foreground font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-colors"
          >
            Try Again
          </button>
          
          <Link 
            href={dashboardPath}
            className="w-full sm:w-auto px-6 py-3 rounded-md text-foreground font-semibold text-sm border border-border hover:bg-[#1a1a24] transition-colors"
          >
            {session?.user ? 'Go to Dashboard' : 'Back to Home'}
          </Link>
        </div>
      </div>

      <div className="w-full pb-6 flex justify-center">
        <p className="text-[10px] font-bold tracking-[0.1em] text-[#444] uppercase">
          Tovedrop
        </p>
      </div>
    </div>
  )
}
