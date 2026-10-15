// Continuous High-Gain Inbuilt Alarm Audio Synthesizer for Tovedrop Drivers
// Designed for maximum acoustic penetration (insanely loud), dual-oscillator chorus,
// brickwall dynamics compression, and continuous looping playback.

export type AlarmSoundType = 'loud' | 'siren' | 'urgent' | 'default' | 'radar' | 'chime' | 'gentle';

export interface AlarmOptions {
  type?: AlarmSoundType | string;
  duration?: number; // duration in seconds (e.g., 60s), default 60
  vibrate?: boolean; // continuous haptic feedback alongside audio
  volumeBoost?: boolean; // maximum gain + dynamics limiter (default: true)
  onStop?: () => void;
  onTick?: (remainingSeconds: number) => void;
}

export interface AlarmController {
  stop: () => void;
  isPlaying: () => boolean;
  getRemainingSeconds: () => number;
}

// Active singleton alarm controller to prevent overlapping audio loops
let currentActiveAlarm: AlarmController | null = null;
let sharedAudioCtx: AudioContext | null = null;

// Safe retrieval and activation of browser AudioContext
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
}

// Auto-unlock AudioContext on first user interaction to satisfy browser autoplay policies
export function unlockAudioContext(): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };
  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
}

export function stopAllAlarms(): void {
  if (currentActiveAlarm) {
    try {
      currentActiveAlarm.stop();
    } catch (e) {
      // ignore
    }
    currentActiveAlarm = null;
  }
}

export function getCurrentAlarm(): AlarmController | null {
  return currentActiveAlarm;
}

/**
 * Starts continuous alarm playback with insanely high volume, dynamics compression,
 * multi-oscillator detuning, and optional repeating haptic vibrations.
 */
