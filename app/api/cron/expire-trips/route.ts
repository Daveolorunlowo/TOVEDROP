import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWebPush } from '@/lib/webpush';
import { subMinutes } from 'date-fns';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const thirtyMinutesAgo = subMinutes(new Date(), 30);

    const expiredTrips = await prisma.trip.findMany({
      where: {
        status: 'PENDING',
        OR: [
          {
            isScheduled: false,
            createdAt: { lte: thirtyMinutesAgo }
          },
          {
            isScheduled: true,
            scheduledDateTime: { lte: thirtyMinutesAgo }
          }
        ]
      }
    });

    let expiredCount = 0;

    for (const trip of expiredTrips) {
      try {
        await prisma.$transaction(async (tx) => {
          const t = await tx.trip.findUnique({ where: { id: trip.id } });
          if (!t || t.status !== 'PENDING') return;

          await tx.trip.update({
            where: { id: t.id },
            data: { status: 'CANCELLED' }
          });

          if (t.dropLotId) {
            await tx.dropLot.update({
              where: { id: t.dropLotId },
              data: { remainingDrops: { increment: 1 } }
            });

            await tx.user.update({
              where: { id: t.riderId },
              data: { dropsBalance: { increment: 1 } }
            });

            await tx.dropTransaction.create({
              data: {
                userId: t.riderId,
                type: 'REFUND',
                amount: 1,
                package: null,
                reference: `expire_refund_${t.id}`
              }
            });
          }
        });
        
        const title = 'Ride Request Expired';
        const message = trip.dropLotId 
          ? `Your ride request for ${trip.date} at ${trip.time} expired because no driver picked it up. Your 1 Drop has been refunded.`
          : `Your ride request for ${trip.date} at ${trip.time} expired because no driver picked it up.`;
        
        await sendWebPush(trip.riderId, title, message, `/dashboard/trips/${trip.id}`);
        
        expiredCount++;
      } catch (txError) {
        console.error(`Failed to expire trip ${trip.id}:`, txError);
      }
    }

    return NextResponse.json({ success: true, expiredCount });
  } catch (error: any) {
    console.error('[CRON_EXPIRE_TRIPS]', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
