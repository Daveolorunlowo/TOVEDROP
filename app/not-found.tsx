import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

const WeirdDrop = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <circle cx="10" cy="10" r="2" fill="currentColor" className="animate-pulse" />
    {/* Weird eye elements */}
    <circle cx="8" cy="8" r="0.5" fill="currentColor" />
    <circle cx="12" cy="8" r="0.5" fill="currentColor" />
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
    <div className="min-h-screen bg-[#050505] overflow-hidden flex flex-col items-center justify-center p-6 text-center relative selection:bg-purple-900 selection:text-white">
      {/* Weird ambient background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700/50 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-600/50 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600/50 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="z-10 flex-1 flex flex-col items-center justify-center w-full max-w-2xl pt-10">
        
        {/* Glitching 404 */}
        <div className="relative group">
          <h1 className="text-[8rem] md:text-[12rem] lg:text-[15rem] font-black text-white/90 tracking-tighter leading-none select-none relative" 
              style={{
                textShadow: '0 0 30px rgba(168, 85, 247, 0.4)'
              }}>
            4<WeirdDrop className="inline-block w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 mx-2 text-[var(--orange-brand)] animate-spin-slow" />4
          </h1>
          {/* Glitch layers */}
          <h1 className="absolute top-0 left-0 -translate-x-[3px] translate-y-[2px] text-[8rem] md:text-[12rem] lg:text-[15rem] font-black text-red-500 tracking-tighter leading-none select-none mix-blend-screen animate-glitch-1 opacity-70 pointer-events-none">
            4<WeirdDrop className="inline-block w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 mx-2 opacity-0" />4
          </h1>
          <h1 className="absolute top-0 left-0 translate-x-[3px] -translate-y-[2px] text-[8rem] md:text-[12rem] lg:text-[15rem] font-black text-blue-500 tracking-tighter leading-none select-none mix-blend-screen animate-glitch-2 opacity-70 pointer-events-none">
            4<WeirdDrop className="inline-block w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 mx-2 opacity-0" />4
          </h1>
        </div>

        <div className="mt-4 md:mt-12 relative z-20">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-4 uppercase tracking-[0.3em] animate-pulse">
            <span className="text-[var(--purple-brand)]">Void</span> Discovered
          </h2>
          
          <p className="text-sm md:text-lg text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Your signal was lost in the algorithmic abyss. The coordinates you provided lead to a sector where drops fall upwards and drivers drive backwards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/"
              className="relative px-8 py-4 rounded-full text-white font-bold text-sm bg-transparent overflow-hidden group border border-purple-500/30 hover:border-purple-500 transition-colors backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-purple-600/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10">Abort Mission (Home)</span>
            </Link>
            
            <Link 
              href={dashboardPath}
              className="relative px-8 py-4 rounded-full text-black font-bold text-sm bg-white overflow-hidden group hover:scale-105 transition-transform duration-300 ease-out shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              <span className="relative z-10">{session?.user ? 'Return to Dashboard' : 'Initiate Login'}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 w-full flex justify-center z-10 opacity-30 hover:opacity-100 transition-opacity duration-1000">
        <p className="text-[10px] font-bold tracking-[0.4em] text-white uppercase" style={{ textShadow: '0 0 10px white' }}>
          T O V E D R O P _ E R R O R _ X _ 4 0 4
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 6s;
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        @keyframes glitch-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-3px, 2px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -2px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-3px, -2px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(3px, 2px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-3px, 2px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(3px, -2px); }
        }
        @keyframes glitch-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(3px, -2px); }
          20% { clip-path: inset(30% 0 20% 0); transform: translate(-3px, 2px); }
          40% { clip-path: inset(70% 0 10% 0); transform: translate(3px, 3px); }
          60% { clip-path: inset(20% 0 50% 0); transform: translate(-3px, -3px); }
          80% { clip-path: inset(50% 0 30% 0); transform: translate(3px, -2px); }
          100% { clip-path: inset(5% 0 80% 0); transform: translate(-3px, 2px); }
        }
        .animate-glitch-1 {
          animation: glitch-1 3s infinite linear alternate-reverse;
        }
        .animate-glitch-2 {
          animation: glitch-2 2.5s infinite linear alternate-reverse;
        }
      `}</style>
    </div>
  )
}
