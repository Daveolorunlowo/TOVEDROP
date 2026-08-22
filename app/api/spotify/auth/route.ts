import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized. Must be a driver.' }, { status: 401 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Spotify integration not configured.' }, { status: 500 });
    }

    // Set up OAuth URL
    const scope = 'user-read-playback-state user-modify-playback-state';
    // Ensure this matches your Spotify App settings precisely
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`
      : 'http://127.0.0.1:3001/api/spotify/callback';

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('redirect_uri', redirectUri);

    // Redirect the driver to Spotify
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('Spotify Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
