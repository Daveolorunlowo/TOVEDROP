import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId, action } = await request.json();
    if (!alertId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'dismiss') {
      await prisma.anomalyAlert.update({
        where: { id: alertId },
        data: { status: 'DISMISSED' }
      });
      return NextResponse.json({ success: true, message: 'Alert dismissed' });
    }

    if (action === 'suspend') {
      // 1. Get the alert to find affected users
      const alert = await prisma.anomalyAlert.findUnique({ where: { id: alertId } });
      if (!alert || !alert.affectedUsers) {
        return NextResponse.json({ error: 'Alert or affected users not found' }, { status: 404 });
      }

      const userIds = JSON.parse(alert.affectedUsers);
      
      // 2. Suspend drivers (if any of them are drivers)
      if (userIds.length > 0) {
        await prisma.driverProfile.updateMany({
          where: { userId: { in: userIds } },
          data: { status: 'SUSPENDED' }
        });
      }

      // 3. Mark alert as resolved
      await prisma.anomalyAlert.update({
        where: { id: alertId },
        data: { status: 'RESOLVED' }
      });

      return NextResponse.json({ success: true, message: 'Affected drivers suspended' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[ANOMALY_ACTION_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
