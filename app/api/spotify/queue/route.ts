import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

async function getSpotifyAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  return data.access_token || null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackUri, tripId } = await req.json();

    if (!trackUri || !tripId) {
      return NextResponse.json({ error: 'Missing trackUri or tripId' }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: { include: { driverProfile: true } },
      },
    });

    if (!trip || !trip.driver?.driverProfile?.spotifyRefreshToken) {
      return NextResponse.json({ error: 'Trip not found or driver has no Spotify connected' }, { status: 404 });
    }

    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this trip' }, { status: 403 });
    }

    const accessToken = await getSpotifyAccessToken(trip.driver.driverProfile.spotifyRefreshToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to refresh Spotify token' }, { status: 500 });
    }

    // Add track to Spotify queue
    const queueRes = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!queueRes.ok) {
      // If the driver is not currently playing Spotify on an active device, this might fail (404 Not Found)
      return NextResponse.json({ error: 'Driver does not have an active Spotify playback session running.' }, { status: queueRes.status });
    }

    return NextResponse.json({ success: true, message: 'Track queued successfully!' });

  } catch (error) {
    console.error('Spotify Queue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
