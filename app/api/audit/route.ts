import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({
    include: { driverProfile: true, accounts: true, sessions: true }
  })
  return NextResponse.json(users)
}
