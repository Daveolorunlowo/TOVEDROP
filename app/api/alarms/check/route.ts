import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('tripId');
    const minutes = searchParams.get('minutes');

    if (!tripId || !minutes) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const minutesBefore = parseInt(minutes, 10);

    const log = await prisma.alarmLog.findUnique({
      where: {
        tripId_minutesBefore: {
          tripId,
          minutesBefore
        }
      }
    });

    if (!log) {
      return NextResponse.json({ alreadyFired: false });
    }

    // Check if it was snoozed and the snooze time has elapsed (5 mins)
    if (log.snoozedAt) {
      const now = new Date();
      const snoozeElapsed = (now.getTime() - new Date(log.snoozedAt).getTime()) / 60000;
      if (snoozeElapsed >= 5 && !log.dismissed) {
        return NextResponse.json({ alreadyFired: false }); // Needs to fire again
      }
    }

    return NextResponse.json({ alreadyFired: true });
  } catch (error: any) {
    console.error('Error checking alarm:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
