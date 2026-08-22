"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { APP_GUIDES, GuideDefinition, GuideStep } from "@/lib/guide-steps";
import * as Tone from "tone";

type GuideContextType = {
  activeGuide: GuideDefinition | null;
  currentStepIndex: number;
  isOpen: boolean;
  startGuide: (pageKey: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipGuide: () => void;
  interactionSatisfied: boolean;
  setInteractionSatisfied: (val: boolean) => void;
  currentTargetRect: DOMRect | null;
  checkAndStartGuide: (pageKey: string) => Promise<void>;
};

const GuideContext = createContext<GuideContextType | undefined>(undefined);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [activePageKey, setActivePageKey] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [interactionSatisfied, setInteractionSatisfied] = useState(true);
  const [currentTargetRect, setCurrentTargetRect] = useState<DOMRect | null>(null);
  const [completedGuides, setCompletedGuides] = useState<Record<string, boolean>>({});
  
  const activeGuide = activePageKey ? APP_GUIDES[activePageKey] : null;

  // Fetch user's guide progress
  useEffect(() => {
    fetch('/api/guide/progress')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, boolean> = {};
          data.forEach(item => {
            if (item.completed || item.skipped) {
              map[item.pageKey] = true;
            }
          });
          setCompletedGuides(map);
        }
      })
      .catch(err => console.error("Failed to load guide progress", err));
  }, []);

  // Sound effects
  const playSound = useCallback((type: "advance" | "complete" | "skip") => {
    try {
      if (Tone.context.state !== "running") return; // Silent if not initialized
      
      if (type === "advance") {
        const synth = new Tone.Synth({ volume: -20 }).toDestination();
        const now = Tone.now();
        synth.triggerAttackRelease("C5", "8n", now);
        synth.triggerAttackRelease("E5", "8n", now + 0.1);
      } else if (type === "complete") {
        const polySynth = new Tone.PolySynth(Tone.Synth, { volume: -15 }).toDestination();
        polySynth.triggerAttackRelease(["C4", "E4", "G4", "B4"], "2n");
      } else if (type === "skip") {
        const synth = new Tone.Synth({ volume: -25 }).toDestination();
        synth.triggerAttackRelease("A3", "8n");
      }
    } catch (e) {
      console.log("Audio not available", e);
    }
  }, []);

  // Compute rect on step change, resize, scroll
  const updateRect = useCallback(() => {
    if (!activeGuide || !isOpen) return;
    const step = activeGuide.steps[currentStepIndex];
    if (!step) return;

    let el = document.querySelector(step.targetSelector) as HTMLElement;
    
    if (!el && step.targetSelector === "body") {
       el = document.body;
    }

    if (el) {
      // Auto-scroll if out of view
      const rect = el.getBoundingClientRect();
      const isInViewport = 
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);

      if (!isInViewport && step.targetSelector !== "body") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Re-calculate after potential scroll
      setTimeout(() => {
        const newRect = el.getBoundingClientRect();
        if (newRect.width > 0 || newRect.height > 0) {
           setCurrentTargetRect(newRect);
        }
      }, 300); // give it time to scroll

      if (rect.width > 0 || rect.height > 0) {
        setCurrentTargetRect(rect);
      }
    } else {
      console.warn("Guide step target not found:", step.targetSelector);
    }
  }, [activeGuide, currentStepIndex, isOpen]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });
    
    // Mutation observer in case elements render asynchronously
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      observer.disconnect();
    };
  }, [updateRect]);

  const recordCompletion = async (pageKey: string, skipped: boolean = false) => {
    try {
      await fetch('/api/guide/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey, skipped })
      });
    } catch (e) {
      console.error("Failed to record guide completion", e);
    }
  };

  const startGuide = useCallback(async (pageKey: string) => {
    // Only init Tone on user interaction or first start
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    setActivePageKey(pageKey);
    setCurrentStepIndex(0);
    setIsOpen(true);
    
    const firstStep = APP_GUIDES[pageKey]?.steps[0];
    setInteractionSatisfied(!(firstStep?.requiresInteraction));
  }, []);

  const checkAndStartGuide = useCallback(async (pageKey: string) => {
    // If it's already completed or skipped, don't start
    if (completedGuides[pageKey]) return;
    
    // Add 1.5s delay as requested for first-time auto-starts
    setTimeout(() => {
      // Check again in case it was updated while waiting
      setCompletedGuides(currentMap => {
        if (!currentMap[pageKey] && !isOpen) {
          startGuide(pageKey);
        }
        return currentMap;
      });
    }, 1500);
  }, [completedGuides, startGuide, isOpen]);

  const nextStep = useCallback(() => {
    if (!activeGuide) return;
    
    if (currentStepIndex < activeGuide.steps.length - 1) {
      playSound("advance");
      setCurrentStepIndex(prev => prev + 1);
      const nextStepDef = activeGuide.steps[currentStepIndex + 1];
      setInteractionSatisfied(!(nextStepDef.requiresInteraction));
    } else {
      // Guide complete
      playSound("complete");
      setIsOpen(false);
      setActivePageKey(null);
      recordCompletion(activeGuide.pageKey, false);
    }
  }, [activeGuide, currentStepIndex, playSound]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      const prevStepDef = activeGuide!.steps[currentStepIndex - 1];
      setInteractionSatisfied(!(prevStepDef.requiresInteraction));
    }
  }, [currentStepIndex, activeGuide]);

  const skipGuide = useCallback(() => {
    playSound("skip");
    setIsOpen(false);
    if (activePageKey) {
      recordCompletion(activePageKey, true);
    }
    setActivePageKey(null);
  }, [activePageKey, playSound]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (interactionSatisfied) nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        skipGuide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, interactionSatisfied, nextStep, prevStep, skipGuide]);

  return (
    <GuideContext.Provider value={{
      activeGuide,
      currentStepIndex,
      isOpen,
      startGuide,
      nextStep,
      prevStep,
      skipGuide,
      interactionSatisfied,
      setInteractionSatisfied,
      currentTargetRect,
      checkAndStartGuide
    }}>
      {children}
    </GuideContext.Provider>
  );
}

export function useGuide() {
  const context = useContext(GuideContext);
  if (context === undefined) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
}
