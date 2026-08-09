import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, email, password, phone, area, bio, licenseNumber, vehicleMake, vehicleModel, vehicleColor, vehiclePlate } = data

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

    const driverStatus = process.env.AUTO_APPROVE_DRIVERS === 'true' ? 'APPROVED' : 'PENDING'

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

    if (process.env.AUTO_APPROVE_DRIVERS === 'true') {
      await sendEmail(email, 'DriverApproved', { name, phone, vehiclePlate })
    } else {
      await sendEmail(email, 'DriverApplicationReceived', { name, phone, vehiclePlate })
      await sendEmail('admin@tovedrop.com', 'AdminNewApplication', { name, email, phone })
    }

    return NextResponse.json({ 
      message: "Driver application submitted successfully", 
      autoApproved: process.env.AUTO_APPROVE_DRIVERS === 'true' 
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error submitting application", error: error.message }, { status: 500 })
  }
}
