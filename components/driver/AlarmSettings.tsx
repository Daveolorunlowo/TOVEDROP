'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Square, Play } from 'lucide-react';
import { AlarmSounds } from '@/lib/alarm-sounds';

export function AlarmSettings({
  driverId,
  initialSettings,
  onSave,
  onPreviewAlarm
}: {
  driverId: string;
  initialSettings: any;
  onSave: (settings: any) => void;
  onPreviewAlarm?: () => void;
}) {
  const [enabled, setEnabled] = useState(initialSettings?.alarmEnabled ?? true);
  const [times, setTimes] = useState<number[]>(initialSettings?.alarmTimes ?? [30, 10, 2]);
  const [sound, setSound] = useState(initialSettings?.alarmSound ?? 'loud');
  const [vibrate, setVibrate] = useState(initialSettings?.alarmVibrate ?? true);
  const [saving, setSaving] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const testControllerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (testControllerRef.current) {
        testControllerRef.current.stop();
        testControllerRef.current = null;
      }
      AlarmSounds.stop();
    };
  }, []);

  const toggleTime = (t: number) => {
    setTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].sort((a, b) => b - a));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/drivers/${driverId}/alarm-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alarmEnabled: enabled,
          alarmTimes: times,
          alarmSound: sound,
          alarmVibrate: vibrate
        })
      });
      if (res.ok) {
        onSave({
          alarmEnabled: enabled,
          alarmTimes: times,
          alarmSound: sound,
          alarmVibrate: vibrate
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const testSound = async () => {
    if (isPlayingTest) {
      if (testControllerRef.current) {
        testControllerRef.current.stop();
        testControllerRef.current = null;
      }
      AlarmSounds.stop();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    let ctrl: any = null;
    if (sound === 'loud') ctrl = await AlarmSounds.loud(20);
    else if (sound === 'urgent') ctrl = await AlarmSounds.urgent(20);
    else if (sound === 'gentle') ctrl = await AlarmSounds.gentle(20);
    else ctrl = await AlarmSounds.default(20);

    testControllerRef.current = ctrl;
  };

  return (
    <div className="rounded-lg mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 20px' }}>
      <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Ride Departure Reminders
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={enabled} onChange={() => setEnabled(!enabled)} />
          <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>

      <div className={`space-y-6 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <p className="text-sm font-medium mb-3">Remind me at:</p>
          <div className="flex flex-col gap-2">
            {[60, 30, 10, 5, 2].map(t => (
              <label key={t} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={times.includes(t)}
                  onChange={() => toggleTime(t)}
                  className="rounded bg-zinc-900 border-zinc-700 text-green-500 focus:ring-green-500"
                />
                {t} minutes before
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Alarm Sound (Insanely High Volume):</p>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              🔊 Continuous Siren Mode
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'loud', label: 'Emergency Siren — dual-tone max loudness' },
              { id: 'urgent', label: 'Urgent — rapid piercing horn' },
              { id: 'default', label: 'Default — high priority quad alert' },
              { id: 'gentle', label: 'Gentle — clear chime' },
            ].map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="alarmSound"
                  checked={sound === s.id}
                  onChange={() => setSound(s.id)}
                  className="bg-zinc-900 border-zinc-700 text-green-500 focus:ring-green-500"
                />
                {s.label}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={testSound}
            className={`mt-3 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold cursor-pointer ${
              isPlayingTest
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-foreground'
            }`}
          >
            {isPlayingTest ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Alarm (Ringing...)
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                🔊 Test Sound (Continuous Loud)
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Haptic Vibration</p>
            <p className="text-[11px] text-muted-foreground">Vibrate continuously alongside audio</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={vibrate} onChange={() => setVibrate(!vibrate)} />
            <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {onPreviewAlarm && (
          <button
            onClick={onPreviewAlarm}
            className="w-full bg-transparent border border-orange-500/50 hover:bg-orange-500/10 text-orange-500 font-medium py-2 rounded-lg transition-colors mt-2 cursor-pointer"
          >
            Preview Full Alarm Workflow
          </button>
        )}
      </div>
    </div>
  );
}
