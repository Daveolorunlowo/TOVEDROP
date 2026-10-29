import prisma from "@/lib/prisma"
import { getTripDateTime } from "@/lib/trip-schedule"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from "@/lib/pusher"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { logger } from "@/lib/logger"

// Threshold in minutes for instant trips before expiring if no driver accepts
export const INSTANT_TRIP_EXPIRY_MINUTES = 15;

export interface ExpirationCheckResult {
  isExpired: boolean;
  reason?: string;
  pickupTime: Date;
}

/**
 * Checks if a pending trip has passed its pickup time without any driver accepting.
 */
export function isPendingTripPastPickup(
  trip: {
    status: string;
    driverId: string | null;
    isScheduled?: boolean;
    scheduledDateTime?: Date | string | null;
    date?: string | null;
    time?: string | null;
    createdAt?: Date | string;
  },
  now: Date = new Date()
): ExpirationCheckResult {
  if (trip.status !== "PENDING" || trip.driverId !== null) {
    return { isExpired: false, pickupTime: new Date() };
  }

  const pickupTime = getTripDateTime(trip);
  const nowMs = now.getTime();
  const pickupMs = pickupTime.getTime();

  if (trip.isScheduled) {
    // Scheduled trip: expired if current time is past the scheduled pickup time
    if (nowMs >= pickupMs) {
      const minutesPast = Math.floor((nowMs - pickupMs) / 60000);
      return {
        isExpired: true,
        reason: `Scheduled pickup time (${trip.time || 'scheduled time'}) passed ${minutesPast > 0 ? `${minutesPast}m ago` : 'just now'} without driver acceptance`,
        pickupTime
      };
    }
  } else {
    // Instant trip: expired if more than INSTANT_TRIP_EXPIRY_MINUTES have elapsed since pickup/creation
    const diffMs = nowMs - pickupMs;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins >= INSTANT_TRIP_EXPIRY_MINUTES) {
      return {
        isExpired: true,
        reason: `Instant request timed out (${diffMins}m passed since request at ${trip.time || 'booking time'}) without driver acceptance`,
        pickupTime
      };
    }
  }

  return { isExpired: false, pickupTime };
}

/**
 * Expires an unaccepted pending trip whose pickup time has passed.
 * Automatically refunds the rider's Drop, updates status to CANCELLED,
 * and notifies the rider via Web Push, Pusher real-time, and WhatsApp.
 */
export async function expireUnacceptedTrip(tripId: string, reasonDetails?: string) {
  try {
    const existing = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: true,
      }
    });

    if (!existing || existing.status !== "PENDING" || existing.driverId !== null) {
      return null;
    }

    const reasonText = reasonDetails || "Expired: No driver accepted request before pickup time.";

    // 1. Transactional cancellation and drop refund
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Re-check under lock
      const t = await tx.trip.findUnique({
        where: { id: tripId }
      });
      if (!t || t.status !== "PENDING" || t.driverId !== null) return null;

      // Update trip to CANCELLED with detailed note
      const updated = await tx.trip.update({
        where: { id: t.id },
        data: {
          status: "CANCELLED",
          notes: t.notes ? `${t.notes} [${reasonText}]` : reasonText,
        }
      });

      // Restore drop to DropLot if applicable
      if (t.dropLotId) {
        await tx.dropLot.update({
          where: { id: t.dropLotId },
          data: { remainingDrops: { increment: 1 } }
        }).catch(() => {});
      }

      // Refund Drop back to user
      await tx.user.update({
        where: { id: t.riderId },
        data: { dropsBalance: { increment: 1 } }
      });

      // Log refund transaction
      await tx.dropTransaction.create({
        data: {
          userId: t.riderId,
          type: "REFUND",
          amount: 1,
          package: null,
          reference: `unaccepted_pickup_refund_${t.id}`
        }
      });

      return updated;
    });

    if (!updatedTrip) return null;

    logger.info("Unaccepted trip expired and refunded", {
      action: "EXPIRE_UNACCEPTED_TRIP",
      tripId,
      riderId: existing.riderId,
      reason: reasonText
    });

    // 2. Dispatch Notifications to Rider
    const pickupDisplay = existing.isScheduled
      ? `${existing.date} at ${existing.time}`
      : `at ${existing.time}`;

    const notifTitle = "No Driver Found — Request Expired ⏰";
    const notifMessage = `No driver was able to accept your ride to ${existing.destination} (${pickupDisplay}). Your 1 Drop has been automatically refunded to your balance.`;

    // A. Web Push Notification
    sendWebPush(
      existing.riderId,
      notifTitle,
      notifMessage,
      `/dashboard`
    ).catch(err => console.error("[ExpireTrips] Push notification failed:", err));

    // B. Pusher Real-time Events
    try {
      await pusherServer.trigger(`trip-${existing.id}`, "trip-expired-unaccepted", {
        tripId: existing.id,
        title: "No Driver Available",
        message: notifMessage,
        refunded: true,
        status: "CANCELLED"
      });
      await pusherServer.trigger(`trip-${existing.id}`, "trip-cancelled", {
        tripId: existing.id,
        reason: "EXPIRED_NO_DRIVER",
        refunded: true
      });
      await pusherServer.trigger(`user-${existing.riderId}`, "trip-status-changed", {
        tripId: existing.id,
        status: "CANCELLED",
        reason: "EXPIRED_NO_DRIVER",
        title: notifTitle,
        message: notifMessage
      });
      // Also notify drivers to remove this trip from their view immediately
      await pusherServer.trigger("global-trips", "trip-removed", {
        tripId: existing.id
      });
    } catch (pushErr) {
      console.error("[ExpireTrips] Pusher dispatch failed:", pushErr);
    }

    // C. WhatsApp Notification (if enabled)
    if (existing.rider?.phoneNumber && existing.rider?.whatsappNotificationsEnabled !== false) {
      const waMsg = `Hi ${existing.rider.name || 'there'}! Unfortunately no driver was available to accept your TOVEDROP ride request to ${existing.destination} (${pickupDisplay}). Your 1 Drop has been refunded to your wallet. You can book a new ride anytime on the app.`;
      sendWhatsAppMessage(existing.rider.phoneNumber, waMsg).catch(() => {});
    }

    return updatedTrip;
  } catch (error) {
    console.error(`[expireUnacceptedTrip] Error expiring trip ${tripId}:`, error);
    return null;
  }
}

/**
 * Scans pending trips and expires any that have passed pickup time without driver acceptance.
 */
export async function expireAllPendingTripsPastPickup(filter?: { riderId?: string; tripId?: string }): Promise<number> {
  try {
    const whereClause: any = {
      status: "PENDING",
      driverId: null
    };

    if (filter?.tripId) {
      whereClause.id = filter.tripId;
    }
    if (filter?.riderId) {
      whereClause.riderId = filter.riderId;
    }

    const pendingTrips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        rider: true
      }
    });

    if (pendingTrips.length === 0) return 0;

    const now = new Date();
    let expiredCount = 0;

    for (const trip of pendingTrips) {
      const check = isPendingTripPastPickup(trip, now);
      if (check.isExpired) {
        const res = await expireUnacceptedTrip(trip.id, check.reason);
        if (res) expiredCount++;
      }
    }

    return expiredCount;
  } catch (err) {
    console.error("[expireAllPendingTripsPastPickup] Error:", err);
    return 0;
  }
}
