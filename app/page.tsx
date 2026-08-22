"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function WelcomeScreen() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-between p-6 overflow-hidden bg-bg-deep">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_60%)] rounded-full blur-2xl" />
      </div>

      {/* Top spacing */}
      <div className="flex-1" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center text-center">
        {/* Logo */}
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 flex items-center gap-3">
          <span className="text-3xl">🟠</span> 
          TOVEDROP 
          <span className="text-3xl">🟠</span>
        </h1>

        {/* Tagline */}
        <p className="text-[18px] text-white/90 leading-snug mb-16 font-medium">
          Campus rides.<br />
          Paid in Drops.
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-4">
          <Button asChild size="lg" className="w-full h-[60px] text-[14px]">
            <Link href="/login" aria-label="Login to book a ride">
              Book a Ride - Login
            </Link>
          </Button>

          <Button asChild variant="link" className="w-full">
            <Link href="/signup" aria-label="Sign up for a new account">
              Sign up instead
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom spacing / Footer */}
      <div className="flex-1 flex flex-col justify-end w-full pb-6 z-10 text-center">
        <p className="text-[11px] text-text-secondary flex items-center justify-center gap-1">
          Already have an account? 
          <Link href="/login" className="text-primary hover:underline text-[11px]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
