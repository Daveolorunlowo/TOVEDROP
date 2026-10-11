import React from 'react'
import { cn } from '@/lib/utils'

export interface OrganicBlobBackgroundProps {
  children?: React.ReactNode
  /** Accent or secondary color for the wireframe rings */
  color?: string
  /** Base opacity percentage (default: 0.9) */
  opacity?: number
  /** Additional container styling */
  className?: string
  /** Whether the rings gently rotate (default: true) */
  animated?: boolean
}

/**
 * OrganicBlobBackground (Minimalist Precision Rings):
 * Renders clean, high-precision concentric 1px circular wireframe rings in the top-right
 * and bottom-left corners with zero blur, subtle dashed accents, and cardinal ticks.
 */
export function OrganicBlobBackground({
  children,
  color = 'var(--orange-brand)',
  opacity = 0.9,
  className,
  animated = true,
}: OrganicBlobBackgroundProps) {
  const bgLayers = (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* ── Top-Right Minimalist Precision Wireframe Rings ── */}
      <div
        className={cn(
          "absolute -top-[12%] -right-[10%] sm:-top-[8%] sm:-right-[6%] w-[50vw] min-w-[340px] max-w-[620px] aspect-square transition-transform duration-1000",
          animated ? "animate-spin-slow" : ""
        )}
        style={{ opacity }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
        >
          {/* Cardinal & diagonal crosshair grid lines */}
          <line
            x1="300"
            y1="40"
            x2="300"
            y2="560"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.22"
            strokeDasharray="4 6"
          />
          <line
            x1="40"
            y1="300"
            x2="560"
            y2="300"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.22"
            strokeDasharray="4 6"
          />

          {/* Concentric 1px wireframe rings */}
          {/* Center core */}
          <circle cx="300" cy="300" r="3.5" fill="#F97316" fillOpacity="0.75" />
          <circle
            cx="300"
            cy="300"
            r="26"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Ring 1 - Solid 70px */}
          <circle
            cx="300"
            cy="300"
            r="70"
            fill="none"
            stroke="#FB923C"
            strokeWidth="1"
            strokeOpacity="0.32"
          />

          {/* Ring 2 - Solid 135px */}
          <circle
            cx="300"
            cy="300"
            r="135"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.28"
          />

          {/* Ring 3 - Dashed precision radar ring 205px */}
          <circle
            cx="300"
            cy="300"
            r="205"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.38"
            strokeDasharray="5 7"
          />

          {/* Ring 4 - Solid 275px */}
          <circle
            cx="300"
            cy="300"
            r="275"
            fill="none"
            stroke="#FB923C"
            strokeWidth="1"
            strokeOpacity="0.22"
          />

          {/* Ring 5 - Fine dashed boundary ring 355px */}
          <circle
            cx="300"
            cy="300"
            r="355"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.24"
            strokeDasharray="3 9"
          />

          {/* Ring 6 - Outer subtle perimeter 440px */}
          <circle
            cx="300"
            cy="300"
            r="440"
            fill="none"
            stroke="#EA580C"
            strokeWidth="1"
            strokeOpacity="0.15"
          />

          {/* High-tech curved accent arcs */}
          <path
            d="M 300 95 A 205 205 0 0 1 445 155"
            stroke="#F97316"
            strokeWidth="2"
            strokeOpacity="0.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 155 445 A 205 205 0 0 1 95 300"
            stroke="#FB923C"
            strokeWidth="2"
            strokeOpacity="0.45"
            fill="none"
            strokeLinecap="round"
          />

          {/* Precision cardinal coordinate node dots */}
          <circle cx="505" cy="300" r="3" fill="#F97316" fillOpacity="0.65" />
          <circle cx="300" cy="95" r="3" fill="#FB923C" fillOpacity="0.65" />
          <circle cx="95" cy="300" r="3" fill="#F97316" fillOpacity="0.65" />
          <circle cx="300" cy="505" r="3" fill="#FB923C" fillOpacity="0.65" />

          {/* 45° diagonal anchor ticks */}
          <circle cx="445" cy="155" r="2.5" fill="#F97316" fillOpacity="0.5" />
          <circle cx="155" cy="445" r="2.5" fill="#FB923C" fillOpacity="0.5" />
          <circle cx="155" cy="155" r="2.5" fill="#F97316" fillOpacity="0.35" />
          <circle cx="445" cy="445" r="2.5" fill="#FB923C" fillOpacity="0.35" />
        </svg>
      </div>

      {/* ── Bottom-Left Minimalist Precision Wireframe Rings ── */}
      <div
        className={cn(
          "absolute -bottom-[14%] -left-[10%] sm:-bottom-[10%] sm:-left-[6%] w-[52vw] min-w-[360px] max-w-[640px] aspect-square transition-transform duration-1000",
          animated ? "animate-spin-reverse-slow" : ""
        )}
        style={{ opacity }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
        >
          {/* Diagonal 45-degree guideline axes */}
          <line
            x1="80"
            y1="80"
            x2="520"
            y2="520"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="4 6"
          />
          <line
            x1="80"
            y1="520"
            x2="520"
            y2="80"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="4 6"
          />

          {/* Concentric 1px wireframe rings */}
          {/* Center core */}
          <circle cx="300" cy="300" r="3.5" fill="#EA580C" fillOpacity="0.75" />
          <circle
            cx="300"
            cy="300"
            r="35"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Ring 1 - Solid 90px */}
          <circle
            cx="300"
            cy="300"
            r="90"
            fill="none"
            stroke="#FB923C"
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* Ring 2 - Dashed 160px */}
          <circle
            cx="300"
            cy="300"
            r="160"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="6 6"
          />

          {/* Ring 3 - Solid 235px */}
          <circle
            cx="300"
            cy="300"
            r="235"
            fill="none"
            stroke="#EA580C"
            strokeWidth="1"
            strokeOpacity="0.22"
          />

          {/* Ring 4 - Fine dashed 320px */}
          <circle
            cx="300"
            cy="300"
            r="320"
            fill="none"
            stroke="#FB923C"
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeDasharray="4 8"
          />

          {/* Ring 5 - Outer perimeter 425px */}
          <circle
            cx="300"
            cy="300"
            r="425"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity="0.14"
          />

          {/* Precision accent arcs */}
          <path
            d="M 300 140 A 160 160 0 0 1 460 300"
            stroke="#EA580C"
            strokeWidth="2"
            strokeOpacity="0.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 300 460 A 160 160 0 0 1 140 300"
            stroke="#F97316"
            strokeWidth="2"
            strokeOpacity="0.45"
            fill="none"
            strokeLinecap="round"
          />

          {/* Precision node dots */}
          <circle cx="300" cy="140" r="3" fill="#EA580C" fillOpacity="0.65" />
          <circle cx="460" cy="300" r="3" fill="#EA580C" fillOpacity="0.65" />
          <circle cx="300" cy="460" r="3" fill="#F97316" fillOpacity="0.65" />
          <circle cx="140" cy="300" r="3" fill="#F97316" fillOpacity="0.65" />
        </svg>
      </div>
    </div>
  )

  if (!children) {
    return bgLayers
  }

  return (
    <div className={cn("relative w-full min-h-screen overflow-x-hidden", className)}>
      {bgLayers}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  )
}

