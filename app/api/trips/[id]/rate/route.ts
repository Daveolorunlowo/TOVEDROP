import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { rating, note } = await req.json()
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Invalid rating" }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.id }
    })

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    if (trip.riderId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    if (trip.status !== "COMPLETED") {
      return NextResponse.json({ message: "Trip is not completed yet" }, { status: 400 })
    }

    // Wrap in transaction: create review, update driver rating
    const result = await prisma.$transaction(async (tx) => {
      const existingReview = await tx.review.findUnique({
        where: { tripId: trip.id }
      })

      if (existingReview) {
        throw new Error("Trip already rated")
      }

      const review = await tx.review.create({
        data: {
          tripId: trip.id,
          rating,
          note
        }
      })

      // Recalculate average rating for driver
      if (trip.driverId) {
        const driverProfile = await tx.driverProfile.findUnique({
          where: { userId: trip.driverId }
        })

        if (driverProfile) {
          const allDriverTrips = await tx.trip.findMany({
            where: { driverId: trip.driverId, status: "COMPLETED" },
            include: { review: true }
          })

          const ratedTrips = allDriverTrips.filter(t => t.review)
          const totalRating = ratedTrips.reduce((sum, t) => sum + t.review!.rating, 0)
          const newAvgRating = ratedTrips.length > 0 ? totalRating / ratedTrips.length : 0

          await tx.driverProfile.update({
            where: { userId: trip.driverId },
            data: { rating: newAvgRating }
          })
        }
      }

      return review
    })

    return NextResponse.json({ message: "Rating submitted successfully", review: result }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Trip already rated") {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    return NextResponse.json({ message: "Error submitting rating", error: error.message }, { status: 500 })
  }
}
