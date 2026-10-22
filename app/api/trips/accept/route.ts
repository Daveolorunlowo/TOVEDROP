import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from "@/lib/pusher"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"
import { checkTripClash } from "@/lib/trip-schedule"

const acceptTripSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required")
})

export const POST = withValidation(acceptTripSchema, async (req: NextRequest, data) => {
 try {
 const session = await getServerSession(authOptions)
 
 if (!session || !session.user || session.user.role !== "DRIVER") {
 return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
 }

 const { tripId } = data

 const driverProfile = await prisma.driverProfile.findUnique({
 where: { userId: session.user.id },
 include: { user: true }
 })

 if (!driverProfile || driverProfile.status !== "APPROVED") {
  if (driverProfile?.status === "SUSPENDED") {
    return NextResponse.json({ 
      message: "Your driver account is currently suspended due to repeated late arrival penalties. Please contact support." 
    }, { status: 403 })
  }
  return NextResponse.json({ message: "Driver is not approved" }, { status: 403 })
 }

 const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

 const targetTrip = await prisma.trip.findUnique({ where: { id: tripId } })
 if (!targetTrip) {
  return NextResponse.json({ message: "Trip not found" }, { status: 404 })
 }

 // ── Schedule Clash Validation ──────────────────────────────────
 const existingConfirmedTrips = await prisma.trip.findMany({
   where: {
     driverId: session.user.id,
     status: 'CONFIRMED'
   }
 })

 const clash = checkTripClash(targetTrip, existingConfirmedTrips)
 if (clash.clashes) {
   return NextResponse.json({
     message: `Schedule conflict: This trip clashes with an existing confirmed ride (${clash.reason}). Drivers cannot accept overlapping trips.`,
     clash
   }, { status: 409 })
 }

 let whereClause: any = { 
 id: tripId, 
 status: 'PENDING', 
 driverId: null 
 }
 
 if (targetTrip.isPool && targetTrip.poolGroupId) {
 whereClause = {
 poolGroupId: targetTrip.poolGroupId,
 status: 'PENDING',
 driverId: null
 }
 }

 const result = await prisma.trip.updateMany({
 where: whereClause,
 data: { 
 status: 'CONFIRMED', 
 driverId: session.user.id,
 shareToken: shareToken
 }
 })

 if (result.count === 0) {
 return NextResponse.json({ message: "Trip was already accepted by someone else or is no longer available" }, { status: 409 })
 }

 // Notify all affected riders via Web Push and Pusher
 const updatedTrips = await prisma.trip.findMany({
 where: targetTrip.isPool && targetTrip.poolGroupId 
 ? { poolGroupId: targetTrip.poolGroupId, driverId: session.user.id }
 : { id: tripId },
 include: { rider: true }
 })
 
 const driverName = driverProfile.user?.name || "A driver"
 const vehicle = `${driverProfile.vehicleColor} ${driverProfile.vehicleMake} ${driverProfile.vehicleModel}`
 const rating = driverProfile.rating > 0 ? driverProfile.rating.toFixed(1) : 'New'

 for (const trip of updatedTrips) {
 const title = 'Ride Accepted! 🎉'
 const message = `${driverName} is on the way in a ${vehicle} (⭐ ${rating}).\nPickup: ${trip.time} at ${trip.pickup}`
 const url = `/dashboard/trips/${trip.id}`
 
 // Await Web Push to guarantee delivery before API response finishes
 try {
   const pushResult = await sendWebPush(trip.riderId, title, message, url)
   console.log(`[Trip Accept] Web Push dispatch result for rider ${trip.riderId}:`, pushResult)
 } catch (err) {
   console.error("[Trip Accept] Web Push accept failed:", err)
 }
 
 if (pusherServer) {
   await pusherServer.trigger(`user-trips-${trip.riderId}`, 'trip-accepted', {
     tripId: trip.id,
     driverName,
     vehicle,
     rating,
     isPool: trip.isPool
   }).catch(err => console.error("Pusher user-trips trigger failed:", err))

   await pusherServer.trigger(`user-${trip.riderId}`, 'trip-accepted', {
     tripId: trip.id,
     driverName,
     vehicle,
     rating,
     isPool: trip.isPool
   }).catch(err => console.error("Pusher user trigger failed:", err))

   await pusherServer.trigger(`trip-${trip.id}`, 'trip-accepted', {
     tripId: trip.id,
     driverName,
     vehicle,
     rating,
     isPool: trip.isPool
   }).catch(err => console.error("Pusher trip trigger failed:", err))

   await pusherServer.trigger('global-trips', 'trip-accepted', {
     tripId: trip.id,
     driverId: session.user.id
   }).catch(err => console.error("Pusher global-trips accept trigger failed:", err))

   await pusherServer.trigger('admin-alerts', 'trip-status-changed', {
     tripId: trip.id,
     status: 'CONFIRMED',
     driverName
   }).catch(err => console.error("Pusher admin-alerts trigger failed:", err))
 }

 // Schedule driver alarm push notifications
 if (driverProfile.alarmEnabled && driverProfile.alarmTimes?.length > 0) {
 // Assume trip.date is YYYY-MM-DD and trip.time is HH:MM
 const scheduledAt = new Date(`${trip.date}T${trip.time}`);
 if (!isNaN(scheduledAt.getTime())) {
 for (const mins of driverProfile.alarmTimes) {
 const remindAt = new Date(scheduledAt.getTime() - mins * 60 * 1000);
 
 if (remindAt > new Date()) { // only future times
 await prisma.tripReminder.create({
 data: {
 tripId: trip.id,
 driverId: session.user.id,
 remindAt,
 type: `${mins}min`,
 sent: false
 }
 }).catch(err => console.error("Failed to create trip reminder:", err));
 }
 }
 }
 }
 }

 return NextResponse.json({ message: "Trip(s) accepted successfully", shareToken, count: result.count }, { status: 200 })
 } catch (error: any) {
 return NextResponse.json({ message: "Error accepting trip", error: error.message }, { status: 500 })
 }
})
