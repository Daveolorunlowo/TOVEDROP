import { useState, useEffect, useRef } from 'react';
import { stopAllAlarms } from '@/lib/alarm-sounds';

export function useDriverAlarms(driverTrips: any[], alarmPrefs: any) {
  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  const activeAlarmRef = useRef<any>(null);

  useEffect(() => {
    activeAlarmRef.current = activeAlarm;
  }, [activeAlarm]);

  useEffect(() => {
    if (!driverTrips?.length) return;

    const check = async () => {
      // Don't trigger another alarm if one is currently ringing on screen
      if (activeAlarmRef.current) return;

      const now = new Date();

      for (const trip of driverTrips) {
        if (trip.status !== 'CONFIRMED') continue;

        let scheduledAt = new Date(`${trip.date}T${trip.time}`);
        if (isNaN(scheduledAt.getTime())) {
          scheduledAt = new Date(`${trip.date} ${trip.time}`);
        }
        if (isNaN(scheduledAt.getTime())) {
          scheduledAt = new Date(trip.date);
        }
        if (isNaN(scheduledAt.getTime())) continue;

        const minsUntil = (scheduledAt.getTime() - now.getTime()) / 60000;

        // 1. Gather trip-specific custom reminder thresholds
        const tripReminders = trip.tripReminders || [];
        const customThresholds: number[] = [];
        for (const reminder of tripReminders) {
          if (reminder.sent) continue;
          const parsed = parseInt(reminder.type, 10);
          if (!isNaN(parsed) && parsed > 0) {
            customThresholds.push(parsed);
          }
        }

        // 2. Determine applicable thresholds for this trip
        let thresholds: number[] = [];
        if (customThresholds.length > 0) {
          // Explicitly set by driver for this ride
          thresholds = customThresholds;
        } else if (alarmPrefs?.alarmEnabled !== false) {
          // Fall back to driver's global alarm settings (default: 30, 10, 2 mins)
          thresholds = Array.isArray(alarmPrefs?.alarmTimes) && alarmPrefs.alarmTimes.length > 0
            ? alarmPrefs.alarmTimes
            : [30, 10, 2];
        }

        // Sort descending so the earliest alert checks first
        thresholds.sort((a, b) => b - a);

        for (const threshold of thresholds) {
          // Trigger if we are at or past the threshold, but not past 5 mins after pickup time
          if (minsUntil <= threshold && minsUntil >= -5) {
            try {
              const res = await fetch(
                `/api/alarms/check?tripId=${trip.id}&minutes=${threshold}`
              );
              const { alreadyFired } = await res.json();

              if (!alreadyFired) {
                await fetch('/api/alarms/log', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tripId: trip.id,
                    minutesBefore: threshold
                  })
                });

                setActiveAlarm({ trip, minutesBefore: threshold });
                return; // Stop checking to avoid overlapping modals immediately
              }
            } catch (err) {
              console.error('Failed to check alarm log', err);
            }
          }
        }
      }
    };

    const interval = setInterval(check, 10000); // Check every 10s for precision
    check(); // run immediately on mount

    const handleFocus = () => check();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [driverTrips, alarmPrefs]);

  const triggerTestAlarm = () => {
    const now = new Date();
    const departure = new Date(now.getTime() + 10 * 60000);
    setActiveAlarm({
      trip: {
        id: 'test-trip-id',
        date: departure.toISOString().split('T')[0],
        time: departure.toTimeString().slice(0, 5),
        status: 'CONFIRMED',
        pickup: 'Main Campus Gate & Commercial Strip',
        destination: 'Student Hostels & Residential Quarters',
        rider: { name: 'Precious Adebayo' }
      },
      minutesBefore: 10
    });
  };

  const dismissAlarm = () => {
    stopAllAlarms();
    setActiveAlarm(null);
  };

  return { activeAlarm, dismissAlarm, triggerTestAlarm };
}
