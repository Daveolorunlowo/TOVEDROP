'use client';

import React, { useEffect, useState } from 'react';
import { AlarmSounds } from '@/lib/alarm-sounds';
import { Bell, Clock } from 'lucide-react';

interface Trip {
  id: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  rider: {
    name?: string | null;
  };
}

interface AlarmModalProps {
  trip: Trip;
  minutesBefore: number;
  alarmSound: string;
  alarmVibrate: boolean;
  onDismiss: () => void;
  onSnooze?: () => void;
}

export function AlarmModal({
  trip,
  minutesBefore,
  alarmSound,
  alarmVibrate,
  onDismiss,
  onSnooze
}: AlarmModalProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const isUrgent = minutesBefore <= 2;
  const isWarning = minutesBefore === 10;
  const isInfo = minutesBefore >= 30;

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    let isActive = true;

    // Wake lock
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err: any) {
        console.log(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    // Sound
    const playSound = async () => {
      try {
        if (alarmSound === 'loud') {
          await AlarmSounds.loud();
        } else if (isUrgent) {
          await AlarmSounds.urgent();
        } else if (isWarning) {
          await AlarmSounds.default();
        } else {
          await AlarmSounds.gentle();
        }
      } catch (err) {
        console.error('Failed to play alarm sound', err);
      }
    };
    
    playSound();

    // Vibration
    if (alarmVibrate && 'vibrate' in navigator) {
      try {
        if (isInfo) navigator.vibrate([200, 100, 200]);
        if (isWarning) navigator.vibrate([300, 100, 300, 100, 300]);
        if (isUrgent) navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
      } catch (e) {
        console.log("Vibration not supported or prevented");
      }
    }

    const scheduledAt = new Date(`${trip.date}T${trip.time}`).getTime();

    // Countdown Timer
    const updateTime = () => {
      if (!isActive) return;
      const now = Date.now();
      let diff = scheduledAt - now;
      if (diff < 0) diff = 0;
      
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    
    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, [trip, minutesBefore, alarmSound, alarmVibrate, isInfo, isWarning, isUrgent]);

  // Glow color
  const glowColor = isUrgent ? 'rgba(239, 68, 68, 0.4)' : 
                    isWarning ? 'rgba(249, 115, 22, 0.4)' : 
                    'rgba(168, 85, 247, 0.4)';

  const headerText = isUrgent ? 'YOUR RIDER IS WAITING' : 
                     isWarning ? 'RIDE IN 10 MINUTES' : 
                     'UPCOMING RIDE';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-[#111] text-white">
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      
      {/* Urgent red border */}
      {isUrgent && (
        <div className="absolute inset-0 border-[6px] border-red-500 animate-pulse pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-8">
        
        {isUrgent && (
          <h2 className="text-red-500 font-bold text-2xl tracking-widest animate-pulse">URGENT</h2>
        )}

        {/* Pulsing Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          <div className="bg-white/10 p-6 rounded-full backdrop-blur-md relative animate-[pulse_0.8s_ease-in-out_infinite]">
             <Clock className="w-16 h-16" />
          </div>
        </div>

        {/* Header Label */}
        <h3 className="text-xl font-bold tracking-[0.2em] text-center text-white/90">
          {headerText}
        </h3>

        {/* Timer */}
        <div className="text-[72px] leading-none font-mono font-bold tracking-tight">
          {timeLeft}
        </div>

        {/* Trip Details Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-md">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-white/50 text-sm">Rider</span>
            <span className="font-semibold text-white/90">
              {trip.rider?.name?.split(' ')[0] || 'Guest'}
            </span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-white/50 text-sm">Pickup</span>
            <span className="font-medium text-right max-w-[200px] truncate">
              {trip.pickup}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-white/50 text-sm">Destination</span>
            <span className="font-medium text-right max-w-[200px] truncate">
              {trip.destination}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-white/50 text-sm">Scheduled</span>
            <span className="font-semibold text-emerald-400">
              {trip.time}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-4">
          <button
            onClick={onDismiss}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg transition-colors active:scale-[0.98]"
          >
            ✓ I'm on my way
          </button>
          
          {!isUrgent && onSnooze && (
            <button
              onClick={onSnooze}
              className="w-full border border-white/20 hover:bg-white/10 text-white/90 font-medium py-3 rounded-xl transition-colors active:scale-[0.98]"
            >
              Snooze · 5 min
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
