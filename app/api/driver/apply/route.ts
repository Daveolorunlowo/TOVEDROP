import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import { pusherServer } from '@/lib/pusher'
import { sendWebPush } from '@/lib/webpush'

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
      await sendEmail(email, 'DriverApproved', JSON.stringify({ name, phone, vehiclePlate }))
    } else {
      await sendEmail(email, 'DriverApplicationReceived', JSON.stringify({ name, phone, vehiclePlate }))
      await sendEmail('admin@tovedrop.com', 'AdminNewApplication', JSON.stringify({ name, email, phone }))
    }

    // Immediate alert to Admins in real-time
    try {
      const adminTasks: Promise<any>[] = []
      if (pusherServer) {
        adminTasks.push(
          pusherServer.trigger('admin-alerts', 'new-driver-application', {
            userId: user.id,
            name,
            email,
            phone,
            vehiclePlate,
            createdAt: new Date().toISOString()
          }).catch(e => console.error("Pusher admin alert failed:", e))
        )
      }
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      adminTasks.push(
        ...admins.map(a => sendWebPush(a.id, "New Driver Application 📝", `${name} applied to be a driver.`, "/admin?tab=approvals"))
      )
      await Promise.race([
        Promise.allSettled(adminTasks),
        new Promise(r => setTimeout(r, 500))
      ])
    } catch (e) {
      console.error("Admin application notify error:", e)
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
