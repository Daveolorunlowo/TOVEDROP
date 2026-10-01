import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const email = "testdriver@tovedrop.com"
    const password = "password123"
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Test Driver",
          email,
          password: hashedPassword,
          role: "DRIVER",
          dropsBalance: 0,
          driverProfile: {
            create: {
              status: "APPROVED",
              phone: "555-0199",
              licenseNumber: "TEST-LICENSE-001",
              vehiclePlate: "TEST-PLATE",
            }
          }
        }
      })
    } else {
      // Ensure they are approved driver
      await prisma.user.update({
        where: { email },
        data: { role: "DRIVER" }
      })
      await prisma.driverProfile.upsert({
        where: { userId: user.id },
        update: { status: "APPROVED" },
        create: {
          userId: user.id,
          status: "APPROVED",
          licenseNumber: "TEST-LICENSE-001",
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Test driver created successfully!",
      credentials: { email, password }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
    }, { status: 500 })
  }
}
