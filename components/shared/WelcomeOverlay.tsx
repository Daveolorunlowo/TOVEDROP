'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface WelcomeOverlayProps {
  hasSeenWelcome?: boolean;
  initialFirstName?: string;
  initialRole?: string;
}

export function WelcomeOverlay({
  hasSeenWelcome = false,
  initialFirstName = '',
  initialRole = 'RIDER',
}: WelcomeOverlayProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Never display on public guest routes, auth pages, or initial welcome onboarding
  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/clear') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy');

  const [phase, setPhase] = useState<'greeting' | 'fade' | 'done'>(() => {
    if (hasSeenWelcome || isPublicPage) return 'done';
    return 'greeting';
  });

  const firstName =
    initialFirstName ||
    session?.user?.name?.split(' ')[0] ||
    '';

  const rawRole = (initialRole || (session?.user as any)?.role || 'RIDER').toUpperCase();
  const role = ['RIDER', 'DRIVER', 'ADMIN'].includes(rawRole) ? rawRole : 'RIDER';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const dismiss = useCallback(() => {
    // Set cookie so navigation and in-session page refreshes don't re-trigger
    document.cookie = 'tovedrop_welcomed=true; path=/; SameSite=Lax';
    try {
      sessionStorage.setItem('tovedrop_welcomed', 'true');
      localStorage.setItem(`hasSeenGuide_${role}`, 'true');
    } catch (e) {}
    setPhase('done');
  }, [role]);

  // Lock body scroll while overlay is active to prevent background scrolling
  useEffect(() => {
    if (phase !== 'done') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [phase]);

  // Handle sequence progression: display greeting, then smoothly fade out
  useEffect(() => {
    if (phase === 'done' || isPublicPage) return;

    const fadeTimer = setTimeout(() => {
      setPhase('fade');
    }, 2400);

    const doneTimer = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [phase, isPublicPage, dismiss]);

  // If on a public route, do not render anything
  if (isPublicPage) return null;

  const greeting = getGreeting();
  const hasName = Boolean(firstName && firstName.trim() !== '' && firstName.toLowerCase() !== 'there');

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="welcome-root-overlay"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={dismiss}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#0A0D14] cursor-pointer"
          style={{ opacity: 1, backgroundColor: '#0A0D14' }}
        >
          {/* Ambient Glowing Background */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                scale: [0.9, 1.15, 0.95, 1.1],
                opacity: [0.25, 0.45, 0.3, 0.25],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-[60vw] h-[60vw] max-w-[550px] max-h-[550px] rounded-full blur-[100px] bg-orange-brand -translate-x-1/4 -translate-y-1/4"
            />
            <motion.div
              animate={{
                scale: [1, 1.25, 0.9, 1.15],
                opacity: [0.2, 0.35, 0.2, 0.2],
              }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute w-[70vw] h-[70vw] max-w-[650px] max-h-[650px] rounded-full blur-[120px] bg-purple-brand translate-x-1/4 translate-y-1/4"
            />
            <div className="absolute inset-0 bg-[#0A0D14]/50 backdrop-blur-[2px]" />
          </div>

          {/* Icon-only dismiss button in top-right (no text) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            type="button"
            aria-label="Close"
            className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30 w-10 h-10 rounded-full text-white/60 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Center Stage: ONLY the greeting */}
          <div className="relative z-20 w-full h-full flex items-center justify-center p-6 pointer-events-none">
            <AnimatePresence mode="wait">
              {(phase === 'greeting' || phase === 'fade') && (
                <motion.div
                  key="greeting-view"
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{
                    opacity: phase === 'fade' ? 0 : 1,
                    scale: phase === 'fade' ? 1.04 : 1,
                    y: phase === 'fade' ? -12 : 0,
                    filter: phase === 'fade' ? 'blur(8px)' : 'blur(0px)',
                  }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto select-none"
                >
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
                    {greeting}{hasName ? ',' : ''}
                  </h1>

                  {hasName && (
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-orange-brand drop-shadow-lg mt-2 sm:mt-3">
                      {firstName}
                    </h2>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
