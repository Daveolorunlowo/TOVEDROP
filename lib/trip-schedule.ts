/**
 * Utility functions for trip time parsing, schedule conflict detection,
 * and overdue pickup evaluations.
 */

export const TRIP_BUFFER_MINUTES = 30; // Minimum minutes between separate trips
export const OVERDUE_GRACE_PERIOD_MINUTES = 15; // Minutes past scheduled pickup before compensation & warning trigger
export const MAX_LATE_WARNINGS_BEFORE_SUSPENSION = 3;
export const LATE_SUSPENSION_PENALTY_NAIRA = 1000;

export interface TripTimeData {
  id?: string;
  isScheduled?: boolean;
  scheduledDateTime?: Date | string | null;
  date?: string | null;
  time?: string | null;
  createdAt?: Date | string;
  isPool?: boolean;
  poolGroupId?: string | null;
  pickup?: string;
  destination?: string;
}

/**
 * Normalizes and extracts an accurate Date object for a trip.
 */
export function getTripDateTime(trip: TripTimeData): Date {
  if (trip.scheduledDateTime) {
    const d = new Date(trip.scheduledDateTime);
    if (!isNaN(d.getTime())) return d;
  }

  if (trip.date && trip.time) {
    const dateStr = trip.date.trim();
    const timeStr = trip.time.trim();

    // Try standard ISO or space separator
    const combined = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(combined.getTime())) return combined;

    const isoTry = new Date(`${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`);
    if (!isNaN(isoTry.getTime())) return isoTry;

    // Handle 12-hour AM/PM format (e.g. "09:30 AM")
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const d = new Date(year, month, day, hours, minutes, 0);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  if (trip.createdAt) {
    const d = new Date(trip.createdAt);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

/**
 * Checks whether an incoming trip clashes with any already-accepted confirmed trips.
 */
export function checkTripClash(
  targetTrip: TripTimeData,
  confirmedTrips: TripTimeData[],
  bufferMinutes: number = TRIP_BUFFER_MINUTES
): {
  clashes: boolean;
  clashingTrip?: TripTimeData;
  timeDifferenceMinutes?: number;
  reason?: string;
} {
  const targetTime = getTripDateTime(targetTrip);
  const bufferMs = bufferMinutes * 60 * 1000;

  for (const existing of confirmedTrips) {
    if (existing.id && targetTrip.id && existing.id === targetTrip.id) continue;

    // Carpool rides in the same pool group can be accepted together
    if (
      targetTrip.isPool &&
      existing.isPool &&
      targetTrip.poolGroupId &&
      existing.poolGroupId &&
      targetTrip.poolGroupId === existing.poolGroupId
    ) {
      continue;
    }

    const existingTime = getTripDateTime(existing);
    const diffMs = Math.abs(targetTime.getTime() - existingTime.getTime());

    if (diffMs < bufferMs) {
      const diffMinutes = Math.round(diffMs / (60 * 1000));
      return {
        clashes: true,
        clashingTrip: existing,
        timeDifferenceMinutes: diffMinutes,
        reason: `Overlaps with confirmed ride to ${existing.destination || 'destination'} at ${existing.time || 'scheduled time'} (within ${diffMinutes}m)`
      };
    }
  }

  return { clashes: false };
}

/**
 * Checks whether a confirmed trip is overdue beyond the grace period.
 */
export function checkTripOverdue(
  trip: TripTimeData & {
    driverArrivedAt?: Date | string | null;
    driverDepartedAt?: Date | string | null;
    status?: string;
  },
  now: Date = new Date(),
  graceMinutes: number = OVERDUE_GRACE_PERIOD_MINUTES
): {
  isOverdue: boolean;
  minutesPast: number;
} {
  // If driver has already arrived or departed, or trip completed/cancelled, not overdue
  if (trip.driverArrivedAt || trip.driverDepartedAt) {
    return { isOverdue: false, minutesPast: 0 };
  }
  if (trip.status && trip.status !== 'CONFIRMED') {
    return { isOverdue: false, minutesPast: 0 };
  }

  const tripTime = getTripDateTime(trip);
  const diffMs = now.getTime() - tripTime.getTime();
  const minutesPast = Math.floor(diffMs / (60 * 1000));

  if (minutesPast >= graceMinutes) {
    return { isOverdue: true, minutesPast };
  }

  return { isOverdue: false, minutesPast: Math.max(0, minutesPast) };
}
