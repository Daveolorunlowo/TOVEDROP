'use client';

import React, { useEffect, useState, useRef } from 'react';
import { startContinuousAlarm, AlarmController, unlockAudioContext, getAudioContext } from '@/lib/alarm-sounds';
import { Clock, Volume2, VolumeX, ShieldAlert, Navigation } from 'lucide-react';

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
  alarmSound?: string;
  alarmVibrate?: boolean;
  alarmDuration?: number; // duration in seconds (default: 60)
  onDismiss: () => void;
  onSnooze?: () => void;
}

export function AlarmModal({
  trip,
  minutesBefore,
  alarmSound = 'loud',
  alarmVibrate = true,
  alarmDuration = 60,
  onDismiss,
  onSnooze
}: AlarmModalProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [alarmRemaining, setAlarmRemaining] = useState<number>(alarmDuration);
  const [isSounding, setIsSounding] = useState<boolean>(true);
  const [needsGesture, setNeedsGesture] = useState<boolean>(false);
  const alarmControllerRef = useRef<AlarmController | null>(null);

  const isUrgent = minutesBefore <= 2;
  const isWarning = minutesBefore === 10;

  // Start continuous insanely loud alarm on mount
  useEffect(() => {
    let wakeLock: any = null;
    let isMounted = true;

    // 1. Keep mobile screen awake
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        console.log(`Wake Lock error: ${err?.message}`);
      }
    };
    requestWakeLock();

    // 2. Check if AudioContext is currently suspended by browser autoplay policy
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      setNeedsGesture(true);
    }

    // 3. Start continuous alarm playback
    const startAlarm = () => {
      if (!isMounted) return;
      unlockAudioContext();

      const controller = startContinuousAlarm({
        type: alarmSound || 'loud',
        duration: alarmDuration,
        vibrate: alarmVibrate,
        volumeBoost: true,
        onTick: (remaining) => {
          if (isMounted) setAlarmRemaining(remaining);
        },
        onStop: () => {
          if (isMounted) setIsSounding(false);
        }
      });

      alarmControllerRef.current = controller;
      setIsSounding(true);
      setNeedsGesture(false);
    };

    startAlarm();

    // 4. Trip Countdown timer calculation
    let scheduledAt = new Date(`${trip.date}T${trip.time}`).getTime();
    if (isNaN(scheduledAt)) {
      scheduledAt = new Date(`${trip.date} ${trip.time}`).getTime();
    }
    if (isNaN(scheduledAt)) {
      scheduledAt = new Date(trip.date).getTime();
    }

    const updateTime = () => {
      if (!isMounted) return;
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
      isMounted = false;
      clearInterval(intervalId);

      // Stop audio controller immediately on unmount
      if (alarmControllerRef.current) {
        alarmControllerRef.current.stop();
        alarmControllerRef.current = null;
      }

      if (wakeLock && typeof wakeLock.release === 'function') {
        wakeLock.release().catch(() => {});
      }
    };
  }, [trip, minutesBefore, alarmSound, alarmVibrate, alarmDuration]);

  // Handle dismiss: stop audio immediately and callback
  const handleDismiss = () => {
    if (alarmControllerRef.current) {
      alarmControllerRef.current.stop();
      alarmControllerRef.current = null;
    }
    setIsSounding(false);
    onDismiss();
  };

  // Handle snooze: stop audio immediately and callback
  const handleSnooze = () => {
    if (alarmControllerRef.current) {
      alarmControllerRef.current.stop();
      alarmControllerRef.current = null;
    }
    setIsSounding(false);
    if (onSnooze) onSnooze();
  };

  // Toggle audio mute without closing modal
  const handleToggleSound = () => {
    if (isSounding) {
      if (alarmControllerRef.current) {
        alarmControllerRef.current.stop();
        alarmControllerRef.current = null;
      }
      setIsSounding(false);
    } else {
      unlockAudioContext();
      alarmControllerRef.current = startContinuousAlarm({
        type: alarmSound || 'loud',
        duration: alarmRemaining > 0 ? alarmRemaining : 60,
        vibrate: alarmVibrate,
        volumeBoost: true,
        onTick: (rem) => setAlarmRemaining(rem),
        onStop: () => setIsSounding(false)
      });
      setIsSounding(true);
      setNeedsGesture(false);
    }
  };

  const glowColor = isUrgent
    ? 'rgba(239, 68, 68, 0.45)'
    : isWarning
    ? 'rgba(249, 115, 22, 0.45)'
    : 'rgba(234, 88, 12, 0.35)';

  const headerText = isUrgent
    ? 'RIDER IS WAITING FOR PICKUP'
    : isWarning
    ? 'RIDE IN 10 MINUTES'
    : 'UPCOMING CONFIRMED TRIP';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-xl text-foreground select-none overflow-y-auto"
      onClick={() => {
        if (needsGesture) {
          handleToggleSound();
        }
      }}
    >
      {/* Background Radial Siren Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 animate-pulse"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 75%)`
        }}
      />

      {/* Flashing Urgent Border */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          isUrgent
            ? 'border-[8px] border-red-500/80 animate-ping'
            : isSounding
            ? 'border-[5px] border-[var(--orange-brand)]/60 animate-pulse'
            : 'border border-border/40'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md gap-6 py-4">
        {/* Browser Audio Unlock Banner if device was asleep */}
        {needsGesture && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-bounce cursor-pointer"
          >
            <Volume2 className="w-4 h-4 animate-spin" />
            Tap Here To Blast Full Alarm Volume
          </button>
        )}

        {/* Alarm Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
              isUrgent
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[var(--orange-brand)] text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {isUrgent ? 'URGENT TRIP DEPARTURE' : 'INBUILT TRIP ALARM'}
          </span>

          {isSounding && alarmRemaining > 0 && (
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/80 border border-border">
              Ringing: {alarmRemaining}s
            </span>
          )}
        </div>

        {/* Pulsing Siren Icon with Dynamic Audio Waves */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="relative bg-card border-2 border-[var(--orange-brand)]/40 p-6 rounded-full shadow-2xl backdrop-blur-md">
            <Clock className="w-14 h-14 text-[var(--orange-brand)] animate-pulse" />
          </div>

          {/* Sound Mute/Unmute Quick Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            className="absolute -bottom-2 -right-2 p-2.5 rounded-full bg-background border border-border shadow-md hover:bg-muted text-foreground transition-all cursor-pointer"
            title={isSounding ? 'Silence Alarm Audio' : 'Unmute Alarm'}
          >
            {isSounding ? (
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Header Label */}
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-xl font-extrabold tracking-wider uppercase text-foreground/90">
            {headerText}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            High-volume alert active · Head to pickup point immediately
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="text-[64px] sm:text-[76px] leading-none font-mono font-black tracking-tight drop-shadow-md text-foreground">
          {timeLeft}
        </div>

        {/* Trip Details Card */}
        <div className="w-full bg-card/90 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center pb-2.5 border-b border-border/50">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Rider
            </span>
            <span className="font-bold text-sm text-foreground">
              {trip.rider?.name || 'Assigned Rider'}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4 pb-2.5 border-b border-border/50">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5">
              Pickup
            </span>
            <span className="font-semibold text-xs text-right text-foreground max-w-[240px] break-words">
              {trip.pickup}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4 pb-2.5 border-b border-border/50">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5">
              Destination
            </span>
            <span className="font-semibold text-xs text-right text-foreground max-w-[240px] break-words">
              {trip.destination}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Scheduled Departure
            </span>
            <span className="font-bold text-sm text-emerald-400">
              {trip.time} ({trip.date})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold py-4 px-6 rounded-xl text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Navigation className="w-5 h-5 fill-current" />
            ✓ I'm on my way (Silence Alarm)
          </button>

          {!isUrgent && onSnooze && (
            <button
              type="button"
              onClick={handleSnooze}
              className="w-full border border-border bg-card/60 hover:bg-muted active:scale-[0.98] text-foreground font-semibold py-3 px-6 rounded-xl text-sm transition-all cursor-pointer"
            >
              Snooze · Remind in 5 mins
            </button>
          )}

          {isSounding && (
            <button
              type="button"
              onClick={handleToggleSound}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline pt-1 cursor-pointer"
            >
              Mute alarm sound only (keep trip details on screen)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
