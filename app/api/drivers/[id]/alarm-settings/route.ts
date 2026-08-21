import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.id !== params.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { alarmEnabled, alarmTimes, alarmSound, alarmVibrate } = body;

    const updatedProfile = await prisma.driverProfile.update({
      where: { userId: params.id },
      data: {
        ...(alarmEnabled !== undefined && { alarmEnabled }),
        ...(alarmTimes !== undefined && { alarmTimes }),
        ...(alarmSound !== undefined && { alarmSound }),
        ...(alarmVibrate !== undefined && { alarmVibrate })
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating driver alarm settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
