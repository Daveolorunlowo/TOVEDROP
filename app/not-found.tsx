import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

const HollowDropCoin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
    <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M5 15 L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default async function NotFound() {
  const session = await getServerSession(authOptions)
  
  let dashboardPath = '/'
  if (session?.user) {
    if (session.user.role === 'ADMIN') dashboardPath = '/admin'
    else if (session.user.role === 'DRIVER') dashboardPath = '/driver'
    else dashboardPath = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        
        <h1 className="text-7xl md:text-9xl font-black text-white flex items-center justify-center gap-1 md:gap-3 mb-6 tracking-tighter">
          <span>4</span>
          <HollowDropCoin className="w-16 h-16 md:w-24 md:h-24 text-white/40" />
          <span>4</span>
        </h1>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
          This page took a wrong turn.
        </h2>
        
        <p className="text-sm md:text-base text-[#888] mb-10 max-w-[400px]">
          The page you're looking for doesn't exist or may have moved. Let's get you back on route.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-md text-white font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-colors"
          >
            Back to Home
          </Link>
          
          <Link 
            href={dashboardPath}
            className="w-full sm:w-auto px-6 py-3 rounded-md text-white font-semibold text-sm border border-[#333] hover:bg-[#1a1a24] transition-colors"
          >
            {session?.user ? 'Go to Dashboard' : 'Sign In'}
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
