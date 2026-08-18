import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, email, password, phone, area, availability, bio, licenseNumber, vehicleMake, vehicleModel, vehicleColor, vehiclePlate, isVerified } = data

    if (!name || !email || !password || !licenseNumber || !vehiclePlate) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({
      where: { email }
    })

    if (exists) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    let driverStatus = 'PENDING'
    if (process.env.AUTO_APPROVE_DRIVERS === 'true' || isVerified === true) {
      driverStatus = 'APPROVED'
    }

    // Create user and driver profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "DRIVER",
          dropsBalance: 0
        }
      })

      await tx.driverProfile.create({
        data: {
          userId: newUser.id,
          phone,
          area,
          availability,
          bio,
          licenseNumber,
          vehicleMake,
          vehicleModel,
          vehicleColor,
          vehiclePlate,
          status: driverStatus
        }
      })

      return newUser
    })

    if (driverStatus === 'APPROVED') {
      await sendEmail(email, 'DriverApproved', { name, phone, vehiclePlate })
    } else {
      await sendEmail(email, 'DriverApplicationReceived', { name, phone, vehiclePlate })
      await sendEmail('admin@tovedrop.com', 'AdminNewApplication', { name, email, phone })
    }

    return NextResponse.json({ 
      message: "Driver application submitted successfully", 
      autoApproved: driverStatus === 'APPROVED'
    }, { status: 201 })
  } catch (error: any) {
    console.error("Driver application error:", error)
    return NextResponse.json({ message: "Error submitting application", error: error.message }, { status: 500 })
  }
}
