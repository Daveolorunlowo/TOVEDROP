import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import { pusherServer } from '@/lib/pusher'
import { sendWebPush } from '@/lib/webpush'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const data = await req.json()
    const { name, email, password, phone, area, availability, bio, licenseNumber, vehicleMake, vehicleModel, vehicleColor, vehiclePlate, isVerified } = data

    const targetName = session?.user?.name || name
    const targetEmail = session?.user?.email || email

    if (!targetName || !targetEmail || !licenseNumber || !vehiclePlate) {
      return NextResponse.json({ message: "Missing required fields (Name, Email, License, Vehicle Plate)" }, { status: 400 })
    }

    if (!session?.user && !password) {
      return NextResponse.json({ message: "Password is required for new registration" }, { status: 400 })
    }

    let driverStatus = 'PENDING'
    if (process.env.AUTO_APPROVE_DRIVERS === 'true' || isVerified === true) {
      driverStatus = 'APPROVED'
    }

    let user: any = null

    if (session?.user?.id) {
      // 1. Existing logged-in user applying to be a driver
      const existingProfile = await prisma.driverProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (existingProfile) {
        return NextResponse.json({ 
          message: `You have already applied! Your driver status is currently: ${existingProfile.status}`,
          status: existingProfile.status 
        }, { status: 400 })
      }

      user = await prisma.$transaction(async (tx) => {
        await tx.driverProfile.create({
          data: {
            userId: session.user.id,
            phone: phone || '',
            area: area || 'Main Campus',
            availability: availability || 'All Days',
            bio: bio || '',
            licenseNumber,
            vehicleMake: vehicleMake || 'Vehicle',
            vehicleModel: vehicleModel || '',
            vehicleColor: vehicleColor || 'Unknown',
            vehiclePlate,
            status: driverStatus
          }
        })

        if (driverStatus === 'APPROVED') {
          await tx.user.update({
            where: { id: session.user.id },
            data: { role: 'DRIVER' }
          })
        }

        return tx.user.findUnique({ where: { id: session.user.id } })
      })
    } else {
      // 2. New guest registration
      const exists = await prisma.user.findUnique({
        where: { email: targetEmail }
      })

      if (exists) {
        return NextResponse.json({ message: "An account with this email already exists. Please sign in to apply." }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: targetName,
            email: targetEmail,
            password: hashedPassword,
            role: driverStatus === 'APPROVED' ? "DRIVER" : "RIDER",
            dropsBalance: 0
          }
        })

        await tx.driverProfile.create({
          data: {
            userId: newUser.id,
            phone: phone || '',
            area: area || 'Main Campus',
            availability: availability || 'All Days',
            bio: bio || '',
            licenseNumber,
            vehicleMake: vehicleMake || 'Vehicle',
            vehicleModel: vehicleModel || '',
            vehicleColor: vehicleColor || 'Unknown',
            vehiclePlate,
            status: driverStatus
          }
        })

        return newUser
      })
    }

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
