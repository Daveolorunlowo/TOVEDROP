"use client";

import { useEffect, useState, useCallback } from "react";
import { useGuide } from "@/hooks/useGuide";
import { motion, AnimatePresence } from "framer-motion";
import { GuideElementType } from "@/lib/guide-steps";
import {
  MousePointerClick, Navigation, TextCursor, Tag, Star,
  LayoutGrid, ChevronLeft, ChevronRight, X, HelpCircle, CheckCircle2
} from "lucide-react";

const TYPE_META: Record<GuideElementType, { label: string; Icon: any; color: string; bg: string }> = {
  BUTTON:      { label: "Button",       Icon: MousePointerClick, color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
  CARD:        { label: "Card",         Icon: LayoutGrid,        color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
  INPUT:       { label: "Input Field",  Icon: TextCursor,        color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20"    },
  NAVIGATION:  { label: "Navigation",   Icon: Navigation,        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"    },
  BADGE:       { label: "Badge",        Icon: Tag,               color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20"},
  ICON:        { label: "Icon",         Icon: Star,              color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20"},
  INTERACTIVE: { label: "Interactive",  Icon: MousePointerClick, color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20"},
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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
      if (e.key === "ArrowLeft")                       prevStep();
      if (e.key === "Escape")                          skipGuide();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, nextStep, prevStep, skipGuide]);

  // Floating help button when guide is closed
  if (!isOpen || !activeGuide) {
    return (
      <button
        onClick={() => startGuide("welcome")}
        className="fixed bottom-6 left-6 z-[9000] w-11 h-11 rounded-full bg-[#131318] border border-white/10 shadow-xl flex items-center justify-center text-white/50 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-300 group"
        title="Start guide"
      >
        <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  const step = activeGuide.steps[currentStepIndex];
  if (!step) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep  = currentStepIndex === activeGuide.steps.length - 1;
  const totalSteps  = activeGuide.steps.length;
  const meta        = TYPE_META[step.type];
  const { Icon: TypeIcon } = meta;

  // --- Spotlight sizing ---
  let padding = 12;
  let borderRadius = 8;
  let glowColor = "rgba(139, 92, 246, 0.5)";
  let glowSpread = "20px";

  switch (step.type) {
    case "BUTTON":      borderRadius = 999; glowColor = "rgba(249,115,22,0.6)";  break;
    case "CARD":        borderRadius = 12;  padding = 16; glowColor = "rgba(139,92,246,0.4)"; break;
    case "INPUT":       borderRadius = 8;   padding = 8;  glowColor = "rgba(6,182,212,0.5)";  break;
    case "NAVIGATION":  borderRadius = step.targetSelector.includes("chip") ? 999 : 0; padding = 4; break;
    case "BADGE":       borderRadius = 4;   padding = 4;  break;
    case "ICON":        borderRadius = 999; padding = 8;  glowSpread = "30px"; break;
  }

  const isFullScreen = step.targetSelector === "body";
  const mx      = isFullScreen ? 0 : (currentTargetRect?.x || 0) - padding;
  const my      = isFullScreen ? 0 : (currentTargetRect?.y || 0) - padding;
  const mwidth  = isFullScreen ? 0 : (currentTargetRect?.width  || 0) + padding * 2;
  const mheight = isFullScreen ? 0 : (currentTargetRect?.height || 0) + padding * 2;

  // --- Card positioning ---
  const calculateCardPosition = () => {
    if (isFullScreen || !currentTargetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const cardW = 300;
    const cardH = 320;
    const gap = 20;

    if (currentTargetRect.bottom + gap + cardH < vh)
      return { top: currentTargetRect.bottom + gap, left: Math.min(vw - cardW - 20, Math.max(20, currentTargetRect.left)) };
    if (currentTargetRect.top - gap - cardH > 0)
      return { top: currentTargetRect.top - cardH - gap, left: Math.min(vw - cardW - 20, Math.max(20, currentTargetRect.left)) };
    if (currentTargetRect.right + gap + cardW < vw)
      return { top: Math.max(20, currentTargetRect.top), left: currentTargetRect.right + gap };
    if (currentTargetRect.left - gap - cardW > 0)
      return { top: Math.max(20, currentTargetRect.top), left: currentTargetRect.left - cardW - gap };
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  };

  const cardStyle = calculateCardPosition();

  return (
    <>
      {/* ── 1. Dimmed backdrop with spotlight cutout ── */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 9000, pointerEvents: "none" }}>
        <defs>
          <mask id="guideMask">
            <rect width="100%" height="100%" fill="white" />
            {!isFullScreen && (
              <motion.rect
                id="maskCutout"
                animate={{ x: mx, y: my, width: mwidth, height: mheight, rx: borderRadius }}
                transition={{ type: "spring", damping: 22, stiffness: 110 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#guideMask)" />
      </svg>

      {/* ── 2. Glow ring around focused element ── */}
      {!isFullScreen && (
        <motion.div
          animate={{ x: mx, y: my, width: mwidth, height: mheight, borderRadius, boxShadow: `0 0 ${glowSpread} ${glowColor}` }}
          transition={{ type: "spring", damping: 22, stiffness: 110 }}
          style={{ position: "fixed", zIndex: 9001, pointerEvents: "none", border: "2px solid rgba(139,92,246,0.55)" }}
          className="animate-pulse"
        />
      )}

      {/* ── 3. Guide Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{
            position: "fixed",
            zIndex: 9002,
            ...cardStyle,
            width: 300,
            background: "linear-gradient(145deg, #16161e, #111118)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 18,
            boxShadow: "0 28px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset",
            overflow: "hidden",
          }}
        >
          {/* Top accent bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-purple-600 via-violet-500 to-transparent" />

          <div className="flex flex-col gap-3 p-5">
            {/* Header row: step pill + skip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  {currentStepIndex + 1} / {totalSteps}
                </span>
              </div>
              <button
                onClick={skipGuide}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
                title="Skip guide (Esc)"
              >
                <X size={13} />
              </button>
            </div>

            {/* Element type chip */}
            <div className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg}`}>
              <TypeIcon size={10} />
              {meta.label}
            </div>

            {/* Title + body */}
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1.5 leading-snug">{step.title}</h3>
              <p className="text-[12.5px] text-white/60 leading-relaxed">{step.body}</p>
            </div>

            {/* Button preview */}
            {step.type === "BUTTON" && step.buttonLabel && (
              <div className="rounded-xl bg-white/3 border border-white/8 px-3 py-2.5">
                <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Look for this button</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[12px] font-semibold">
                  <MousePointerClick size={11} />
                  {step.buttonLabel}
                </div>
              </div>
            )}

            {/* Interaction required notice */}
            {step.requiresInteraction && !interactionSatisfied && (
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2.5 flex items-start gap-2">
                <span className="text-base mt-0.5">👉</span>
                <span className="text-[12px] text-orange-300 font-medium leading-snug">
                  {step.interactivePrompt || "Action required to continue"}
                </span>
              </div>
            )}

            {/* Progress dots — clickable */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {activeGuide.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // Jump to step by calling prev/next repeatedly is not ideal,
                    // but dots serve as a visual indicator — we highlight them only
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentStepIndex
                      ? "w-5 h-1.5 bg-purple-500"
                      : i < currentStepIndex
                        ? "w-1.5 h-1.5 bg-purple-500/45"
                        : "w-1.5 h-1.5 bg-white/15"
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              {/* Back */}
              <button
                onClick={prevStep}
                disabled={isFirstStep}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isFirstStep
                    ? "opacity-0 pointer-events-none"
                    : "border-white/10 text-white/50 hover:text-white hover:border-white/20 hover:bg-white/5 active:scale-95"
                }`}
              >
                <ChevronLeft size={15} />
                Back
              </button>

              {/* Next / Finish */}
              <button
                onClick={nextStep}
                disabled={!interactionSatisfied}
                className={`flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                  !interactionSatisfied
                    ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                    : isLastStep
                      ? "bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white border border-green-500/30 shadow-lg shadow-green-500/20 hover:brightness-110"
                      : "bg-gradient-to-r from-purple-600/80 to-violet-600/80 text-white border border-purple-500/30 shadow-lg shadow-purple-500/20 hover:brightness-110"
                }`}
              >
                {isLastStep ? (
                  <><CheckCircle2 size={14} /> Done!</>
                ) : (
                  <>Next <ChevronRight size={15} /></>
                )}
              </button>
            </div>



          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
