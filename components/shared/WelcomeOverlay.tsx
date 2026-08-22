'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Gift, ChevronRight, Check, Star, Users, Activity, LineChart } from 'lucide-react';

export function WelcomeOverlay() {
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<'idle' | 'glow' | 'text' | 'fade' | 'guide' | 'done'>('idle');
  const [guideStep, setGuideStep] = useState(0);
  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const role = (session?.user as any)?.role || 'RIDER';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  useEffect(() => {
    if (status === 'authenticated') {
      const hasSeenGuide = localStorage.getItem(`hasSeenGuide_${role}`);

      // Warm, gentle sequence
      setPhase('glow');
      setTimeout(() => setPhase('text'), 600);
      setTimeout(() => setPhase('fade'), 3600);
      
      setTimeout(() => {
        if (!hasSeenGuide) setPhase('guide');
        else setPhase('done');
      }, 4400);
    }
  }, [status, role]);

  if (status !== 'authenticated' || phase === 'idle' || phase === 'done') return null;

  const isWelcomeActive = ['glow', 'text', 'fade'].includes(phase);
  const greeting = getGreeting();

  const guideContent = {
    RIDER: [
      {
        icon: <MapPin className="w-12 h-12 text-orange-brand" />,
        title: 'Request a Ride',
        desc: 'Enter your pickup and destination on campus. We will match you with a trusted student driver.'
      },
      {
        icon: <Car className="w-12 h-12 text-orange-brand" />,
        title: 'Meet Your Driver',
        desc: 'Track your driver in real-time. All drivers are verified students for your safety.'
      },
      {
        icon: <Star className="w-12 h-12 text-orange-brand" />,
        title: 'Safety First',
        desc: 'All our drivers are students verified with valid university IDs to ensure a secure ride.'
      }
    ],
    DRIVER: [
      {
        icon: <MapPin className="w-12 h-12 text-orange-brand" />,
        title: 'Accept Trips',
        desc: 'Toggle yourself online to start receiving ride requests from students on campus.'
      },
      {
        icon: <Car className="w-12 h-12 text-orange-brand" />,
        title: 'Drive & Earn',
        desc: 'Use the built-in navigation to pick up riders. Your earnings are securely tracked.'
      },
      {
        icon: <Star className="w-12 h-12 text-orange-brand" />,
        title: 'Build Your Reputation',
        desc: 'Provide great service to earn 5-star ratings and become a top-tier campus driver.'
      }
    ],
    ADMIN: [
      {
        icon: <Users className="w-12 h-12 text-orange-brand" />,
        title: 'Manage Users',
        desc: 'Oversee all riders and drivers. Approve new driver applications and resolve disputes.'
      },
      {
        icon: <Activity className="w-12 h-12 text-orange-brand" />,
        title: 'Monitor Platform',
        desc: 'Keep an eye on active trips, system health, and real-time campus activity.'
      },
      {
        icon: <LineChart className="w-12 h-12 text-orange-brand" />,
        title: 'Review Analytics',
        desc: 'Track revenue, growth metrics, and drop usage across the platform.'
      }
    ]
  };

  const steps = guideContent[role as keyof typeof guideContent] || guideContent.RIDER;

  return (
    <>
      <AnimatePresence>
        {isWelcomeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-bg-deep"
          >
            {/* The Warm Glowing Orbs Background (App Theme) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center mix-blend-screen opacity-50">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.2, 0.9, 1.1],
                  opacity: [0.2, 0.4, 0.3, 0.2]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-[60vw] h-[60vw] rounded-full blur-[100px] bg-orange-brand -translate-x-1/4 -translate-y-1/4"
              />
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.3, 0.9, 1.2],
                  opacity: [0.2, 0.3, 0.2, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute w-[70vw] h-[70vw] rounded-full blur-[120px] bg-purple-brand translate-x-1/4 translate-y-1/4"
              />
            </div>

            {/* A gentle glass overlay to soften everything */}
            <div className="absolute inset-0 backdrop-blur-[30px] z-10" />

            {/* Gentle Text Reveal */}
            <AnimatePresence>
              {phase === 'text' && (
                <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-2 text-text-primary drop-shadow-xl"
                  >
                    {greeting},
                  </motion.h1>
                  
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 1, duration: 1.5, ease: 'easeInOut' }}
                    className="text-4xl md:text-6xl font-medium text-text-primary opacity-90 drop-shadow-md"
                  >
                    {firstName}
                  </motion.h2>

                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automated Guide */}
      <AnimatePresence>
        {phase === 'guide' && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="flex w-full h-1 bg-surface-elevated">
                <motion.div 
                  className="h-full bg-orange-brand" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${((guideStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-orange-brand/10 blur-xl rounded-full animate-pulse" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={guideStep}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative z-10"
                      >
                        {steps[guideStep].icon}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="text-center h-28">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={guideStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
                        {steps[guideStep].title}
                      </h2>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {steps[guideStep].desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-4 bg-bg-deep flex justify-between items-center border-t border-border-subtle">
                <div className="flex gap-1.5 ml-2">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === guideStep ? 'w-4 bg-orange-brand shadow-[0_0_8px_rgba(217,119,6,0.5)]' : 'w-1.5 bg-surface-elevated'}`} 
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    if (guideStep < steps.length - 1) setGuideStep(s => s + 1);
                    else {
                      localStorage.setItem(`hasSeenGuide_${role}`, 'true');
                      setPhase('done');
                    }
                  }}
                  className="bg-orange-brand hover:bg-orange-dark text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-[0_4px_14px_0_rgba(217,119,6,0.2)] hover:shadow-[0_6px_20px_rgba(217,119,6,0.3)]"
                >
                  {guideStep < steps.length - 1 ? (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <>Get Started <Check className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
