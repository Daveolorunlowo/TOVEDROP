'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- Web Audio API Sound Synthesizer ---
class SoundEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWhoosh() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 1.5; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.8);
  }

  playPing() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.2;
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = 0.3;

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.ctx.destination);
    delayGain.connect(delay);

    osc.start(t);
    osc.stop(t + 1.5);
  }
}

// --- Kinetic Text Helper Component ---
const KineticText = ({ text, className = "", delay = 0, color = "text-foreground" }: { text: string, className?: string, delay?: number, color?: string }) => {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 12, stiffness: 200 },
    },
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.5,
      filter: "blur(10px)",
    },
  };

  return (
    <motion.div
      style={{ display: "flex", overflow: "hidden", justifyContent: "center", flexWrap: "wrap" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {letters.map((letter, index) => (
        <motion.span variants={child} key={index} className={color} style={{ display: letter === " " ? "inline-block" : "inline", width: letter === " " ? "0.5em" : "auto" }}>
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default function AdGenerator() {
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const soundEngineRef = useRef<SoundEngine | null>(null);

  const handlePlay = useCallback(() => {
    soundEngineRef.current = new SoundEngine();
    soundEngineRef.current.init();
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return

    const sfx = soundEngineRef.current;

    const timeline = [
      { step: 1, delay: 0, cb: () => sfx?.playWhoosh() },       // 0-4.5s: Problem (Park Full)
      { step: 2, delay: 4500, cb: () => sfx?.playWhoosh() },    // 4.5-8s: Empathy (Bowen Student)
      { step: 3, delay: 8000, cb: () => { sfx?.playWhoosh(); setTimeout(() => sfx?.playPing(), 1000); } }, // 8-14s: Reveal (Fixes it permanently)
      { step: 4, delay: 14000, cb: () => { sfx?.playWhoosh(); setTimeout(() => sfx?.playPing(), 800); } }, // 14-19s: Solution (Book night before)
      { step: 5, delay: 19000, cb: () => sfx?.playWhoosh() },   // 19-24s: Value Prop
      { step: 6, delay: 24000, cb: () => sfx?.playWhoosh() },   // 24-30s: CTA
      { step: 7, delay: 30000 },   // End
    ]

    const timeouts = timeline.map(t => 
      setTimeout(() => {
        setStep(t.step);
        if (t.cb) t.cb();
      }, t.delay)
    )

    return () => timeouts.forEach(clearTimeout)
  }, [isPlaying])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      {!isPlaying && (
        <div className="absolute inset-0 bg-background/80 z-50 flex flex-col items-center justify-center gap-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Bowen Specific Render</h1>
          <p className="text-gray-400 max-w-md text-center text-lg">
            Turn your volume up. Click play, then immediately start screen recording.
          </p>
          <button 
            onClick={handlePlay}
            className="px-8 py-4 bg-orange-500 text-foreground font-bold rounded-xl hover:bg-orange-600 hover:scale-105 transition-all shadow-[0_0_40px_rgba(249,115,22,0.4)]"
          >
            Start Render Sequence
          </button>
        </div>
      )}

      <div 
        className="relative bg-[#050505] overflow-hidden"
        style={{ width: '400px', height: '711px', border: '1px solid #111' }}
      >
        <AnimatePresence mode="wait">
          
          {/* STEP 1: THE REAL PROBLEM (0-4.5s) */}
          {step === 1 && (
            <motion.div 
              key="step1"
              exit={{ opacity: 0, scale: 2, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: "anticipate" }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background px-6 text-center"
            >
              <KineticText text="The park is full. 🚌" className="text-4xl font-bold mb-6 text-gray-300" delay={0.2} />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                <KineticText text="No cab in sight. 👀" className="text-4xl font-bold mb-6 text-gray-400" delay={1.6} />
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.0 }}>
                <KineticText text="Test starts in 20 mins." className="text-5xl font-black text-red-500" color="text-red-500" delay={3.1} />
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: EMPATHY (4.5-8s) */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ x: '-100%', skewX: -15, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background px-8 text-center"
            >
              <KineticText text="This has happened to" className="text-4xl font-bold mb-4 text-gray-300" delay={0.2} />
              <KineticText text="EVERY" className="text-6xl font-black text-foreground mb-4" delay={0.8} />
              <KineticText text="Bowen student." className="text-4xl font-bold text-orange-500" color="text-orange-500" delay={1.2} />
            </motion.div>
          )}

          {/* STEP 3: THE REVEAL (8-14s) */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ x: '100%', skewX: 15, filter: "blur(10px)" }}
              animate={{ x: 0, skewX: 0, filter: "blur(0px)" }}
              exit={{ y: '100%', scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center pt-12 bg-gradient-to-b from-[#111] to-[#000]"
              style={{ perspective: 1500 }}
            >
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-3xl font-bold text-foreground mb-2 z-20 drop-shadow-xl text-center px-4"
              >
                <span className="text-orange-500">TOVEDROP</span> fixes it
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-3xl font-black text-foreground mb-8 z-20 drop-shadow-xl text-center px-4"
              >
                permanently.
              </motion.div>
              
              <div className="relative w-64 h-[450px]">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [0.8, 2] }}
                  transition={{ delay: 1, duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-[40px] bg-transparent border-[3px] border-orange-500 shadow-[0_0_30px_#F97316]"
                />
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0], scale: [0.9, 2.5] }}
                  transition={{ delay: 1.5, duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-[40px] bg-transparent border-2 border-orange-400 shadow-[0_0_50px_#F97316]"
                />

                <motion.div 
                  className="w-full h-full bg-background rounded-[40px] border-[10px] border-gray-900 overflow-hidden relative z-10 shadow-[0_20px_60px_rgba(249,115,22,0.3)]"
                  initial={{ y: '100vh', rotateX: 45, rotateY: 20, rotateZ: -10, scale: 0.6 }}
                  animate={{ y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 70, damping: 15, mass: 1.5 }}
                >
                  <img src="/ad-assets/landing.png" className="w-full h-[120%] object-cover object-top" alt="Landing" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: THE SOLUTION (14-19s) */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 1.2, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ x: '-100%', filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="absolute inset-0 flex flex-col items-center pt-16 bg-[#050505]"
              style={{ perspective: 1200 }}
            >
              <KineticText text="Book your ride" className="text-3xl font-bold mb-2 text-foreground z-20" delay={0.2} />
              <KineticText text="the night before 🌙" className="text-3xl font-black text-orange-500 mb-8 z-20" color="text-orange-500" delay={1.0} />
              
              <div className="relative w-64 h-[450px]">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [1, 2.5] }}
                  transition={{ delay: 0.8, duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-orange-500/20 blur-xl"
                />

                <motion.div 
                  className="w-full h-full bg-background rounded-[40px] border-[10px] border-gray-900 overflow-hidden relative z-10"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", damping: 20 }}
                >
                  <img src="/ad-assets/book_ride.png" className="w-full h-full object-cover object-left-top" alt="Book Ride" />
                  
                  <div className="absolute top-[55%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                    <motion.div 
                      animate={{ scale: [1, 4], opacity: [0.9, 0] }}
                      transition={{ delay: 0.8, repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      className="w-10 h-10 rounded-full border-4 border-orange-500 absolute -top-5 -left-5"
                    />
                    <div className="w-4 h-4 bg-orange-500 rounded-full relative z-10 shadow-[0_0_20px_#f97316]" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: VALUE PROP (19-24s) */}
          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 1.5, rotate: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 0.8, type: "spring" }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-orange-700 to-orange-500 p-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", damping: 10 }}
                className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border border-white/40 shadow-2xl"
              >
                <span className="text-5xl">🛡️</span>
              </motion.div>
              <KineticText text="Your trusted ride," className="text-4xl font-black text-foreground leading-tight mb-2 tracking-tight" delay={0.6} />
              <KineticText text="perfectly organized." className="text-4xl font-black text-foreground leading-tight mb-8 tracking-tight" delay={1.5} />
            </motion.div>
          )}

          {/* STEP 6: CTA (24-30s) */}
          {step === 6 && (
            <motion.div 
              key="step6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background p-8 relative overflow-hidden"
            >
              <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15)_0%,rgba(0,0,0,1)_70%)]" />

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="z-10 text-center"
              >
                <h1 className="text-6xl font-black text-foreground tracking-tighter mb-2 drop-shadow-2xl">
                  TOVE<span className="text-orange-500">DROP</span>
                </h1>
                <p className="text-orange-300 font-medium tracking-widest uppercase text-sm mb-16">
                  tovedrop.com
                </p>
              </motion.div>
              
              <motion.button 
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, type: "spring", damping: 12 }}
                whileHover={{ scale: 1.05 }}
                className="z-10 w-full py-5 bg-gradient-to-r from-orange-600 to-orange-500 text-foreground font-black uppercase tracking-wider rounded-2xl text-xl shadow-[0_10px_40px_rgba(249,115,22,0.5)] border border-orange-400/50"
              >
                Start Dropping 🚀
              </motion.button>
            </motion.div>
          )}

          {/* STEP 7: END */}
          {step === 7 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background flex items-center justify-center"
            >
              <p className="text-gray-700 text-sm font-medium tracking-widest uppercase">End of Render</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
