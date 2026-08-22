'use client';

import { Music, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SpotifyConnect({ isConnected }: { isConnected: boolean }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const spotifyParam = searchParams?.get('spotify');
    if (spotifyParam === 'success') setStatus('success');
    if (spotifyParam === 'error') setStatus('error');
  }, [searchParams]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
          <Music className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Spotify Jukebox</h3>
          <p className="text-xs text-muted-foreground">Allow riders to queue songs on your car stereo</p>
        </div>
      </div>

      {isConnected ? (
        <div className="bg-surface-card border border-border rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Spotify Connected
          </div>
          <button 
            onClick={() => window.location.href = '/api/spotify/auth'}
            className="text-xs font-semibold text-foreground hover:text-green-500 transition-colors"
          >
            Reconnect
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => window.location.href = '/api/spotify/auth'}
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Music className="w-4 h-4" />
            Connect with Spotify
          </button>
          
          {status === 'success' && (
            <p className="text-xs text-green-500 mt-2 text-center">Successfully connected to Spotify!</p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-500 mt-2 text-center">Failed to connect to Spotify. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
