'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldAlert, PhoneCall, X, AlertTriangle } from 'lucide-react'

export function SosModal({ trip, onClose }: { trip: any, onClose: () => void }) {
  const [sirenActive, setSirenActive] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Web Audio API Siren Generator
  const startSiren = () => {
    if (sirenActive) return
    setSirenActive(true)

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioCtxRef.current = ctx

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'square'
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Max volume
    gainNode.gain.setValueAtTime(1, ctx.currentTime)
    osc.start()

    oscRef.current = osc
    gainRef.current = gainNode

    // Modulate frequency to create a classic siren wail
    let high = true
    intervalRef.current = setInterval(() => {
      if (!audioCtxRef.current) return
      if (high) {
        osc.frequency.setValueAtTime(1200, audioCtxRef.current.currentTime)
      } else {
        osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime)
      }
      high = !high
    }, 400) // Alternate every 400ms
  }

  const stopSiren = () => {
    setSirenActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (oscRef.current) {
      oscRef.current.stop()
      oscRef.current.disconnect()
    }
    if (gainRef.current) gainRef.current.disconnect()
    if (audioCtxRef.current) audioCtxRef.current.close()
    
    oscRef.current = null
    gainRef.current = null
    audioCtxRef.current = null
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSiren()
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-sm rounded-3xl p-6 text-center transition-colors duration-300 ${
          sirenActive ? 'bg-red-600 animate-pulse' : 'bg-card'
        }`}
      >
        <div className="flex justify-end mb-2">
          <button 
            onClick={() => {
              stopSiren()
              onClose()
            }}
            className={`p-2 rounded-full ${sirenActive ? 'bg-red-700 text-white' : 'bg-muted text-muted-foreground'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${sirenActive ? 'bg-red-700' : 'bg-red-500/20'}`}>
            <AlertTriangle className={`w-12 h-12 ${sirenActive ? 'text-white' : 'text-red-500'}`} />
          </div>
        </div>

        <h2 className={`text-2xl font-black mb-2 uppercase tracking-widest ${sirenActive ? 'text-white' : 'text-foreground'}`}>
          Emergency
        </h2>
        <p className={`text-sm mb-8 ${sirenActive ? 'text-red-100 font-medium' : 'text-muted-foreground'}`}>
          If you feel unsafe, you can trigger a loud alarm to attract attention, or call Campus Security immediately.
        </p>

        <div className="space-y-4">
          <button
            onClick={sirenActive ? stopSiren : startSiren}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 ${
              sirenActive 
                ? 'bg-black text-white hover:bg-gray-900 border-2 border-red-500' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
            {sirenActive ? 'STOP ALARM' : 'SOUND LOUD ALARM'}
          </button>

          <a
            href="tel:08000000000" // Replace with actual Bowen Security number
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 ${
              sirenActive ? 'bg-white text-red-600' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <PhoneCall className="w-6 h-6" />
            CALL CAMPUS SECURITY
          </a>
        </div>

        <div className="mt-8">
          <p className={`text-xs ${sirenActive ? 'text-red-200' : 'text-muted-foreground'}`}>
            Trip ID: <span className="font-mono">{trip.id.slice(0, 8)}</span>
          </p>
          <p className={`text-xs ${sirenActive ? 'text-red-200' : 'text-muted-foreground'}`}>
            Driver: {trip.driver?.name ?? 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  )
}
