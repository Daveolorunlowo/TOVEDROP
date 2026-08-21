'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Gift, ChevronRight, Check } from 'lucide-react';

export function WelcomeOverlay() {
  const { data: session, status } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [greeting, setGreeting] = useState('Welcome');
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    if (status === 'authenticated') {
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
      const hasSeenGuide = localStorage.getItem('hasSeenGuide');

      // Determine greeting
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else if (hour < 21) setGreeting('Good Evening');
      else setGreeting('Good Night');

      if (!hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
        
        // Hide welcome after 2.5s
        setTimeout(() => {
          setShowWelcome(false);
          // Show guide if they haven't seen it
          if (!hasSeenGuide) {
            setTimeout(() => setShowGuide(true), 500); // Wait for welcome to fade out
          }
        }, 2500);
      } else if (!hasSeenGuide) {
        // Just show guide if they missed it somehow or refreshed during it
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
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -20 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                {greeting}, {session?.user?.name?.split(' ')[0] || 'there'}! <span className="inline-block animate-wave" style={{ transformOrigin: '70% 70%' }}>👋</span>
              </h1>
              <p className="mt-4 text-zinc-300 font-medium tracking-widest uppercase text-sm">
                Ready for your next ride?
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
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
                  <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center shadow-inner">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={guideStep}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
                      <h2 className="text-2xl font-bold text-white mb-2">{steps[guideStep].title}</h2>
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
                      className={`h-1.5 rounded-full transition-all ${i === guideStep ? 'w-4 bg-white' : 'w-1.5 bg-zinc-700'}`} 
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    if (guideStep < steps.length - 1) setGuideStep(s => s + 1);
                    else finishGuide();
                  }}
                  className="bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-transform active:scale-95"
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
