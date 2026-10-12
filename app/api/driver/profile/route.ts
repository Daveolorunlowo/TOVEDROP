import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "DRIVER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
            whatsappNotificationsEnabled: true
          }
        },
        withdrawalRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!driverProfile) {
      // Auto-create missing profile if they are already a DRIVER
      driverProfile = await prisma.driverProfile.create({
        data: {
          userId: session.user.id,
          status: "APPROVED"
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
              whatsappNotificationsEnabled: true
            }
          },
          withdrawalRequests: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    }

    return NextResponse.json({ driverProfile }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching profile", error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "DRIVER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      phoneNumber,
      whatsappNotificationsEnabled,
      phone,
      area,
      bio,
      licenseNumber,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehicleType,
      vehiclePlate,
      availability,
      preferredAreas,
      bankName,
      accountNumber,
      accountName,
      alarmEnabled,
      alarmTimes,
      alarmSound,
      alarmVibrate
    } = body

    // 1. Update user fields if provided
    const userUpdate: any = {}
    if (typeof name === 'string' && name.trim()) userUpdate.name = name.trim()
    if (typeof phoneNumber === 'string') userUpdate.phoneNumber = phoneNumber.trim()
    if (typeof whatsappNotificationsEnabled === 'boolean') {
      userUpdate.whatsappNotificationsEnabled = whatsappNotificationsEnabled
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdate
      })
    }

    // 2. Update driver profile fields
    const driverUpdate: any = {}
    if (phone !== undefined) driverUpdate.phone = phone
    if (area !== undefined) driverUpdate.area = area
    if (bio !== undefined) driverUpdate.bio = bio
    if (licenseNumber !== undefined) driverUpdate.licenseNumber = licenseNumber
    if (vehicleMake !== undefined) driverUpdate.vehicleMake = vehicleMake
    if (vehicleModel !== undefined) driverUpdate.vehicleModel = vehicleModel
    if (vehicleColor !== undefined) driverUpdate.vehicleColor = vehicleColor
    if (vehicleType !== undefined) driverUpdate.vehicleType = vehicleType
    if (vehiclePlate !== undefined) driverUpdate.vehiclePlate = vehiclePlate
    if (availability !== undefined) driverUpdate.availability = availability
    if (preferredAreas !== undefined) driverUpdate.preferredAreas = preferredAreas
    if (bankName !== undefined) driverUpdate.bankName = bankName
    if (accountNumber !== undefined) driverUpdate.accountNumber = accountNumber
    if (accountName !== undefined) driverUpdate.accountName = accountName
    if (typeof alarmEnabled === 'boolean') driverUpdate.alarmEnabled = alarmEnabled
    if (Array.isArray(alarmTimes)) driverUpdate.alarmTimes = alarmTimes
    if (typeof alarmSound === 'string') driverUpdate.alarmSound = alarmSound
    if (typeof alarmVibrate === 'boolean') driverUpdate.alarmVibrate = alarmVibrate

    const updatedProfile = await prisma.driverProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        status: "APPROVED",
        ...driverUpdate
      },
      update: driverUpdate,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
            whatsappNotificationsEnabled: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Driver profile and settings updated successfully",
      driverProfile: updatedProfile 
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error updating driver profile:", error)
    return NextResponse.json({ message: "Error updating profile", error: error.message }, { status: 500 })
  }
}
