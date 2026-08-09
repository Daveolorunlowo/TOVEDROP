"use client"

import Link from 'next/link'

function DropCoin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--purple-brand)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
    </svg>
  )
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-elevated border border-border-default"
              style={{
                animation: `bounce 0.6s ease ${i * 0.15}s infinite alternate`,
              }}
            >
              <DropCoin size={28} />
            </div>
          ))}
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
          Welcome to TOVEDROP
        </h1>
        <p className="text-purple-brand font-bold text-lg mb-4">
          You&apos;ve been gifted 3 FREE Drops to get started.
        </p>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Use them to book your first 3 rides.<br />
          No card needed — just open the app and go.
        </p>
        <div className="flex items-center justify-center gap-3 bg-surface-elevated border border-border-default rounded-2xl px-6 py-4 mb-8">
          <DropCoin size={32} />
          <span className="text-4xl font-extrabold text-text-primary">3</span>
          <div className="text-left ml-1">
            <p className="text-text-primary font-bold text-sm">Drops gifted</p>
            <p className="text-[11px] text-purple-brand font-semibold uppercase tracking-[0.05em] mt-0.5">= 3 free bookings</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-purple-brand text-white font-bold text-sm transition-all hover:scale-[1.02] hover:bg-purple-light"
        >
          Book Your First Ride
        </Link>
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }`}</style>
    </div>
  )
}
