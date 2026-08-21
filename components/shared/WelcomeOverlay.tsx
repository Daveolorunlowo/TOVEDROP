'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Gift, ChevronRight, Check } from 'lucide-react';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  if (hour < 21) return 'GOOD EVENING';
  return 'GOOD NIGHT';
};

// Generates random stars for the background
const Stars = () => {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);
  
  useEffect(() => {
    setStars(Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -30],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export function WelcomeOverlay() {
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<'idle' | 'dot' | 'laser' | 'void' | 'text' | 'zoom' | 'guide' | 'done'>('idle');
  const [guideStep, setGuideStep] = useState(0);
  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(' ')[0] || 'RIDER';

  useEffect(() => {
    if (status === 'authenticated') {
      const hasSeenGuide = localStorage.getItem('hasSeenGuide');

      // Sequence timeline (Plays on EVERY app entry)
      setPhase('dot');
      setTimeout(() => setPhase('laser'), 600);
      setTimeout(() => setPhase('void'), 1200);
      setTimeout(() => setPhase('text'), 1800);
      setTimeout(() => setPhase('zoom'), 4000);
      
      setTimeout(() => {
        if (!hasSeenGuide) setPhase('guide');
        else setPhase('done');
      }, 4800);
    }
  }, [status]);

  if (status !== 'authenticated' || phase === 'idle' || phase === 'done') return null;

  const isWelcomeActive = ['dot', 'laser', 'void', 'text', 'zoom'].includes(phase);

  return (
    <>
      <AnimatePresence>
        {isWelcomeActive && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black overflow-hidden"
          >
            {/* The Void Background */}
            <motion.div 
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: (phase === 'void' || phase === 'text' || phase === 'zoom') ? 1 : 0,
                scale: phase === 'zoom' ? 3 : 1 
              }}
              transition={{ duration: phase === 'zoom' ? 0.8 : 1, ease: 'easeInOut' }}
            >
              <Stars />
            </motion.div>

            {/* Phase 1: Glowing Dot */}
            <AnimatePresence>
              {phase === 'dot' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 1], opacity: 1, boxShadow: "0 0 40px 10px rgba(139, 92, 246, 0.8)" }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-2 h-2 bg-white rounded-full absolute z-10"
                />
              )}
            </AnimatePresence>

            {/* Phase 2: Horizontal Laser */}
            <AnimatePresence>
              {phase === 'laser' && (
                <motion.div
                  initial={{ scaleX: 0, height: '4px', opacity: 1 }}
                  animate={{ scaleX: 1, height: '4px', opacity: 1, boxShadow: "0 0 60px 20px rgba(139, 92, 246, 0.8)" }}
                  exit={{ height: '100vh', opacity: 0 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="w-full bg-violet-400 absolute z-10 origin-center"
                />
              )}
            </AnimatePresence>

            {/* Phase 3 & 4: Cinematic Text Reveal */}
            <AnimatePresence>
              {phase === 'text' && (
                <div className="relative z-20 flex flex-col items-center justify-center w-full h-full perspective-1000">
                  <motion.div
                    initial={{ opacity: 0, rotateX: 45, scale: 2, y: 100 }}
                    animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 5, filter: 'blur(20px)' }}
                    transition={{ type: 'spring', damping: 12, stiffness: 60 }}
                    className="flex flex-col items-center"
                  >
                    <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-white to-zinc-300 text-6xl md:text-8xl font-black tracking-[0.2em] mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                      {greeting}
                    </h1>
                    
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "circOut" }}
                      className="h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent mb-6 relative"
                    >
                      {/* Scanning light across the line */}
                      <motion.div 
                        animate={{ left: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-0 w-20 h-[2px] bg-white blur-[2px] -translate-y-1/2"
                      />
                    </motion.div>

                    <motion.h2 
                      initial={{ opacity: 0, y: 20, letterSpacing: '0em' }}
                      animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
                      transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                      className="text-violet-400 text-3xl md:text-5xl font-bold uppercase drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                    >
                      {firstName}
                    </motion.h2>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automated Guide (unchanged premium glassmorphism) */}
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
              className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="flex w-full h-1 bg-zinc-800">
                <motion.div 
                  className="h-full bg-violet-500" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${((guideStep + 1) / 3) * 100}%` }}
                />
              </div>

              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={guideStep}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative z-10"
                      >
                        {guideStep === 0 && <MapPin className="w-12 h-12 text-violet-500" />}
                        {guideStep === 1 && <Car className="w-12 h-12 text-orange-500" />}
                        {guideStep === 2 && <Gift className="w-12 h-12 text-green-500" />}
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
                      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        {guideStep === 0 && 'Request a Ride'}
                        {guideStep === 1 && 'Meet Your Driver'}
                        {guideStep === 2 && 'Earn Free Drops'}
                      </h2>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {guideStep === 0 && 'Enter your pickup and destination on campus. We will match you with a trusted student driver.'}
                        {guideStep === 1 && 'Track your driver in real-time. All drivers are verified students for your safety.'}
                        {guideStep === 2 && 'Refer friends to earn free drops and save on your daily commutes!'}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 flex justify-between items-center border-t border-zinc-900">
                <div className="flex gap-1.5 ml-2">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === guideStep ? 'w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'w-1.5 bg-zinc-700'}`} 
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    if (guideStep < 2) setGuideStep(s => s + 1);
                    else {
                      localStorage.setItem('hasSeenGuide', 'true');
                      setPhase('done');
                    }
                  }}
                  className="bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-[0_4px_14px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.3)]"
                >
                  {guideStep < 2 ? (
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
