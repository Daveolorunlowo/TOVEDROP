import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { withValidation } from '@/lib/with-validation'

const bankSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(10, "Valid account number is required"),
  accountName: z.string().min(2, "Account name is required")
})

export const POST = withValidation(bankSchema, async (req: NextRequest, data) => {
 try {
 const session = await getServerSession(authOptions)
 if (!session || !session.user || session.user.role !== "DRIVER") {
 return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
 }

 const { bankName, accountNumber, accountName } = data

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
