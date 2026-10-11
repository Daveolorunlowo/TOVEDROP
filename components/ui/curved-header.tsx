import React from 'react'
import { cn } from '@/lib/utils'

export interface CurvedHeaderProps {
  /** The children content inside the header (logo, title, illustration) */
  children?: React.ReactNode
  /** Height of the SVG curve in pixels (default: 80) */
  curveDepth?: number
  /** The shape of the curve */
  curveStyle?: 'arc' | 'wave' | 'asymmetric'
  /** Tailwind class or CSS variable for the top background color */
  topColorClass?: string
  /** Tailwind class for the bottom/rest background color */
  bottomColorClass?: string
  /** Height of the top solid section before the curve begins (default: '35vh') */
  height?: string
  /** Optional class name for the wrapper */
  className?: string
}

export function CurvedHeader({
  children,
  curveDepth = 80,
  curveStyle = 'arc',
  topColorClass = 'bg-orange-brand',
  bottomColorClass = 'bg-background',
  height = '35vh',
  className
}: CurvedHeaderProps) {
  
  // Use CSS variable to ensure reliable background color mapping
  const topColor = 'var(--orange-brand)'

  return (
    <header className={cn("relative w-full overflow-hidden", bottomColorClass, className)}>
      {/* Background layer for the header */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full">
        <div 
          className="relative w-full transition-colors duration-300" 
          style={{ height: height, backgroundColor: topColor }}
        >
          {/* Curve SVG */}
          <svg 
            className="absolute top-full left-0 w-full block pointer-events-none -mt-[1px]"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
            style={{ height: curveDepth, color: topColor }}
          >
            {curveStyle === 'arc' && (
              <path fill="currentColor" d="M0,0 L1440,0 L1440,0 Q720,320 0,0 Z" />
            )}
            
            {curveStyle === 'wave' && (
              <path fill="currentColor" d="M0,0 L1440,0 L1440,80 C1000,240 440,-80 0,80 Z" />
            )}
            
            {curveStyle === 'asymmetric' && (
              <path fill="currentColor" d="M0,0 L1440,0 L1440,160 C960,320 480,0 0,80 Z" />
            )}
          </svg>
        </div>
      </div>
      
      {/* Content Layer (Logo / Title / Illustration) inside the colored header */}
      <div 
        className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4"
        style={{ minHeight: `calc(${height} + ${curveDepth}px)` }}
      >
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto h-full" style={{ paddingBottom: curveDepth / 2 }}>
          {children}
        </div>
      </div>
    </header>
  )
}
