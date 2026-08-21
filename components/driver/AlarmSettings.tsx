'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { AlarmSounds } from '@/lib/alarm-sounds';

export function AlarmSettings({
  driverId,
  initialSettings,
  onSave
}: {
  driverId: string;
  initialSettings: any;
  onSave: (settings: any) => void;
}) {
  const [enabled, setEnabled] = useState(initialSettings?.alarmEnabled ?? true);
  const [times, setTimes] = useState<number[]>(initialSettings?.alarmTimes ?? [30, 10, 2]);
  const [sound, setSound] = useState(initialSettings?.alarmSound ?? 'default');
  const [vibrate, setVibrate] = useState(initialSettings?.alarmVibrate ?? true);
  const [saving, setSaving] = useState(false);

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
    if (sound === 'loud') await AlarmSounds.loud();
    else if (sound === 'urgent') await AlarmSounds.urgent();
    else if (sound === 'gentle') await AlarmSounds.gentle();
    else await AlarmSounds.default();
  };

  return (
    <div className="rounded-lg mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 20px' }}>
      <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Ride Reminders
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
          <p className="text-sm font-medium mb-3">Alarm Sound:</p>
          <div className="flex flex-col gap-2">
            {[
              { id: 'gentle', label: 'Gentle — soft chime' },
              { id: 'default', label: 'Default — clear alert' },
              { id: 'urgent', label: 'Urgent — rapid beeps' },
              { id: 'loud', label: 'Loud — strong alarm' },
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
            onClick={testSound}
            className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors"
          >
            🔊 Test Sound
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Vibration</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={vibrate} onChange={() => setVibrate(!vibrate)} />
            <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
