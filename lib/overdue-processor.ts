import prisma from "@/lib/prisma"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from "@/lib/pusher"
import {
  checkTripOverdue,
  OVERDUE_GRACE_PERIOD_MINUTES,
  MAX_LATE_WARNINGS_BEFORE_SUSPENSION,
  LATE_SUSPENSION_PENALTY_NAIRA
} from "@/lib/trip-schedule"

export interface ProcessedTripDetail {
  tripId: string
  riderId: string
  driverId: string | null
  riderCompensated: boolean
  warningNumber?: number
  suspended?: boolean
  penaltyApplied?: number
}

export interface OverdueProcessResult {
  processedTripsCount: number
  riderCompensationsGiven: number
  driverWarningsGiven: number
  driverSuspensionsGiven: number
  details: ProcessedTripDetail[]
}

/**
 * Evaluates active confirmed trips and applies on-time guarantee rules:
 * 1. Rider Compensation: If driver is >= 15m late past scheduled pickup, rider gets +1 Free Drop.
 * 2. Driver Escalation: Driver receives a warning. Upon reaching 3 warnings, driver is suspended and penalized ₦1,000.
 */
export async function processOverdueTrips(specificTripId?: string): Promise<OverdueProcessResult> {
  const now = new Date()
  const result: OverdueProcessResult = {
    processedTripsCount: 0,
    riderCompensationsGiven: 0,
    driverWarningsGiven: 0,
    driverSuspensionsGiven: 0,
    details: []
  }

  try {
    // Query candidate trips: confirmed, not yet completed or cancelled, and either uncompensated or unpenalized
    const whereClause: any = {
      status: "CONFIRMED",
      driverArrivedAt: null,
      driverDepartedAt: null,
      OR: [
        { riderCompensatedAt: null },
        { driverPenalizedAt: null }
      ]
    }

    if (specificTripId) {
      whereClause.id = specificTripId
    }

    const candidateTrips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        rider: true,
        driver: {
          include: {
            driverProfile: true
          }
        }
      }
    })

    for (const trip of candidateTrips) {
      const overdueStatus = checkTripOverdue(trip, now, OVERDUE_GRACE_PERIOD_MINUTES)
      if (!overdueStatus.isOverdue) continue

      result.processedTripsCount++
      const detail: ProcessedTripDetail = {
        tripId: trip.id,
        riderId: trip.riderId,
        driverId: trip.driverId,
        riderCompensated: false
      }

      // ── 1. RIDER COMPENSATION (+1 Free Drop) ─────────────────────────
      const needsRiderCompensation = !trip.riderCompensatedAt

      if (needsRiderCompensation) {
        try {
          await prisma.$transaction(async (tx) => {
            // Credit rider drops balance
            await tx.user.update({
              where: { id: trip.riderId },
              data: { dropsBalance: { increment: 1 } }
            })

            // Record compensation transaction
            await tx.dropTransaction.create({
              data: {
                userId: trip.riderId,
                type: 'COMPENSATION',
                amount: 1,
                package: 'Late Driver Guarantee (+1 Drop)'
              }
            })

            // Mark trip as overdue and compensated
            await tx.trip.update({
              where: { id: trip.id },
              data: {
                isOverdue: true,
                riderCompensatedAt: now
              }
            })
          })

          detail.riderCompensated = true
          result.riderCompensationsGiven++

          // Send Rider Notification
          sendWebPush(
            trip.riderId,
            '🎁 1 Free Drop Credited!',
            `Your driver is running over 15 minutes late for pickup. We apologize for the wait and have added 1 Free Drop to your account!`,
            `/dashboard/trips/${trip.id}`
          )

          // Notify Rider channel
          pusherServer.trigger(`user-trips-${trip.riderId}`, 'trip-overdue-compensated', {
            tripId: trip.id,
            dropAwarded: 1,
            compensatedAt: now.toISOString()
          }).catch(err => console.error("Pusher rider notification failed:", err))

        } catch (riderErr) {
          console.error(`Failed to compensate rider for trip ${trip.id}:`, riderErr)
        }
      }

      // ── 2. DRIVER WARNING & SUSPENSION ESCALATION ────────────────────
      const needsDriverEvaluation = !trip.driverPenalizedAt && trip.driverId && trip.driver?.driverProfile

      if (needsDriverEvaluation) {
        const driverProfile = trip.driver!.driverProfile!
        const currentWarnings = driverProfile.lateWarningsCount || 0
        const newWarningsCount = currentWarnings + 1
        const isSuspension = newWarningsCount >= MAX_LATE_WARNINGS_BEFORE_SUSPENSION

        try {
          await prisma.$transaction(async (tx) => {
            if (isSuspension) {
              const currentBalance = driverProfile.walletBalance || 0
              const newBalance = Math.max(0, currentBalance - LATE_SUSPENSION_PENALTY_NAIRA)
              const newDeductions = (driverProfile.latePenaltyDeductions || 0) + LATE_SUSPENSION_PENALTY_NAIRA

              // Suspend driver profile & apply penalty
              await tx.driverProfile.update({
                where: { id: driverProfile.id },
                data: {
                  status: 'SUSPENDED',
                  lateWarningsCount: newWarningsCount,
                  lastLateWarningAt: now,
                  walletBalance: newBalance,
                  latePenaltyDeductions: newDeductions
                }
              })

              // Record penalty transaction
              await tx.walletTransaction.create({
                data: {
                  driverId: driverProfile.id,
                  tripId: trip.id,
                  type: 'PENALTY',
                  amount: -LATE_SUSPENSION_PENALTY_NAIRA,
                  description: `Penalty for late pickup (${newWarningsCount} warnings reached - Account Suspended)`
                }
              })

              // Mark trip penalized
              await tx.trip.update({
                where: { id: trip.id },
                data: {
                  isOverdue: true,
                  driverPenalizedAt: now
                }
              })

            } else {
              // Issue warning 1 or 2
              await tx.driverProfile.update({
                where: { id: driverProfile.id },
                data: {
                  lateWarningsCount: newWarningsCount,
                  lastLateWarningAt: now
                }
              })

              // Mark trip penalized/warned
              await tx.trip.update({
                where: { id: trip.id },
                data: {
                  isOverdue: true,
                  driverPenalizedAt: now
                }
              })
            }
          })

          detail.warningNumber = newWarningsCount
          detail.suspended = isSuspension
          if (isSuspension) detail.penaltyApplied = LATE_SUSPENSION_PENALTY_NAIRA

          if (isSuspension) {
            result.driverSuspensionsGiven++

            // Suspension alerts
            sendWebPush(
              trip.driverId!,
              '🚨 Account Suspended — Late Penalties',
              `You have reached ${MAX_LATE_WARNINGS_BEFORE_SUSPENSION} late arrival warnings. Your driver account is now suspended and a ₦${LATE_SUSPENSION_PENALTY_NAIRA.toLocaleString()} fine was applied. Contact support.`,
              '/driver'
            )

            pusherServer.trigger(`user-trips-${trip.driverId}`, 'driver-suspended', {
              tripId: trip.id,
              penaltyAmount: LATE_SUSPENSION_PENALTY_NAIRA,
              status: 'SUSPENDED'
            }).catch(err => console.error("Pusher driver suspension trigger failed:", err))

          } else {
            result.driverWarningsGiven++

            // Warning alerts
            sendWebPush(
              trip.driverId!,
              `⚠️ Late Arrival Warning (${newWarningsCount}/${MAX_LATE_WARNINGS_BEFORE_SUSPENSION})`,
              `You are more than ${OVERDUE_GRACE_PERIOD_MINUTES} minutes late for pickup at ${trip.pickup}. Please proceed immediately. ${MAX_LATE_WARNINGS_BEFORE_SUSPENSION} warnings result in account suspension and a ₦${LATE_SUSPENSION_PENALTY_NAIRA.toLocaleString()} penalty.`,
              '/driver'
            )

            pusherServer.trigger(`user-trips-${trip.driverId}`, 'driver-late-warning', {
              tripId: trip.id,
              warningsCount: newWarningsCount,
              maxWarnings: MAX_LATE_WARNINGS_BEFORE_SUSPENSION
            }).catch(err => console.error("Pusher driver warning trigger failed:", err))
          }

        } catch (driverErr) {
          console.error(`Failed to penalize driver for trip ${trip.id}:`, driverErr)
        }
      }

      // Broadcast trip state update on the trip's dedicated channel
      pusherServer.trigger(`trip-${trip.id}`, 'trip-overdue-updated', {
        tripId: trip.id,
        isOverdue: true,
        riderCompensatedAt: trip.riderCompensatedAt ? trip.riderCompensatedAt.toISOString() : (detail.riderCompensated ? now.toISOString() : null),
        driverPenalizedAt: now.toISOString()
      }).catch(err => console.error("Pusher trip channel trigger failed:", err))

      result.details.push(detail)
    }

    return result
  } catch (error) {
    console.error("Error executing overdue trip processor:", error)
    return result
  }
}
