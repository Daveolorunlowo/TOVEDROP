import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pageKey, skipped } = body;

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey is required' }, { status: 400 });
    }

    const progress = await prisma.guideProgress.upsert({
      where: {
        userId_pageKey: {
          userId: session.user.id,
          pageKey,
        },
      },
      update: {
        completed: !skipped,
        skipped: !!skipped,
        completedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        pageKey,
        completed: !skipped,
        skipped: !!skipped,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error saving guide progress:', error);
    return NextResponse.json({ error: 'Failed to save guide progress' }, { status: 500 });
  }
}
