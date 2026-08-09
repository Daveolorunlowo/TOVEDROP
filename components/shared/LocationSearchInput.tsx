import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { searchLocation } from '@/lib/geocode';
import { Input } from '@/components/ui/input';

interface SearchResult {
  label: string;
  lat: number;
  lng: number;
}

interface LocationSearchInputProps {
  placeholder?: string;
  value?: string;
  onSelect: (result: SearchResult) => void;
  className?: string;
  icon?: React.ReactNode;
  onFocus?: () => void;
  onChangeText?: (text: string) => void;
}

export function LocationSearchInput({ placeholder = "Search for a location on campus...", value = '', onSelect, className = '', icon, onFocus, onChangeText }: LocationSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal input state with external value when it changes (e.g. map click)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // We only want to search if the user typed something new and it's not just the prop updating
    if (query === value) return;

    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setSearched(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setSearched(false);
    setOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchLocation(query);
        if (!abortControllerRef.current?.signal.aborted) {
          setResults(res);
          setSearched(true);
          setLoading(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setResults([]);
        setSearched(true);
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.label);
    setOpen(false);
    onSelect(result);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        {icon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onChangeText) onChangeText(e.target.value);
          }}
          onFocus={() => { 
            if (query.trim() && results.length > 0) setOpen(true); 
            if (onFocus) onFocus();
          }}
          className="pl-9 pr-9 bg-background"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim() && !loading && searched && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="px-3 py-2 hover:bg-muted cursor-pointer flex items-start gap-2"
                  onClick={() => handleSelect(r)}
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span className="text-sm line-clamp-2">{r.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div 
              className="p-4 text-sm text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                setOpen(false);
                document.getElementById('map-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <div className="font-medium text-text-primary mb-1">Location not found</div>
              <div className="text-muted-foreground">
                We don't have this location saved yet. Please tap the exact spot on the map below to set it precisely.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
