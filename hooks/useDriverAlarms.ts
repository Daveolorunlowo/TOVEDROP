import { useState, useEffect } from 'react';

export function useDriverAlarms(driverTrips: any[], alarmPrefs: any) {
  const [activeAlarm, setActiveAlarm] = useState<any>(null);

  useEffect(() => {
    if (!alarmPrefs?.alarmEnabled || !driverTrips?.length) return;

    const check = async () => {
      const now = new Date();

      for (const trip of driverTrips) {
        if (trip.status !== 'CONFIRMED') continue;
        const scheduledAt = new Date(`${trip.date}T${trip.time}`);
        // Handle timezone/parsing depending on how date/time is stored
        // Ensure scheduledAt is a valid date
        if (isNaN(scheduledAt.getTime())) {
            // fallback if it's stored as full ISO string in another field or just ignore
            continue;
        }

        const minsUntil = (scheduledAt.getTime() - now.getTime()) / 60000;

        for (const threshold of alarmPrefs.alarmTimes) {
          // Check if we're within a 30-second window of this threshold
          if (minsUntil <= threshold && minsUntil > threshold - 0.5) {
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
          } else {
             // Handle snoozed re-trigger logic here if needed
             // but we'll fetch /api/alarms/check which can return whether it's snoozed and expired
          }
        }
      }
    };

    const interval = setInterval(check, 30000);
    check(); // run immediately on mount
    return () => clearInterval(interval);
  }, [driverTrips, alarmPrefs]);

  return { activeAlarm, dismissAlarm: () => setActiveAlarm(null) };
}
