import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, university, password } = await req.json()
    
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({
      where: { email }
    })

    if (exists) {
      if (!exists.password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword, name }
        })
        return NextResponse.json({ message: "Password set for existing account" }, { status: 201 })
      }
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        university,
        password: hashedPassword,
        role: "RIDER", // Default
      }
    })

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("REGISTER ERROR:", error)
    return NextResponse.json({ message: "Error registering user", error }, { status: 500 })
  }
}
