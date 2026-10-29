import { NextResponse } from 'next/server';
import { expireAllPendingTripsPastPickup } from '@/lib/trip-expiration';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expiredCount = await expireAllPendingTripsPastPickup();
    return NextResponse.json({ success: true, expiredCount });
  } catch (error: any) {
    console.error('[CRON_EXPIRE_TRIPS]', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
