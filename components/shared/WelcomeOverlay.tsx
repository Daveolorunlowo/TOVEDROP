'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Star, Users, Activity, LineChart, ChevronRight, Check, X } from 'lucide-react';

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

  const [phase, setPhase] = useState<'greeting' | 'fade' | 'guide' | 'done'>(() => {
    if (hasSeenWelcome || isPublicPage) return 'done';
    return 'greeting';
  });

  const [guideStep, setGuideStep] = useState(0);

  const firstName =
    initialFirstName ||
    session?.user?.name?.split(' ')[0] ||
    'there';

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

  // Handle sequence progression
  useEffect(() => {
    if (phase === 'done' || isPublicPage) return;

    let hasSeenGuide = false;
    try {
      hasSeenGuide = localStorage.getItem(`hasSeenGuide_${role}`) === 'true';
    } catch (e) {}

    // Gentle reading time for the personal greeting
    const fadeTimer = setTimeout(() => {
      setPhase('fade');
    }, 2800);

    const nextPhaseTimer = setTimeout(() => {
      if (!hasSeenGuide) {
        setPhase('guide');
      } else {
        dismiss();
      }
    }, 3400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextPhaseTimer);
    };
  }, [phase, isPublicPage, role, dismiss]);

  // If on a public route, do not render anything
  if (isPublicPage) return null;

  const greeting = getGreeting();

  const guideContent = {
    RIDER: [
      {
        icon: <MapPin className="w-10 h-10 text-orange-brand" />,
        title: 'Request a Ride',
        desc: 'Enter your pickup and destination on campus. We match you with a verified student driver.',
      },
      {
        icon: <Car className="w-10 h-10 text-orange-brand" />,
        title: 'Meet Your Driver',
        desc: 'Track your driver in real-time. All drivers are verified students for your safety.',
      },
      {
        icon: <Star className="w-10 h-10 text-orange-brand" />,
        title: 'Campus Safe',
        desc: 'All rides are monitored and insured on campus. Tap SOS anytime for immediate campus security.',
      },
    ],
    DRIVER: [
      {
        icon: <MapPin className="w-10 h-10 text-orange-brand" />,
        title: 'Accept Trips',
        desc: 'Toggle yourself online to start receiving ride requests from verified students on campus.',
      },
      {
        icon: <Car className="w-10 h-10 text-orange-brand" />,
        title: 'Drive & Earn',
        desc: 'Follow the built-in campus routing. Your earnings are securely tracked in real time.',
      },
      {
        icon: <Star className="w-10 h-10 text-orange-brand" />,
        title: 'Build Your Reputation',
        desc: 'Provide reliable service to earn top ratings and unlock priority booking perks.',
      },
    ],
    ADMIN: [
      {
        icon: <Users className="w-10 h-10 text-orange-brand" />,
        title: 'Manage Users',
        desc: 'Oversee all riders and drivers, approve verifications, and resolve student disputes.',
      },
      {
        icon: <Activity className="w-10 h-10 text-orange-brand" />,
        title: 'Monitor Platform',
        desc: 'Keep an eye on active trips, system telemetry, and real-time campus ride flow.',
      },
      {
        icon: <LineChart className="w-10 h-10 text-orange-brand" />,
        title: 'Review Analytics',
        desc: 'Track platform performance, ride volumes, and drop usage across campus.',
      },
    ],
  };

  const steps = guideContent[role as keyof typeof guideContent] || guideContent.RIDER;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="welcome-root-overlay"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#0A0D14]"
          style={{ opacity: 1, backgroundColor: '#0A0D14' }}
        >
          {/* Ambient Glowing Background - Completely opaque backdrop to eliminate dashboard glimpse */}
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
            {/* Dark glass tint to maintain maximum contrast */}
            <div className="absolute inset-0 bg-[#0A0D14]/50 backdrop-blur-[2px]" />
          </div>

          {/* Quick Skip Control in Top-Right */}
          <button
            onClick={dismiss}
            type="button"
            aria-label="Skip welcome screen"
            className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Center Stage: Smooth Transition Between Greeting and Guide */}
          <div className="relative z-20 w-full h-full flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              {(phase === 'greeting' || phase === 'fade') && (
                <motion.div
                  key="greeting-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: phase === 'fade' ? 0 : 1,
                    y: phase === 'fade' ? -15 : 0,
                    filter: phase === 'fade' ? 'blur(6px)' : 'blur(0px)',
                  }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-brand/15 border border-orange-brand/30 text-orange-brand text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-orange-brand animate-ping" />
                    Campus Rideshare
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-2 text-white drop-shadow-xl">
                    {greeting},
                  </h1>

                  <h2 className="text-3xl sm:text-5xl font-bold text-orange-brand drop-shadow-md">
                    {firstName}
                  </h2>

                  <p className="mt-4 text-sm sm:text-base text-white/70 font-medium tracking-wide">
                    Your campus ride, your trusted driver
                  </p>
                </motion.div>
              )}

              {phase === 'guide' && (
                <motion.div
                  key="guide-view"
                  initial={{ opacity: 0, scale: 0.94, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                  className="w-full max-w-md bg-[#111624] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
                >
                  {/* Step Progress Bar */}
                  <div className="w-full h-1 bg-white/10">
                    <motion.div
                      className="h-full bg-orange-brand"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((guideStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="p-7 sm:p-8">
                    {/* Step Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-orange-brand/15 blur-xl rounded-full animate-pulse" />
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={guideStep}
                            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="relative z-10"
                          >
                            {steps[guideStep].icon}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Step Description */}
                    <div className="text-center min-h-[100px] flex flex-col justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={guideStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                        >
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                            {steps[guideStep].title}
                          </h3>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {steps[guideStep].desc}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 sm:p-5 bg-[#0D111C] flex justify-between items-center border-t border-white/10">
                    {/* Dots */}
                    <div className="flex gap-1.5 ml-2">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === guideStep ? 'w-5 bg-orange-brand' : 'w-1.5 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (guideStep < steps.length - 1) {
                          setGuideStep((s) => s + 1);
                        } else {
                          dismiss();
                        }
                      }}
                      className="bg-orange-brand hover:bg-orange-dark text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-orange-brand/20 cursor-pointer"
                    >
                      {guideStep < steps.length - 1 ? (
                        <>
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Get Started</span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
