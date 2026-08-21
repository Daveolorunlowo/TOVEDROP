'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Gift, ChevronRight, Check } from 'lucide-react';

const getThemeColors = (hour: number) => {
  if (hour >= 5 && hour < 12) {
    return {
      bg: 'bg-gradient-to-br from-orange-100 via-rose-100 to-amber-50',
      blob1: 'bg-orange-300',
      blob2: 'bg-rose-300',
      blob3: 'bg-amber-300',
      text: 'text-zinc-900',
      greeting: 'Good Morning',
      icon: '🌅',
      overlay: 'bg-white/30'
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      bg: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100',
      blob1: 'bg-blue-300',
      blob2: 'bg-cyan-300',
      blob3: 'bg-sky-300',
      text: 'text-zinc-900',
      greeting: 'Good Afternoon',
      icon: '☀️',
      overlay: 'bg-white/30'
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      bg: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-orange-950',
      blob1: 'bg-purple-500',
      blob2: 'bg-orange-500',
      blob3: 'bg-rose-600',
      text: 'text-white',
      greeting: 'Good Evening',
      icon: '🌇',
      overlay: 'bg-black/40'
    };
  } else {
    return {
      bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-zinc-950',
      blob1: 'bg-indigo-600',
      blob2: 'bg-blue-600',
      blob3: 'bg-violet-600',
      text: 'text-white',
      greeting: 'Good Night',
      icon: '🌙',
      overlay: 'bg-black/60'
    };
  }
};

const StaggeredText = ({ text, className }: { text: string, className?: string }) => {
  const words = text.split(" ");
  
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 }
    }
  };
  
  const item: any = {
    hidden: { opacity: 0, y: 50, filter: 'blur(10px)', scale: 0.9 },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { type: 'spring', damping: 14, stiffness: 100 } }
  };
  
  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.4 } }} 
      className={`flex flex-wrap justify-center gap-x-[0.3em] ${className}`}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={item} className="inline-block drop-shadow-2xl">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

export function WelcomeOverlay() {
  const { data: session, status } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [theme, setTheme] = useState(getThemeColors(12));

  useEffect(() => {
    if (status === 'authenticated') {
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
      const hasSeenGuide = localStorage.getItem('hasSeenGuide');

      setTheme(getThemeColors(new Date().getHours()));

      if (!hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
        
        setTimeout(() => {
          setShowWelcome(false);
          if (!hasSeenGuide) {
            setTimeout(() => setShowGuide(true), 800); 
          }
        }, 3200); // Wait longer so they can appreciate the animation
      } else if (!hasSeenGuide) {
        setShowGuide(true);
      }
    }
  }, [status]);

  const finishGuide = () => {
    localStorage.setItem('hasSeenGuide', 'true');
    setShowGuide(false);
  };

  const steps = [
    {
      icon: <MapPin className="w-12 h-12 text-violet-500" />,
      title: 'Request a Ride',
      desc: 'Enter your pickup and destination on campus. We will match you with a trusted student driver.'
    },
    {
      icon: <Car className="w-12 h-12 text-orange-500" />,
      title: 'Meet Your Driver',
      desc: 'Track your driver in real-time. All drivers are verified students for your safety.'
    },
    {
      icon: <Gift className="w-12 h-12 text-green-500" />,
      title: 'Earn Free Drops',
      desc: 'Refer friends to earn free drops and save on your daily commutes!'
    }
  ];

  if (status !== 'authenticated') return null;

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden ${theme.bg}`}
          >
            {/* Ambient Background Blobs */}
            <div className={`absolute inset-0 ${theme.overlay} backdrop-blur-[60px] z-10`}></div>
            
            <motion.div 
              animate={{ 
                x: [0, 100, -50, 0], 
                y: [0, -100, 50, 0],
                scale: [1, 1.2, 0.9, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className={`absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[80px] opacity-60 ${theme.blob1} z-0`}
            />
            
            <motion.div 
              animate={{ 
                x: [0, -100, 100, 0], 
                y: [0, 100, -50, 0],
                scale: [1, 0.8, 1.3, 1]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className={`absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] rounded-full blur-[90px] opacity-60 ${theme.blob2} z-0`}
            />
            
            <motion.div 
              animate={{ 
                x: [0, 50, -100, 0], 
                y: [0, -50, 100, 0],
                scale: [1, 1.1, 0.8, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-40 ${theme.blob3} z-0`}
            />

            {/* Foreground Content */}
            <div className="z-20 text-center flex flex-col items-center justify-center px-6">
              <motion.div 
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.1 }}
                className="text-6xl md:text-8xl mb-8 drop-shadow-2xl"
              >
                {theme.icon}
              </motion.div>
              
              <StaggeredText 
                text={`${theme.greeting}, ${session?.user?.name?.split(' ')[0] || 'there'}!`} 
                className={`text-5xl md:text-7xl lg:text-8xl font-black ${theme.text} tracking-tight leading-tight`}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className={`mt-6 ${theme.text} opacity-70 font-medium tracking-widest uppercase text-xs md:text-sm`}
              >
                Let's get you moving
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide && (
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
                  animate={{ width: `${((guideStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center shadow-inner relative overflow-hidden">
                    {/* Inner glowing blob for the icon */}
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
                      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{steps[guideStep].title}</h2>
                      <p className="text-zinc-400 text-sm leading-relaxed">{steps[guideStep].desc}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 flex justify-between items-center border-t border-zinc-900">
                <div className="flex gap-1.5 ml-2">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === guideStep ? 'w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'w-1.5 bg-zinc-700'}`} 
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    if (guideStep < steps.length - 1) setGuideStep(s => s + 1);
                    else finishGuide();
                  }}
                  className="bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-[0_4px_14px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.3)]"
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
