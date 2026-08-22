'use client';

import { useState, useEffect } from 'react';
import { Music, Search, Plus, Check, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export function SpotifyPlayer({ tripId }: { tripId: string }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const searchSpotify = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}&tripId=${tripId}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.tracks?.items || []);
        }
      } catch (err) {
        console.error('Failed to search tracks', err);
      } finally {
        setLoading(false);
      }
    };

    searchSpotify();
  }, [debouncedQuery, tripId]);

  const handleQueue = async (track: any) => {
    try {
      setQueued(prev => ({ ...prev, [track.uri]: 'loading' as any }));
      const res = await fetch('/api/spotify/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUri: track.uri, tripId }),
      });

      if (res.ok) {
        setQueued(prev => ({ ...prev, [track.uri]: true }));
        setTimeout(() => {
          setQueued(prev => {
            const next = { ...prev };
            delete next[track.uri];
            return next;
          });
        }, 3000);
      } else {
        setQueued(prev => {
          const next = { ...prev };
          delete next[track.uri];
          return next;
        });
        alert('Failed to queue track. Driver may not be playing music right now.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden mt-4 shadow-sm">
      <div className="bg-[#1DB954]/10 p-4 border-b border-[#1DB954]/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg shadow-[#1DB954]/30">
          <Music className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            Spotify Jukebox
          </h3>
          <p className="text-xs text-muted-foreground">Queue a song on your driver's stereo</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song or artist..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#1DB954] transition-colors"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#1DB954]" />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {results.map((track) => (
              <div key={track.uri} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  {track.album?.images?.[0]?.url ? (
                    <img src={track.album.images[0].url} alt="Album Art" className="w-10 h-10 rounded shadow" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-surface-elevated flex items-center justify-center">
                      <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate text-foreground">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists.map((a: any) => a.name).join(', ')}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleQueue(track)}
                  disabled={!!queued[track.uri]}
                  className="flex-shrink-0 ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated hover:bg-[#1DB954] hover:text-black transition-colors disabled:opacity-100 disabled:bg-green-500/20 disabled:text-green-500"
                >
                  {queued[track.uri] === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : queued[track.uri] === true ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No songs found.</p>
        )}
      </div>
    </div>
  );
}
