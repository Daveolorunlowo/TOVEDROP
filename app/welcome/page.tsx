"use client"

import Link from 'next/link'
import { WaveHeader } from '@/components/ui/wave-header'

function DropCoin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#FFFFFF" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="var(--orange-brand)" opacity="0.9" />
    </svg>
  )
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WaveHeader animated={true}>
        <div className="flex justify-center gap-3 sm:gap-4 mb-2 sm:mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white/20 border border-white/30 backdrop-blur-md shadow-lg"
              style={{
                animation: `bounce 0.6s ease ${i * 0.15}s infinite alternate`,
              }}
            >
              <DropCoin size={24} />
            </div>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 sm:mb-2" style={{ letterSpacing: '-0.02em' }}>
          Welcome to TOVEDROP
        </h1>
        <p className="text-white/90 font-medium text-sm sm:text-base">
          Your Campus Ride, Your Trusted Driver
        </p>
      </WaveHeader>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-6 sm:-mt-10 md:-mt-12 landscape:mt-4 relative z-20 pb-12">
        <div className="w-full max-w-md bg-surface-card rounded-2xl border border-border-default p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] text-center">
          <p className="text-orange-brand font-bold text-lg mb-2">
            Welcome aboard!
          </p>
          <p className="text-foreground/60 text-sm leading-relaxed mb-8">
            Get moving around campus instantly.<br />No card needed — just buy Drops and go.
          </p>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-orange-brand text-white font-bold text-sm transition-all hover:scale-[1.02] hover:bg-orange-dark shadow-md"
          >
            Book Your First Ride
          </Link>
        </div>
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }`}</style>
    </div>
  )
}
