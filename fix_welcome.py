content = '''"use client"

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
 animation: \ounce 0.6s ease \s infinite alternate\,
 }}
 >
 <DropCoin size={28} />
 </div>
 ))}
 </div>
 <h1 className="text-3xl font-extrabold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
 Welcome to TOVEDROP
 </h1>
 <p className="text-purple-brand font-bold text-lg mb-4">
 Welcome aboard!
 </p>
 <p className="text-foreground/50 text-sm leading-relaxed mb-8">Get moving around campus instantly.<br />No card needed - just buy Drops and go.</p>
 
 <Link
 href="/dashboard"
 className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-purple-brand text-foreground font-bold text-sm transition-all hover:scale-[1.02] hover:bg-purple-light"
 >
 Book Your First Ride
 </Link>
 </div>
 <style>{\@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }\}</style>
 </div>
 )
}
'''
with open('app/welcome/page.tsx', 'wb') as f:
    f.write(content.encode('utf-8'))
