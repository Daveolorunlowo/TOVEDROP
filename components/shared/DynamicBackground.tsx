"use client"

import { useEffect, useState } from 'react'

export function DynamicBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
      {/* ── DOT GRID PATTERN ── */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* ── LARGE GLOWING ORBS (ANIMATED) ── */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20 dark:opacity-10 animate-float-slow"
        style={{ background: 'var(--orange-brand)' }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.15] dark:opacity-[0.08] animate-float-delayed"
        style={{ background: 'var(--purple-brand)' }}
      />
      <div 
        className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-[0.12] dark:opacity-[0.05] animate-float-slower"
        style={{ background: 'var(--orange-dark)' }}
      />

      {/* ── TOP SVG CURVE ── */}
      <div className="absolute top-0 left-0 right-0 h-48 opacity-[0.04] dark:opacity-[0.02]">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full">
          <path fill="var(--foreground)" d="M0,128L60,149.3C120,171,240,213,360,202.7C480,192,600,128,720,122.7C840,117,960,171,1080,181.3C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
        </svg>
      </div>

      {/* ── BOTTOM SVG CURVE ── */}
      <div className="absolute bottom-0 left-0 right-0 h-64 opacity-[0.04] dark:opacity-[0.02] transform rotate-180">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full">
          <path fill="var(--foreground)" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,229.3C840,235,960,213,1080,192C1200,171,1320,149,1380,138.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>

      {/* ── EXTRA DECORATIVE CIRCLES ── */}
      <div className="absolute top-[20%] right-[15%] w-32 h-32 border border-orange-brand/20 dark:border-orange-brand/10 rounded-full" />
      <div className="absolute top-[22%] right-[18%] w-16 h-16 border border-purple-brand/20 dark:border-purple-brand/10 rounded-full" />
      <div className="absolute bottom-[25%] left-[10%] w-48 h-48 border border-orange-brand/10 dark:border-orange-brand/5 rounded-full" />
    </div>
  )
}
