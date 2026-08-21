import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, minutesBefore } = await req.json();

    if (!tripId || minutesBefore === undefined) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    await prisma.alarmLog.upsert({
      where: {
        tripId_minutesBefore: {
          tripId,
          minutesBefore
        }
      },
      update: {
        firedAt: new Date()
      },
      create: {
        tripId,
        driverId: session.user.id,
        minutesBefore,
        firedAt: new Date()
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error logging alarm:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
