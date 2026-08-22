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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const tripId = searchParams.get('tripId');

    if (!query || !tripId) {
      return NextResponse.json({ error: 'Missing query or tripId' }, { status: 400 });
    }

    // Ensure the user is a rider on this trip (or the driver)
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

    // Perform Spotify Search
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Failed to search Spotify' }, { status: searchRes.status });
    }

    const data = await searchRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Spotify Search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
