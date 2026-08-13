import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          driverPercentage: 70,
          adminPercentage: 10,
          companyPercentage: 20
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { driverPercentage, adminPercentage, companyPercentage } = await req.json()

    if (
      typeof driverPercentage !== 'number' ||
      typeof adminPercentage !== 'number' ||
      typeof companyPercentage !== 'number'
    ) {
      return NextResponse.json({ message: 'Invalid data types' }, { status: 400 })
    }

    if (driverPercentage + adminPercentage + companyPercentage !== 100) {
      return NextResponse.json({ message: 'Percentages must add up to 100' }, { status: 400 })
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        driverPercentage,
        adminPercentage,
        companyPercentage
      },
      create: {
        id: 'default',
        driverPercentage,
        adminPercentage,
        companyPercentage
      }
    })

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
