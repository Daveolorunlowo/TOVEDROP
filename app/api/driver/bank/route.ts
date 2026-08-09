import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "DRIVER") {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { bankName, accountNumber, accountName } = await req.json()

    await prisma.driverProfile.update({
      where: { userId: session.user.id },
      data: { bankName, accountNumber, accountName }
    })

    return NextResponse.json({ message: 'Bank details saved' }, { status: 200 })
  } catch (error) {
    console.error('Error saving bank details', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
