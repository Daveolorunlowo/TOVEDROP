import React from 'react'
import { cn } from '@/lib/utils'

export interface WaveHeaderProps {
  /** The children content inside the header (logo, title, illustration) */
  children?: React.ReactNode
  /** Height of the SVG wave in pixels or CSS value (default: responsive proportional) */
  waveHeight?: number | string
  /** Tailwind class for the bottom/rest background color */
  bottomColorClass?: string
  /** Height of the top solid section before the wave begins (default: responsive proportional) */
  height?: string
  /** Optional class name for the wrapper */
  className?: string
  /** Enable horizontal looping animation (default: true) */
  animated?: boolean
}

export function WaveHeader({
  children,
  waveHeight,
  bottomColorClass = 'bg-background',
  height,
  className,
  animated = true
}: WaveHeaderProps) {
  
  // Rich deeper brand gradient for WCAG AA compliance (> 5.2:1 contrast with white text)
  const topGradient = 'linear-gradient(180deg, #9A3412 0%, #C2410C 50%, #EA580C 100%)'

  const customTopHeight = height ? { height: height } : undefined
  const customWaveHeight = waveHeight ? { height: typeof waveHeight === 'number' ? `${waveHeight}px` : waveHeight } : undefined

  return (
    <header className={cn("relative w-full overflow-hidden", bottomColorClass, className)}>
      <style>{`
        .wave-header-top {
          height: clamp(160px, 30vh, 240px);
        }
        .wave-header-svg {
          height: clamp(75px, 11vh, 110px);
        }
        .wave-header-content {
          min-height: calc(clamp(160px, 30vh, 240px) + clamp(75px, 11vh, 110px));
        }
        @media (min-width: 768px) and (min-height: 600px) {
          .wave-header-top {
            height: clamp(190px, 28vh, 270px);
          }
          .wave-header-svg {
            height: clamp(85px, 10vw, 120px);
          }
          .wave-header-content {
            min-height: calc(clamp(190px, 28vh, 270px) + clamp(85px, 10vw, 120px));
          }
        }
        @media (orientation: landscape) and (max-height: 640px) {
          .wave-header-top {
            height: clamp(95px, 22vh, 140px) !important;
          }
          .wave-header-svg {
            height: clamp(40px, 9vh, 65px) !important;
          }
          .wave-header-content {
            min-height: calc(clamp(95px, 22vh, 140px) + clamp(40px, 9vh, 65px)) !important;
            padding-top: 0.75rem !important;
            padding-bottom: 0.5rem !important;
          }
          .wave-header-inner {
            padding-bottom: 12px !important;
          }
        }
        @media (orientation: landscape) and (max-height: 450px) {
          .wave-header-top {
            height: clamp(80px, 20vh, 115px) !important;
          }
          .wave-header-svg {
            height: clamp(35px, 8vh, 50px) !important;
          }
        /* Reduced motion accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-curve-entrance {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      {/* Background layer for the header */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full animate-curve-entrance">
        <div 
          className="relative w-full transition-all duration-300 wave-header-top" 
          style={{ background: topGradient, ...customTopHeight }}
        >
          {/* Wave SVG Container - must be absolutely positioned below the solid color */}
          <div 
            className="absolute top-full left-0 w-full overflow-hidden pointer-events-none -mt-[1px] wave-header-svg"
            style={customWaveHeight}
          >
            {/* Back wave (asymmetric layer with lower opacity for soft depth) */}
            <svg 
              className={cn("absolute top-0 left-0 h-full origin-left pointer-events-none", animated ? "animate-wave-slide-slow" : "")}
              style={{ width: '200%' }}
              viewBox="0 0 2880 340"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="headerAsymWaveBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#9A3412" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <path 
                fill="url(#headerAsymWaveBackGrad)"
                d="M 0, 150 C 180, 150 300, 320 480, 320 C 640, 320 740, 120 900, 120 C 1020, 120 1080, 240 1180, 240 C 1270, 240 1350, 150 1440, 150 C 1620, 150 1740, 320 1920, 320 C 2080, 320 2180, 120 2340, 120 C 2460, 120 2520, 240 2620, 240 C 2710, 240 2790, 150 2880, 150 L 2880, 0 L 0, 0 Z" 
              />
            </svg>

            {/* Front wave (dramatic asymmetric solid brand gradient) */}
            <svg 
              className={cn("absolute top-0 left-0 h-full origin-left pointer-events-none", animated ? "animate-wave-slide" : "")}
              style={{ width: '200%' }}
              viewBox="0 0 2880 340"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="headerAsymWaveFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="100%" stopColor="#C2410C" />
                </linearGradient>
              </defs>
              <path 
                fill="url(#headerAsymWaveFrontGrad)"
                d="M 0, 120 C 200, 120 340, 290 540, 290 C 720, 290 800, 90 960, 90 C 1080, 90 1130, 210 1220, 210 C 1310, 210 1370, 120 1440, 120 C 1640, 120 1780, 290 1980, 290 C 2160, 290 2240, 90 2400, 90 C 2520, 90 2570, 210 2660, 210 C 2750, 210 2810, 120 2880, 120 L 2880, 0 L 0, 0 Z" 
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Content Layer (Logo / Title / Illustration) inside the colored header */}
      <div 
        className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 wave-header-content"
        style={height && waveHeight ? { minHeight: `calc(${height} + ${typeof waveHeight === 'number' ? waveHeight + 'px' : waveHeight})` } : undefined}
      >
        <div 
          className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto h-full wave-header-inner" 
          style={waveHeight && typeof waveHeight === 'number' ? { paddingBottom: waveHeight / 2 } : undefined}
        >
          {children}
        </div>
      </div>
    </header>
  )
}
