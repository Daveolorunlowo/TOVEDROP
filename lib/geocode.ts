import { getCampusLandmarks } from './campus-landmarks'

export async function searchLocation(query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const localMatches = getCampusLandmarks().filter(l => 
    l.label.toLowerCase().includes(q)
  )

  const BOWEN_VIEWBOX = '4.1730,7.6400,4.2050,7.6080'; // west,north,east,south
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&format=json&` +
      `viewbox=${BOWEN_VIEWBOX}&bounded=1&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TOVEDROP/1.0 (contact@tovedrop.com)'
      }
    });
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const results = await response.json();
    const externalMatches = results.map((r: any) => ({
      label: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon)
    }));

    // Combine, prioritizing local matches
    return [...localMatches, ...externalMatches];
  } catch (err) {
    // If external fails, at least return local matches
    return localMatches;
  }
}

export async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${lat}&lon=${lng}&format=json&zoom=18`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TOVEDROP/1.0 (contact@tovedrop.com)'
      }
    });
    
    if (!response.ok) throw new Error('Reverse geocoding failed');
    
    const result = await response.json();
    if (result && result.display_name) {
      // Clean up the display name to remove "Bowen University" repeats if possible
      return result.display_name.split(',')[0]; 
    }
  } catch (err) {
    console.error("Reverse geocoding error:", err);
  }
  return `Custom location (map pin)`;
}
