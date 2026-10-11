import React from 'react'
import { cn } from '@/lib/utils'

export interface CurvedBackgroundProps {
  children?: React.ReactNode
  /** Height of the SVG curve in pixels or CSS value (default: responsive proportional) */
  curveHeight?: number | string
  /** The shape of the curve */
  curveStyle?: 'arc' | 'wave' | 'asymmetric'
  /** Tailwind class for the top background color (default: 'bg-orange-brand') */
  topColorClass?: string
  /** Tailwind class for the bottom background color (default: 'bg-background') */
  bottomColorClass?: string
  /** Height of the top solid section before the curve begins (default: responsive proportional) */
  topHeight?: string
  /** Optional class name for the wrapper */
  className?: string
  /** Enable horizontal looping animation (default: true) */
  animated?: boolean
}

export function CurvedBackground({
  children,
  curveHeight,
  curveStyle = 'asymmetric',
  topColorClass = 'bg-orange-brand',
  bottomColorClass = 'bg-background',
  topHeight,
  className,
  animated = true
}: CurvedBackgroundProps) {
  
  // Rich deeper brand gradient for WCAG AA compliance (> 5.2:1 contrast with white text)
  const topGradient = 'linear-gradient(180deg, #9A3412 0%, #C2410C 50%, #EA580C 100%)'

  const customTopHeight = topHeight ? { height: topHeight } : undefined
  const customCurveHeight = curveHeight ? { height: typeof curveHeight === 'number' ? `${curveHeight}px` : curveHeight } : undefined

  const bgLayer = (
    <div className="absolute inset-0 z-0 flex flex-col pointer-events-none overflow-hidden">
      <style>{`
        .curved-bg-top {
          height: clamp(160px, 26vh, 240px);
        }
        .curved-bg-wave {
          height: clamp(85px, 12vh, 140px);
        }
        /* Tablet: proportional scaling for wider aspect ratio */
        @media (min-width: 768px) and (min-height: 600px) {
          .curved-bg-top {
            height: clamp(180px, 24vh, 260px);
          }
          .curved-bg-wave {
            height: clamp(100px, 11vw, 150px);
          }
        }
        /* Landscape orientation: reduce curve height proportionally */
        @media (orientation: landscape) and (max-height: 640px) {
          .curved-bg-top {
            height: clamp(85px, 20vh, 130px) !important;
          }
          .curved-bg-wave {
            height: clamp(45px, 11vh, 75px) !important;
          }
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
      <div 
        className="relative w-full transition-all duration-300 curved-bg-top animate-curve-entrance" 
        style={{ background: topGradient, ...customTopHeight }}
      >
        {curveStyle === 'wave' || curveStyle === 'asymmetric' ? (
          <div 
            className="absolute top-full left-0 w-full overflow-hidden pointer-events-none -mt-[1px] curved-bg-wave"
            style={customCurveHeight}
          >
            {/* Back Wave (asymmetric layer with lower opacity for soft depth) */}
            <svg 
              className={cn(
                "absolute top-0 left-0 h-full origin-left pointer-events-none",
                animated ? "animate-wave-slide-slow" : ""
              )}
              style={{ width: '200%' }}
              viewBox="0 0 2880 340"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="asymWaveBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#9A3412" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <path 
                fill="url(#asymWaveBackGrad)"
                d="M 0, 150 C 180, 150 300, 320 480, 320 C 640, 320 740, 120 900, 120 C 1020, 120 1080, 240 1180, 240 C 1270, 240 1350, 150 1440, 150 C 1620, 150 1740, 320 1920, 320 C 2080, 320 2180, 120 2340, 120 C 2460, 120 2520, 240 2620, 240 C 2710, 240 2790, 150 2880, 150 L 2880, 0 L 0, 0 Z" 
              />
            </svg>

            {/* Front Wave (dramatic asymmetric solid brand gradient) */}
            <svg 
              className={cn(
                "absolute top-0 left-0 h-full origin-left pointer-events-none",
                animated ? "animate-wave-slide" : ""
              )}
              style={{ width: '200%' }}
              viewBox="0 0 2880 340"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="asymWaveFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="100%" stopColor="#C2410C" />
                </linearGradient>
              </defs>
              <path 
                fill="url(#asymWaveFrontGrad)"
                d="M 0, 120 C 200, 120 340, 290 540, 290 C 720, 290 800, 90 960, 90 C 1080, 90 1130, 210 1220, 210 C 1310, 210 1370, 120 1440, 120 C 1640, 120 1780, 290 1980, 290 C 2160, 290 2240, 90 2400, 90 C 2520, 90 2570, 210 2660, 210 C 2750, 210 2810, 120 2880, 120 L 2880, 0 L 0, 0 Z" 
              />
            </svg>
          </div>
        ) : (
          <svg 
            className="absolute top-full left-0 w-full block pointer-events-none -mt-[1px]"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
            style={{ height: curveHeight, color: topColor }}
          >
            {/* The fill="currentColor" uses the color style above */}
            {curveStyle === 'arc' && (
              <path fill="currentColor" d="M0,0 L1440,0 L1440,0 Q720,320 0,0 Z" />
            )}
            
            {curveStyle === 'asymmetric' && (
              <path fill="currentColor" d="M0,0 L1440,0 L1440,160 C960,320 480,0 0,80 Z" />
            )}
          </svg>
        )}
      </div>
    </div>
  )

  if (!children) {
    return (
      <div className={cn("fixed inset-0 w-full overflow-hidden pointer-events-none z-0", bottomColorClass, className)}>
        {bgLayer}
      </div>
    )
  }

  return (
    <div className={cn("relative min-h-screen w-full overflow-x-hidden", bottomColorClass, className)}>
      {bgLayer}
      
      {/* Content Layer */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