export function startContinuousAlarm(options: AlarmOptions = {}): AlarmController {
  if (typeof window === 'undefined') {
    return {
      stop: () => {},
      isPlaying: () => false,
      getRemainingSeconds: () => 0
    };
  }

  // Stop any previously playing alarm first
  stopAllAlarms();

  const type: AlarmSoundType = (options.type as AlarmSoundType) || 'loud';
  const duration = Math.max(5, options.duration ?? 60); // default 60 seconds
  const vibrate = options.vibrate ?? true;
  const volumeBoost = options.volumeBoost ?? true;

  const ctx = getAudioContext();
  if (!ctx) {
    return {
      stop: () => {},
      isPlaying: () => false,
      getRemainingSeconds: () => 0
    };
  }

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  let isRunning = true;
  let remainingSeconds = duration;
  let countdownTimer: any = null;
  let soundLoopTimer: any = null;
  let vibrationTimer: any = null;

  // Active audio nodes tracked for cleanup
  const activeNodes: (AudioNode | { stop: (time?: number) => void; disconnect: () => void })[] = [];

  // 1. MASTER DYNAMICS COMPRESSOR (Brickwall Loudness Maximizer)
  // Crushes transient peaks while pulling up low/mid body to hardware DAC ceiling
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-24, ctx.currentTime); // aggressive threshold
  compressor.knee.setValueAtTime(6, ctx.currentTime);
  compressor.ratio.setValueAtTime(20, ctx.currentTime); // heavy limiting ratio
  compressor.attack.setValueAtTime(0.003, ctx.currentTime); // instant transient catch
  compressor.release.setValueAtTime(0.08, ctx.currentTime); // fast recovery for sustained loudness

  // 2. MASTER GAIN STAGE (Insanely High Volume)
  // Multiplied output with smooth ramp-down on stop to avoid speaker popping
  const masterGain = ctx.createGain();
  const targetGain = volumeBoost ? 2.8 : 1.4; // 280% gain into limiter for extreme loudness
  masterGain.gain.setValueAtTime(targetGain, ctx.currentTime);

  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);
  activeNodes.push(compressor, masterGain);

  // 3. CONTINUOUS HAPTIC VIBRATION
  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const triggerVibe = () => {
      if (!isRunning) return;
      try {
        // High-intensity repeating pulse: 500ms buzz, 120ms gap, 500ms buzz, 120ms gap, 700ms buzz
        navigator.vibrate([500, 120, 500, 120, 700]);
      } catch (e) {
        // Ignore vibration errors
      }
    };
    triggerVibe();
    vibrationTimer = setInterval(triggerVibe, 2200);
  }

  // 4. SYNTHESIZER PATTERN GENERATOR
  // Loops continuously until stopped or duration expires
  const playPatternStep = () => {
    if (!isRunning || ctx.state === 'closed') return;
    const now = ctx.currentTime;

    switch (type) {
      case 'loud':
      case 'siren': {
        // ── EMERGENCY VEHICLE DUAL-TONE SIREN (Insanely Loud & Piercing) ──
        // High penetrating two-tone siren (880Hz / 1220Hz) alternating with detuned dual oscillators
        const cycleDuration = 0.5; // 500ms per hi-lo cycle

        // Oscillator 1: Primary Sawtooth
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.setValueAtTime(1220, now + 0.25);

        // Oscillator 2: Detuned Square (+5 Hz auditory beating for extreme psychoacoustic urgency)
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(885, now);
        osc2.frequency.setValueAtTime(1225, now + 0.25);

        // Oscillator 3: Sub-punch body
        const osc3 = ctx.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(440, now);
        osc3.frequency.setValueAtTime(610, now + 0.25);

        const stepGain = ctx.createGain();
        stepGain.gain.setValueAtTime(1.0, now);
        stepGain.gain.setValueAtTime(1.0, now + cycleDuration - 0.02);
        stepGain.gain.linearRampToValueAtTime(0.01, now + cycleDuration);

        osc1.connect(stepGain);
        osc2.connect(stepGain);
        osc3.connect(stepGain);
        stepGain.connect(compressor);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + cycleDuration);
        osc2.stop(now + cycleDuration);
        osc3.stop(now + cycleDuration);

        soundLoopTimer = setTimeout(playPatternStep, cycleDuration * 1000);
        break;
      }

      case 'urgent': {
        // ── RAPID STROBE COLLISION HORN (Triple Piercing High Beep) ──
        const frequencies = [1050, 1260, 1500];
        const beepLen = 0.09;
        const gap = 0.04;
        const totalBurst = frequencies.length * (beepLen + gap);

        frequencies.forEach((freq, idx) => {
          const beepStart = now + idx * (beepLen + gap);
          const osc = ctx.createOscillator();
          const oscDetune = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, beepStart);

          oscDetune.type = 'square';
          oscDetune.frequency.setValueAtTime(freq + 4, beepStart);

          gain.gain.setValueAtTime(0.001, beepStart);
          gain.gain.linearRampToValueAtTime(1.2, beepStart + 0.01);
          gain.gain.setValueAtTime(1.2, beepStart + beepLen - 0.01);
          gain.gain.linearRampToValueAtTime(0.001, beepStart + beepLen);

          osc.connect(gain);
          oscDetune.connect(gain);
          gain.connect(compressor);

          osc.start(beepStart);
          oscDetune.start(beepStart);
          osc.stop(beepStart + beepLen);
          oscDetune.stop(beepStart + beepLen);
        });

        soundLoopTimer = setTimeout(playPatternStep, (totalBurst + 0.18) * 1000);
        break;
      }

      case 'default': {
        // ── HIGH-PRIORITY QUAD PULSE DISPATCH ALERT ──
        const tones = [780, 950, 1150, 1380];
        const pulseLen = 0.08;
        const pulseGap = 0.05;
        const totalLen = tones.length * (pulseLen + pulseGap);

        tones.forEach((freq, idx) => {
          const pStart = now + idx * (pulseLen + pulseGap);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, pStart);

          gain.gain.setValueAtTime(0.001, pStart);
          gain.gain.linearRampToValueAtTime(1.1, pStart + 0.01);
          gain.gain.setValueAtTime(1.1, pStart + pulseLen - 0.01);
          gain.gain.linearRampToValueAtTime(0.001, pStart + pulseLen);

          osc.connect(gain);
          gain.connect(compressor);

          osc.start(pStart);
          osc.stop(pStart + pulseLen);
        });

        soundLoopTimer = setTimeout(playPatternStep, (totalLen + 0.25) * 1000);
        break;
      }

      case 'radar': {
        // ── HIGH-GAIN TACTICAL SONAR SWEEP ──
        const sweepLen = 0.28;
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1750, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + sweepLen);

        sub.type = 'square';
        sub.frequency.setValueAtTime(440, now);

        gain.gain.setValueAtTime(1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + sweepLen);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(compressor);

        osc.start(now);
        sub.start(now);
        osc.stop(now + sweepLen);
        sub.stop(now + sweepLen);

        soundLoopTimer = setTimeout(playPatternStep, 450);
        break;
      }

      case 'chime': {
        // ── RESONANT TRIPLE POWER CHIME ──
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const step = 0.12;
        notes.forEach((freq, i) => {
          const start = now + i * step;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(1.0, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

          osc.connect(gain);
          gain.connect(compressor);

          osc.start(start);
          osc.stop(start + 0.6);
        });

        soundLoopTimer = setTimeout(playPatternStep, 1100);
        break;
      }

      case 'gentle':
      default: {
        // ── WARM ASCENDING MELODIC WAKEUP ──
        const notes = [440, 554.37, 659.25, 880];
        const step = 0.15;
        notes.forEach((freq, i) => {
          const start = now + i * step;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.9, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

          osc.connect(gain);
          gain.connect(compressor);

          osc.start(start);
          osc.stop(start + 0.8);
        });

        soundLoopTimer = setTimeout(playPatternStep, 1500);
        break;
      }
    }
  };

  // Kick off immediate playback
  playPatternStep();

  // Countdown timer: ticks every second and auto-stops when duration is reached
  countdownTimer = setInterval(() => {
    remainingSeconds--;
    if (options.onTick) {
      options.onTick(remainingSeconds);
    }
    if (remainingSeconds <= 0) {
      controller.stop();
    }
  }, 1000);

  // Stop controller
  const controller: AlarmController = {
    stop: () => {
      if (!isRunning) return;
      isRunning = false;

      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      if (soundLoopTimer) {
        clearTimeout(soundLoopTimer);
        soundLoopTimer = null;
      }
      if (vibrationTimer) {
        clearInterval(vibrationTimer);
        vibrationTimer = null;
      }

      // Stop device vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(0);
        } catch (e) {
          // ignore
        }
      }

      // Smooth gain ramp down to eliminate speaker click
      try {
        if (ctx && ctx.state !== 'closed') {
          const now = ctx.currentTime;
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.04);
          setTimeout(() => {
            try {
              masterGain.disconnect();
              compressor.disconnect();
            } catch (e) {
              // ignore
            }
          }, 60);
        }
      } catch (e) {
        // ignore
      }

      if (currentActiveAlarm === controller) {
        currentActiveAlarm = null;
      }

      if (options.onStop) {
        options.onStop();
      }
    },
    isPlaying: () => isRunning,
    getRemainingSeconds: () => Math.max(0, remainingSeconds)
  };

  currentActiveAlarm = controller;
  return controller;
}

// Backward-compatible AlarmSounds API with continuous playback and insane volume
export const AlarmSounds = {
  default: async (duration: number = 60) => startContinuousAlarm({ type: 'default', duration }),
  urgent: async (duration: number = 60) => startContinuousAlarm({ type: 'urgent', duration }),
  loud: async (duration: number = 60) => startContinuousAlarm({ type: 'loud', duration }),
  siren: async (duration: number = 60) => startContinuousAlarm({ type: 'siren', duration }),
  gentle: async (duration: number = 60) => startContinuousAlarm({ type: 'gentle', duration }),
  radar: async (duration: number = 60) => startContinuousAlarm({ type: 'radar', duration }),
  chime: async (duration: number = 60) => startContinuousAlarm({ type: 'chime', duration }),
  stop: () => stopAllAlarms()
};
