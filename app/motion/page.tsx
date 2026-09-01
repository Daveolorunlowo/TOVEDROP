'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Tone from 'tone'

// --- Glitch Kinetic Text Helper ---
const KineticText = ({ text, className = "", delay = 0, color = "text-white" }: { text: string, className?: string, delay?: number, color?: string }) => {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: delay * i },
    }),
  };

  const child: any = {
    hidden: { opacity: 0, skewX: 60, scaleY: 0.2, filter: "blur(20px)", y: 50 },
    glitch: { opacity: 1, skewX: -30, scaleY: 1.5, filter: "blur(5px)", y: -10 },
    visible: {
      opacity: 1, skewX: 0, scaleY: 1, filter: "blur(0px)", y: 0,
      transition: { type: "spring", damping: 15, stiffness: 300 },
    },
  };

  return (
    <motion.div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", overflow: "visible", gap: "0.2em" }} variants={container} initial="hidden" animate="visible" className={className}>
      {words.map((word, index) => {
        const isLast = index === words.length - 1;
        return (
          <motion.span 
            variants={child} 
            key={index} 
            className={`${color} ${isLast ? 'font-serif italic font-light' : 'font-sans font-black tracking-tighter'} px-1`} 
            style={{ display: "inline-block", transformOrigin: "bottom" }}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
  );
};

// --- Cursor Component ---
const FakeCursor = ({ active, x, y }: { active: boolean, x: number | string, y: number | string }) => {
  return (
    <motion.div 
      initial={{ x: '150%', y: '150%', opacity: 0 }}
      animate={active ? { x, y, opacity: 1 } : { x: '150%', y: '150%', opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="absolute z-50 pointer-events-none drop-shadow-2xl"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 3.21V20.8C5.5 21.43 6.24 21.78 6.72 21.36L11.44 17.27C11.66 17.08 11.95 16.98 12.25 16.98H18.5C19.12 16.98 19.46 16.24 19.04 15.78L6.54 2.15C6.11 1.68 5.5 1.99 5.5 2.62V3.21Z" fill="white" stroke="black" strokeWidth="1.5"/>
      </svg>
    </motion.div>
  )
}


// --- Main Sequence Component ---
export default function MotionAd() {
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [clockText, setClockText] = useState("7:44:57 AM")
  const [formState, setFormState] = useState({ pickup: "", dest: "", date: "", time: "", c1: false, c2: false, c3: false, c4: false })
  
  // Audio Refs
  const synths = useRef<any>({})
  const bgMusic = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    bgMusic.current = new Audio("/ad-assets/brenawales-us-drill-beat-instrumental-160399.mp3")
    bgMusic.current.loop = true
    bgMusic.current.volume = 0.5
    return () => {
      Tone.Transport.stop()
      bgMusic.current?.pause()
    }
  }, [])

  const initAudio = async () => {
    await Tone.start()
    bgMusic.current?.play()
    if (synths.current.initialized) return;
    synths.current.initialized = true;
    
    synths.current.tick = new Tone.MetalSynth({ frequency: "C5", envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 } as any).toDestination()
    synths.current.tick.volume.value = -28 
    
    synths.current.drone = new Tone.FMSynth({ harmonicity: 0.5, modulationIndex: 10, oscillator: { type: "sine" }, modulation: { type: "triangle" } }).toDestination()
    synths.current.drone.volume.value = -22 
    
    synths.current.thud1 = new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 4, oscillator: { type: "sine" } }).toDestination()
    synths.current.thud1.volume.value = -6 
    
    synths.current.thud2 = new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 4, oscillator: { type: "sine" } }).toDestination()
    synths.current.thud2.volume.value = -8 
    
    synths.current.piano = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.05, decay: 0.8, sustain: 0, release: 1 } }).toDestination()
    synths.current.piano.volume.value = -20 
    
    synths.current.ui = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination()
    synths.current.ui.volume.value = -24 
    
    synths.current.chord = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 0.2, decay: 1, sustain: 0.8, release: 2 } }).toDestination()
    synths.current.chord.volume.value = -16 
    
    synths.current.beepWrong = new Tone.Synth({ oscillator: { type: "square" }, envelope: { decay: 0.1 } }).toDestination()
    synths.current.beepWrong.volume.value = -28 
    
    synths.current.beepRight = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { decay: 0.1 } }).toDestination()
    synths.current.beepRight.volume.value = -24 
    
    synths.current.whoosh = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.5, decay: 0.1, sustain: 0 } }).toDestination()
    synths.current.whoosh.volume.value = -15
    
    // Set BPM for 0.9x speed
    Tone.Transport.bpm.value = 108
  }

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms / 0.9))

  const typeText = async (text: string, field: keyof typeof formState, checkField: keyof typeof formState) => {
    let current = ""
    for (let i = 0; i < text.length; i++) {
      current += text[i]
      setFormState(prev => ({ ...prev, [field]: current }))
      await wait(20)
    }
    setFormState(prev => ({ ...prev, [checkField]: true }))
    synths.current.ui.triggerAttackRelease("C5", "16n", Tone.now())
    await wait(80)
    synths.current.ui.triggerAttackRelease("E5", "16n", Tone.now())
    await wait(150)
  }

  const runSequence = async () => {
    setIsPlaying(true)
    await initAudio()

    // --- SCENE 1 (0-3s) ---
    setStep(1)
    synths.current.drone.triggerAttack("Eb1", Tone.now())
    for (let i = 0; i < 3; i++) {
      setClockText(`7:44:${57 + i} AM`)
      synths.current.tick.triggerAttackRelease("C5", "32n", Tone.now())
      await wait(1000)
    }

    // --- SCENE 2 (3-9s) - HIGH CONTRAST GLITCHES ---
    setStep(2)
    synths.current.thud1.triggerAttackRelease("E2", "8n", Tone.now() + 0.1)
    synths.current.thud2.triggerAttackRelease("C2", "8n", Tone.now() + 0.8)
    await wait(2000) 
    
    setStep(2.1)
    synths.current.thud1.triggerAttackRelease("E1", "8n", Tone.now())
    await wait(2000)

    setStep(2.2)
    synths.current.thud2.triggerAttackRelease("C1", "8n", Tone.now())
    await wait(1500)

    synths.current.drone.triggerRelease(Tone.now())
    setStep(2.5) 
    await wait(500) 

    // --- SCENE 3 (9-13s) ---
    setStep(3)
    await wait(1500) 
    setStep(3.5) 
    synths.current.piano.triggerAttackRelease("G4", "8n", Tone.now())
    await wait(2000)

    // --- SCENE 3.6 (13-17s) - NEW MORPHING SEQUENCE ---
    // Smooth grid intro
    setStep(3.6)
    synths.current.whoosh.triggerAttackRelease("8n", Tone.now())
    await wait(1000)
    
    // Logo morphs into Pill
    setStep(3.7)
    synths.current.ui.triggerAttackRelease("C6", "16n", Tone.now())
    await wait(500)

    setStep(3.71)
    synths.current.ui.triggerAttackRelease("D6", "16n", Tone.now())
    await wait(500)

    setStep(3.72)
    synths.current.ui.triggerAttackRelease("E6", "16n", Tone.now())
    await wait(500)

    setStep(3.73)
    synths.current.ui.triggerAttackRelease("G6", "16n", Tone.now())
    await wait(800)

    // Pill expands into UI Card
    setStep(3.8)
    synths.current.chord.triggerAttackRelease(["C4", "E4", "G4"], "4n", Tone.now())
    await wait(800)

    // --- SCENE 4 (17-26s) - APP UI ---
    setStep(4)
    await wait(500) 
    
    const t = new Date(); t.setDate(t.getDate()+1);
    const tomorrowStr = t.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    
    await typeText("UPE 3", 'pickup', 'c1')
    await typeText("Chapel", 'dest', 'c2')
    await typeText(tomorrowStr, 'date', 'c3')
    await typeText("07:30 AM", 'time', 'c4')
    
    await wait(200)
    setStep(4.5) // Cursor moves in
    await wait(600)
    setStep(4.6) // Cursor clicks!
    synths.current.chord.triggerAttackRelease(["C4", "E4", "G4"], "1n", Tone.now())
    await wait(200)
    setStep(4.7) // Result card
    await wait(2500)

    // --- SCENE 5 (26-30s) ---
    setStep(5)
    await wait(500) 
    
    for (let i = 1; i <= 4; i++) {
      setStep(5 + (i * 0.1)) 
      synths.current.beepWrong.triggerAttackRelease("Bb3", "16n", Tone.now())
      await wait(150)
      setStep(5 + (i * 0.1) + 0.05) 
      synths.current.beepRight.triggerAttackRelease("D5", "16n", Tone.now())
      await wait(400)
    }
    await wait(1000)

    // --- SCENE 6 (30-34s) ---
    setStep(6) 
    synths.current.chord.triggerAttackRelease(["F3", "A3", "C4", "E4"], "2n", Tone.now())
    await wait(3500)

    // --- SCENE 7 (34-38s) ---
    setStep(7) 
    synths.current.chord.triggerAttack(["C4", "E4", "G4", "B4"], Tone.now())
    synths.current.chord.volume.rampTo(-100, 3)
    await wait(3000)
    synths.current.chord.releaseAll(Tone.now())
    setStep(8)
  }

  const particles = Array.from({ length: 30 }).map(() => ({
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 600,
    scale: Math.random() * 2 + 0.5,
    delay: Math.random() * 1
  }))

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-0 md:p-4 overflow-hidden font-sans">
      {!isPlaying && (
        <div className="absolute inset-0 bg-[#050505]/95 z-50 flex flex-col items-center justify-center backdrop-blur-xl">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-300 mb-4 tracking-tighter">TOVEDROP AD ENGINE</h1>
          <p className="text-gray-400 mb-8 font-light tracking-widest uppercase text-sm">Volume Up. Press Start. Record.</p>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={runSequence} 
            className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all"
          >
            INITIALIZE RENDER
          </motion.button>
        </div>
      )}

      {/* Responsive Canvas (16:9 or 9:16) */}
      <div className="relative bg-[#020202] overflow-hidden w-full h-[100dvh] md:w-[400px] md:h-[711px] md:border-[1px] md:border-gray-800 md:rounded-[40px] shadow-2xl" style={{ perspective: "1500px" }}>
        <AnimatePresence mode="wait">

          {/* SCENE 1 (0-3s) - CINEMATIC INTRO */}
          {step === 1 && (
            <motion.div key="s1" exit={{ opacity: 0, filter: "blur(20px)" }} transition={{ duration: 1.2, ease: "easeInOut" }} className="absolute inset-0 flex flex-col items-center justify-center relative overflow-hidden bg-black">
              
              {/* Cinematic Grain & Vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] z-0" />
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1.05, opacity: 1 }} 
                transition={{ duration: 4, ease: "linear" }}
                className="z-10 flex flex-col items-center justify-center"
              >
                <div className="font-serif text-6xl font-light italic text-white tracking-[0.05em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{clockText}</div>
                
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 150, opacity: 1 }} transition={{ delay: 2.5, duration: 1.5, ease: "easeInOut" }} className="h-[1px] bg-red-600 mt-8 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                
                <motion.div initial={{ opacity: 0, y: 10, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 3, duration: 1, ease: "easeOut" }} className="text-red-500 font-sans font-bold tracking-[0.4em] mt-6 text-[10px] uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  Test starts in 1 minute
                </motion.div>
              </motion.div>

              {/* Cinematic Letterboxing */}
              <motion.div initial={{ height: "50%" }} animate={{ height: "15%" }} transition={{ duration: 1.5, ease: "circOut" }} className="absolute top-0 left-0 right-0 bg-black z-20" />
              <motion.div initial={{ height: "50%" }} animate={{ height: "15%" }} transition={{ duration: 1.5, ease: "circOut" }} className="absolute bottom-0 left-0 right-0 bg-black z-20" />
            </motion.div>
          )}

          {/* SCENE 2 (3-9s) - HIGH CONTRAST GLITCHES */}
          {(step >= 2 && step <= 2.5) && (
            <motion.div key="s2" exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden bg-black">
              <AnimatePresence mode="wait">
                {step === 2 && (
                  <motion.div key="s2a" exit={{ opacity: 0, filter: "blur(10px)" }} className="flex flex-col items-center justify-center h-full w-full px-6 bg-black">
                     <KineticText text="Park is full." className="text-5xl" color="text-white" />
                  </motion.div>
                )}
                
                {step === 2.1 && (
                  <motion.div key="s2b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} className="flex flex-col items-center justify-center h-full w-full px-6 bg-white">
                     <KineticText text="No cab anywhere." className="text-5xl" color="text-black" />
                  </motion.div>
                )}

                {step === 2.2 && (
                  <motion.div key="s2c" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }} transition={{ type: "spring", damping: 20, stiffness: 100 }} className="flex flex-col items-center justify-center h-full w-full px-6 bg-red-600">
                     <motion.div 
                        initial={{ skewX: 50, filter: "blur(20px)", scale: 0.9 }}
                        animate={{ skewX: 0, filter: "blur(0px)", scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="text-white text-4xl font-sans font-black tracking-tighter text-center uppercase drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                     >
                       You're going to be late.
                     </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SCENE 3 (9-13s) */}
          {(step >= 3 && step < 3.6) && (
            <motion.div key="s3" exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: 0.5 }} className={`absolute inset-0 flex items-center justify-center p-4 overflow-hidden transition-colors duration-300 ${step === 3.5 ? 'bg-gray-100' : 'bg-black'}`}>
              <AnimatePresence mode="wait">
                {step === 3 ? (
                  <motion.div key="s3a" exit={{ opacity: 0, y: -30, filter: "blur(10px)" }} transition={{ duration: 0.4 }}>
                    <KineticText text="What if you booked it last night?" delay={0.05} className="text-2xl text-center" color="text-gray-300" />
                  </motion.div>
                ) : (
                  <motion.div key="s3b" initial={{ scale: 0.5, filter: "blur(20px)", opacity: 0 }} animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 250 }} className="text-center z-10">
                    <div className="text-5xl text-black leading-tight">
                      <span className="font-sans font-black tracking-tighter">Book it </span>
                      <br/>
                      <span className="font-serif italic font-bold text-orange-600">tonight.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SCENE 3.6 - MORPHING SEQUENCE (13-17s) */}
          {(step >= 3.6 && step < 4) && (
            <motion.div key="smorph" className="absolute inset-0 bg-gray-100 flex items-center justify-center overflow-hidden">
              {/* Technical Grid Background */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="techgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#techgrid)" />
                {step === 3.6 && (
                  <>
                    <motion.line initial={{ y1: -500, y2: -500 }} animate={{ y1: 0, y2: 800 }} transition={{ duration: 1 }} x1="50%" x2="50%" stroke="black" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                    <motion.line initial={{ x1: -500, x2: -500 }} animate={{ x1: 0, x2: 800 }} transition={{ duration: 1 }} y1="50%" y2="50%" stroke="black" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                  </>
                )}
              </svg>

              <AnimatePresence mode="wait">
                {step === 3.6 && (
                  <motion.div 
                    key="logo-state"
                    initial={{ scale: 0, rotate: -45, filter: "blur(20px)" }}
                    animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
                    exit={{ scale: 0.2, filter: "blur(30px)", opacity: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 150 }}
                    className="w-24 h-24 bg-orange-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(234,88,12,0.4)] relative z-10"
                  >
                    <img src="/icon.svg" alt="Tovedrop Logo" className="w-12 h-12 brightness-0 invert drop-shadow-md" />
                  </motion.div>
                )}

                {(step >= 3.7 && step < 3.8) && (
                  <motion.div 
                    key="pill-state"
                    layoutId="morph-container"
                    initial={{ scaleX: 0.1, scaleY: 2, filter: "blur(30px)", opacity: 0, backgroundColor: "#ea580c" }}
                    animate={{ scaleX: 1, scaleY: 1, filter: "blur(0px)", opacity: 1, backgroundColor: "#ea580c" }} // Orange pill
                    exit={{ scale: 5, filter: "blur(20px)", opacity: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 250 }}
                    className="w-56 h-16 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,88,12,0.4)] relative z-10 overflow-hidden"
                  >
                    <AnimatePresence>
                      {step === 3.7 && <motion.span key="fast" initial={{ y: 30, opacity: 0, filter: "blur(5px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -30, opacity: 0, filter: "blur(5px)" }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="absolute text-white font-serif italic font-bold text-3xl">Fast</motion.span>}
                      {step === 3.71 && <motion.span key="org" initial={{ y: 30, opacity: 0, filter: "blur(5px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -30, opacity: 0, filter: "blur(5px)" }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="absolute text-white font-serif italic font-bold text-3xl">Organized</motion.span>}
                      {step === 3.72 && <motion.span key="easy" initial={{ y: 30, opacity: 0, filter: "blur(5px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -30, opacity: 0, filter: "blur(5px)" }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="absolute text-white font-serif italic font-bold text-3xl">Easy</motion.span>}
                      {step === 3.73 && <motion.span key="rel" initial={{ y: 30, opacity: 0, filter: "blur(5px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -30, opacity: 0, filter: "blur(5px)" }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="absolute text-white font-serif italic font-bold text-3xl">Reliable</motion.span>}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SCENE 4 (17-26s) - AUTHENTIC APP UI WITH SIMULATED CURSOR */}
          {(step >= 4 && step < 5) && (
            <motion.div key="s4" initial={{ filter: "blur(20px)", opacity: 0, scale: 0.9 }} animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 pb-10 overflow-hidden">
              
              <motion.div 
                layout
                layoutId="morph-container"
                initial={{ y: 50, opacity: 0, scale: 0.95 }} 
                animate={step >= 4.7 ? { y: 0, width: "100%", height: "100%", borderRadius: 0, scale: 1, padding: 32, justifyContent: "center" } : { y: 0, opacity: 1, scale: 1, width: "90%", borderRadius: 32, padding: 24 }} 
                transition={{ type: "spring", stiffness: 200, damping: 25 }} 
                className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200 relative z-10 flex flex-col gap-5 overflow-hidden md:max-w-[400px]"
              >
                <AnimatePresence mode="popLayout">
                  {step < 4.7 ? (
                    <motion.div 
                      key="booking-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-5 w-full"
                    >
                      <div className="text-3xl font-sans font-black text-black tracking-tighter">Book a Ride</div>

                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl relative transition-colors duration-300">
                        <div className="text-[11px] text-gray-500 font-sans font-medium uppercase tracking-wider mb-2">Pickup Location</div>
                        <div className="font-sans font-black text-base text-black min-h-[24px] flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-3 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          {!formState.pickup ? <motion.div className="w-24 h-4 bg-gray-200 rounded-md animate-pulse" /> : formState.pickup}
                        </div>
                        {formState.c1 && <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">✓</motion.div>}
                      </motion.div>

                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl relative transition-colors duration-300">
                        <div className="text-[11px] text-gray-500 font-sans font-medium uppercase tracking-wider mb-2">Dropoff Location</div>
                        <div className="font-sans font-black text-base text-black min-h-[24px] flex items-center">
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-3 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                          {!formState.dest ? <motion.div className="w-32 h-4 bg-gray-200 rounded-md animate-pulse" /> : formState.dest}
                        </div>
                        {formState.c2 && <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">✓</motion.div>}
                      </motion.div>

                      <div className="flex gap-4">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl relative flex-1 flex flex-col items-center justify-center">
                          <div className="text-[11px] text-gray-500 font-sans font-medium uppercase tracking-wider mb-2 text-center">Date</div>
                          <div className="font-sans font-black text-base text-black min-h-[24px] flex items-center justify-center w-full text-center">
                            {!formState.date ? <motion.div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse" /> : formState.date}
                          </div>
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl relative flex-1 flex flex-col items-center justify-center">
                          <div className="text-[11px] text-gray-500 font-sans font-medium uppercase tracking-wider mb-2 text-center">Time</div>
                          <div className="font-sans font-black text-base text-black min-h-[24px] flex items-center justify-center w-full text-center">
                            {!formState.time ? <motion.div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse" /> : formState.time}
                          </div>
                        </motion.div>
                      </div>

                      <motion.div 
                        initial={{ y: 20, opacity: 0 }} 
                        animate={step >= 4.6 ? { scale: 0.95, backgroundColor: "#000", y: 0, opacity: 1 } : { scale: 1, backgroundColor: "#ea580c", y: 0, opacity: 1 }} 
                        transition={{ delay: 0.5, type: "spring" }}
                        className="py-4 rounded-2xl text-white font-sans font-black tracking-tight text-center mt-2 text-lg relative overflow-hidden transition-colors"
                      >
                        <span className="relative z-10">Book Ride</span>
                        {step >= 4.6 && <motion.div initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="absolute inset-0 bg-white/40 rounded-2xl z-0 pointer-events-none" style={{ originX: "50%", originY: "50%" }} />}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="success-state"
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.1 }} 
                      className="flex flex-col items-center justify-center h-full w-full bg-white z-20"
                    >
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      </motion.div>
                      
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-3xl text-black font-sans font-black tracking-tight mb-2 text-center">Ride Confirmed</motion.div>
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-500 font-medium text-center px-4 mb-10">Your driver is on the way to UPE 3.</motion.div>

                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", delay: 0.5, damping: 15 }} className="w-full bg-gray-50 rounded-3xl p-6 border border-gray-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Taiwo&backgroundColor=ea580c`} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-black font-sans font-black text-2xl tracking-tight truncate">Taiwo Adeleke</div>
                            <div className="text-orange-600 font-sans font-bold text-sm mt-1 flex items-center gap-2">
                              ★ 4.9 <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0"></span> <span className="text-gray-500 font-medium truncate">Toyota Corolla</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Fake Cursor interaction */}
              <FakeCursor active={step >= 4.5 && step < 4.7} x="50%" y="68%" />
            </motion.div>
          )}

          {/* SCENE 5 (26-30s) */}
          {(step >= 5 && step < 6) && (
            <motion.div key="s5" exit={{ opacity: 0, filter: "blur(20px)" }} className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 w-full transition-colors duration-300">
              <div className="flex w-full max-w-[400px] justify-between gap-8 z-10 relative">
                
                {/* Left Column */}
                <div className="flex-1">
                  <div className="text-red-500 font-sans font-black tracking-tighter text-sm mb-8">Without TOVEDROP</div>
                  <div className="space-y-8">
                    {[
                      "7:45 AM — Rushing",
                      "Park full — no cab",
                      "Walking 40 mins",
                      "Miss test. Fail."
                    ].map((text, i) => (
                      <motion.div key={i} initial={{ opacity: 0, skewX: 50, filter: "blur(10px)" }} animate={step >= 5.1 + (i * 0.1) ? { opacity: 1, skewX: 0, filter: "blur(0px)" } : { opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="text-gray-400 font-sans font-medium text-sm relative">
                        {text}
                        <motion.div initial={{ width: 0 }} animate={step >= 5.1 + (i * 0.1) ? { width: '110%' } : { width: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-1/2 -left-2 h-[2px] bg-red-600 rounded-full" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex-1">
                  <div className="text-white font-sans font-black tracking-tighter text-sm mb-8 bg-orange-600 inline-block px-2 rounded-sm transform rotate-2">With TOVEDROP</div>
                  <div className="space-y-8">
                    {[
                      "7:25 AM — In hostel",
                      "Driver confirmed",
                      "Picked up 7:30 AM",
                      "Early. Aced test."
                    ].map((text, i) => (
                      <motion.div key={i} initial={{ opacity: 0, skewX: -50, filter: "blur(10px)" }} animate={step >= 5.15 + (i * 0.1) ? { opacity: 1, skewX: 0, filter: "blur(0px)" } : { opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="text-white font-sans font-black text-sm flex items-center gap-3">
                        <motion.span initial={{ scale: 0, rotate: -180 }} animate={step >= 5.15 + (i * 0.1) ? { scale: 1, rotate: 0 } : { scale: 0 }} transition={{ type: "spring", damping: 12 }} className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px]">✓</motion.span>
                        {text}
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* SCENE 6 (30-34s) */}
          {(step === 6) && (
            <motion.div key="s6" exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 bg-white flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ delay: 0.2, type: "spring", damping: 15 }} className="text-center z-10">
                    <div className="text-black text-7xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        <span className="text-black">TOVE</span>
                        <span className="text-orange-600">DROP</span>
                    </div>
                </motion.div>
              </div>
              
              <motion.div initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.8, type: "spring" }} className="absolute bottom-24 text-center w-full z-10">
                <div className="text-black text-4xl leading-tight">
                  <span className="font-sans font-black tracking-tighter">Book </span>
                  <span className="font-serif italic font-bold text-orange-600">tonight.</span>
                  <br/>
                  <span className="font-sans font-black tracking-tighter text-black">Ride tomorrow.</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* SCENE 7 (34-38s) - PREMIUM APP THEME */}
          {(step === 7) && (
            <motion.div key="s7" className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-6 overflow-hidden">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15)_0%,rgba(0,0,0,1)_70%)]" />

              <motion.div initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} transition={{ type: "spring", damping: 15 }} className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_40px_rgba(249,115,22,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] z-10 flex items-center justify-center">
                <img src="/icon.svg" alt="Tovedrop Logo" className="w-10 h-10 brightness-0 invert drop-shadow-md" />
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-orange-500 font-sans font-bold text-xs tracking-[0.2em] uppercase z-10 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">1 Drop = 1 Booking</motion.div>
              
              <motion.div initial={{ scale: 0, filter: "blur(10px)" }} animate={{ scale: 1, filter: "blur(0px)" }} transition={{ delay: 0.4, type: "spring", damping: 12, stiffness: 300 }} className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-full font-sans font-black text-lg z-10 shadow-[0_4px_24px_rgba(217,119,6,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer transform hover:scale-105 transition-all">
                Book a Ride
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </motion.div>
              
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
