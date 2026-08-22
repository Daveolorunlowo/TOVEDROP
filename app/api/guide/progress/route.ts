import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await prisma.guideProgress.findMany({
      where: { userId: session.user.id },
      select: { pageKey: true, completed: true, skipped: true }
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching guide progress:', error);
    return NextResponse.json({ error: 'Failed to fetch guide progress' }, { status: 500 });
  }
}
