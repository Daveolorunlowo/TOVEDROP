import { useState, useEffect } from 'react';
import { stopAllAlarms } from '@/lib/alarm-sounds';

export function useDriverAlarms(driverTrips: any[], alarmPrefs: any) {
  const [activeAlarm, setActiveAlarm] = useState<any>(null);

  useEffect(() => {
    if (!alarmPrefs?.alarmEnabled || !driverTrips?.length) return;

    const check = async () => {
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
        const thresholds = Array.isArray(alarmPrefs.alarmTimes)
          ? alarmPrefs.alarmTimes
          : [30, 10, 2];

        for (const threshold of thresholds) {
          // Check if we're within a 45-second window of this threshold
          if (minsUntil <= threshold && minsUntil > threshold - 0.75) {
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

    const interval = setInterval(check, 15000); // Check every 15s for precision
    check(); // run immediately on mount
    return () => clearInterval(interval);
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
