"use client";

import { useEffect, useState, useMemo } from "react";
import { useGuide } from "@/hooks/useGuide";
import { motion, AnimatePresence } from "framer-motion";
import { GuideElementType } from "@/lib/guide-steps";
import { MousePointerClick, Navigation, Square, TextCursor, Tag, Star, LayoutGrid } from "lucide-react";

const TYPE_META: Record<GuideElementType, { label: string; Icon: any; color: string }> = {
  BUTTON: { label: "Button", Icon: MousePointerClick, color: "text-orange-400" },
  CARD: { label: "Card", Icon: LayoutGrid, color: "text-purple-400" },
  INPUT: { label: "Input Field", Icon: TextCursor, color: "text-cyan-400" },
  NAVIGATION: { label: "Navigation", Icon: Navigation, color: "text-blue-400" },
  BADGE: { label: "Badge", Icon: Tag, color: "text-yellow-400" },
  ICON: { label: "Icon", Icon: Star, color: "text-purple-400" },
  INTERACTIVE: { label: "Interactive", Icon: MousePointerClick, color: "text-orange-400" },
};

export default function GuideEngine() {
  const { 
    activeGuide, 
    currentStepIndex, 
    isOpen, 
    currentTargetRect, 
    skipGuide, 
    nextStep, 
    prevStep, 
    interactionSatisfied,
    startGuide
  } = useGuide();

  const [mouseHover, setMouseHover] = useState(false);

  if (!isOpen || !activeGuide) {
    // Show the small floating ? button when not active
    return (
      <button 
        onClick={() => startGuide("welcome")} // Usually this would restart the current page's guide
        onMouseEnter={() => setMouseHover(true)}
        onMouseLeave={() => setMouseHover(false)}
        className="fixed bottom-6 left-6 z-[9000] w-10 h-10 rounded-full bg-deep border border-white/10 shadow-lg flex items-center justify-center text-white/50 hover:text-white hover:border-orange-brand/50 hover:bg-orange-brand/10 transition-all duration-300"
      >
        <span className="font-medium text-lg">?</span>
      </button>
    );
  }

  const step = activeGuide.steps[currentStepIndex];
  if (!step) return null;

  // Determine styling based on element type
  let padding = 12;
  let borderRadius = 8;
  let glowColor = "rgba(139, 92, 246, 0.5)"; // Purple default
  let glowSpread = "20px";

  switch (step.type) {
    case "BUTTON":
      borderRadius = 999;
      glowColor = "rgba(249, 115, 22, 0.6)"; // Orange "tap me"
      break;
    case "CARD":
      borderRadius = 12;
      padding = 16;
      glowColor = "rgba(139, 92, 246, 0.4)";
      break;
    case "INPUT":
      borderRadius = 8;
      padding = 8;
      glowColor = "rgba(6, 182, 212, 0.5)"; // Cyan "fill me in"
      break;
    case "NAVIGATION":
      borderRadius = step.targetSelector.includes("chip") ? 999 : 0;
      padding = 4;
      break;
    case "BADGE":
      borderRadius = 4;
      padding = 4;
      break;
    case "ICON":
      borderRadius = 999;
      padding = 8;
      glowSpread = "30px";
      break;
  }

  const isFullScreen = step.targetSelector === "body";
  
  // Calculate mask coords
  const mx = isFullScreen ? 0 : (currentTargetRect?.x || 0) - padding;
  const my = isFullScreen ? 0 : (currentTargetRect?.y || 0) - padding;
  const mwidth = isFullScreen ? 0 : (currentTargetRect?.width || 0) + padding * 2;
  const mheight = isFullScreen ? 0 : (currentTargetRect?.height || 0) + padding * 2;

  // Calculate card position (simplistic quadrant approach for now)
  const calculateCardPosition = () => {
    if (isFullScreen || !currentTargetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Try below
    if (currentTargetRect.bottom + 20 + 200 < viewportHeight) {
      return { top: currentTargetRect.bottom + 20, left: Math.max(20, currentTargetRect.left) };
    }
    // Try above
    if (currentTargetRect.top - 20 - 200 > 0) {
      return { top: currentTargetRect.top - 200, left: Math.max(20, currentTargetRect.left) };
    }
    // Try right
    if (currentTargetRect.right + 20 + 280 < viewportWidth) {
      return { top: Math.max(20, currentTargetRect.top), left: currentTargetRect.right + 20 };
    }
    // Try left
    if (currentTargetRect.left - 20 - 280 > 0) {
      return { top: Math.max(20, currentTargetRect.top), left: currentTargetRect.left - 280 - 20 };
    }
    
    // Fallback center
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  };

  const cardStyle = calculateCardPosition();

  return (
    <>
      {/* 1. The SVG Mask Spotlight */}
      <svg 
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 9000, pointerEvents: "none" }}
      >
        <defs>
          <mask id="guideMask">
            <rect width="100%" height="100%" fill="white" />
            {!isFullScreen && (
              <motion.rect 
                id="maskCutout"
                animate={{
                  x: mx,
                  y: my,
                  width: mwidth,
                  height: mheight,
                  rx: borderRadius
                }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.82)" 
          mask="url(#guideMask)"
          style={{ transition: "fill 0.5s" }}
        />
      </svg>

      {/* 2. The Highlight Effects Layer (sits exactly over the cutout) */}
      {!isFullScreen && (
        <motion.div
          animate={{
            x: mx,
            y: my,
            width: mwidth,
            height: mheight,
            borderRadius: borderRadius,
            boxShadow: `0 0 ${glowSpread} ${glowColor}`
          }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{
            position: "fixed",
            zIndex: 9001,
            pointerEvents: "none",
            border: "2px solid rgba(139, 92, 246, 0.6)",
          }}
          className="animate-pulse"
        />
      )}

      {/* 3. The Guide Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{
            position: "fixed",
            zIndex: 9002,
            ...cardStyle,
            width: 280,
            background: "#131318",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 16,
            boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            padding: 20
          }}
          className="flex flex-col gap-3"
        >
          {/* Step Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">
                Step {currentStepIndex + 1} of {activeGuide.steps.length}
              </span>
            </div>
          </div>

          {/* Type indicator */}
          {(() => {
            const meta = TYPE_META[step.type];
            const { Icon } = meta;
            return (
              <div className={`flex items-center gap-1.5 ${meta.color}`}>
                <Icon size={11} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{meta.label}</span>
              </div>
            );
          })()}

          {/* Title & Body */}
          <div>
            <h3 className="text-[15px] font-bold text-white mb-1.5 leading-tight">{step.title}</h3>
            <p className="text-[12.5px] text-white/65 leading-relaxed">
              {step.body}
            </p>
          </div>

          {/* Visual Button Preview */}
          {step.type === "BUTTON" && step.buttonLabel && (
            <div className="mt-0.5">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">Look for this button ↓</div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold shadow-sm shadow-orange-500/10">
                <MousePointerClick size={11} />
                {step.buttonLabel}
              </div>
            </div>
          )}

          {/* Interactive Prompt */}
          {step.requiresInteraction && !interactionSatisfied && (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
              <span className="text-xs text-orange-400 font-medium">
                👉 {step.interactivePrompt || "Action required to continue"}
              </span>
            </div>
          )}

          {/* Controls & Progress */}
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
            {/* Progress Dots */}
            <div className="flex gap-1.5">
              {activeGuide.steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex 
                      ? "w-4 bg-purple-500" 
                      : i < currentStepIndex 
                        ? "w-1.5 bg-purple-500/50" 
                        : "w-1.5 bg-white/20"
                  }`} 
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button 
                  onClick={prevStep}
                  className="text-xs text-white/50 hover:text-white px-2 py-1"
                >
                  ← Back
                </button>
              )}
              
              <button 
                onClick={nextStep}
                disabled={!interactionSatisfied}
                className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${
                  interactionSatisfied 
                    ? currentStepIndex === activeGuide.steps.length - 1
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                }`}
              >
                {currentStepIndex === activeGuide.steps.length - 1 ? "Finish →" : "Next →"}
              </button>
            </div>
          </div>

          {currentStepIndex === 0 && (
            <div className="absolute -bottom-6 left-0 right-0 text-center">
              <span className="text-[10px] text-white/30">← → to navigate · Esc to skip</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
