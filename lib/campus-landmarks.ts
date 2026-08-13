// Placeholder coordinates inside the BOWEN_BOUNDS (around 7.62, 4.18)
const PLACEHOLDER_LAT = 7.6236;
const PLACEHOLDER_LNG = 4.1890;

// Adding a tiny random offset so they don't all perfectly overlap 
// while using placeholders
const getPhLat = (i: number) => PLACEHOLDER_LAT + (i * 0.0001);
const getPhLng = (i: number) => PLACEHOLDER_LNG + (i * 0.0001);

export const CAMPUS_LANDMARKS = [
  // --- Main Entrances ---
  { label: 'Main Gate', lat: 7.6236, lng: 4.1890 }, 

  // --- Hostels & Halls of Residence ---
  { label: 'Gamaliel Onosode Hall', lat: getPhLat(1), lng: getPhLng(1) },
  { label: 'John Hall', lat: getPhLat(2), lng: getPhLng(2) },
  { label: 'Matthew Hall', lat: getPhLat(3), lng: getPhLng(3) },
  { label: 'Mark Hall', lat: getPhLat(4), lng: getPhLng(4) },
  { label: 'Luke Hall', lat: getPhLat(5), lng: getPhLng(5) },
  { label: 'UPE 1', lat: getPhLat(6), lng: getPhLng(6) },
  { label: 'UPE 2', lat: getPhLat(7), lng: getPhLng(7) },
  { label: 'UPE 3', lat: getPhLat(8), lng: getPhLng(8) },
  { label: 'UPE 4', lat: getPhLat(9), lng: getPhLng(9) },
  { label: 'New Hostel (Male)', lat: 7.6250, lng: 4.1900 },
  { label: 'New Hostel (Female)', lat: getPhLat(10), lng: getPhLng(10) },
  { label: 'Old Hostel', lat: 7.6220, lng: 4.1880 },
  
  // --- Academic Buildings & Colleges ---
  { label: 'College of Agriculture, Engineering & Sciences', lat: getPhLat(11), lng: getPhLng(11) },
  { label: 'College of Computing & Communication Studies', lat: getPhLat(12), lng: getPhLng(12) },
  { label: 'College of Environmental Sciences', lat: getPhLat(13), lng: getPhLng(13) },
  { label: 'College of Health Sciences', lat: getPhLat(14), lng: getPhLng(14) },
  { label: 'College of Law', lat: getPhLat(15), lng: getPhLng(15) },
  { label: 'College of Liberal Studies', lat: getPhLat(16), lng: getPhLng(16) },
  { label: 'College of Management & Social Sciences', lat: getPhLat(17), lng: getPhLng(17) },
  { label: 'College of Postgraduate Studies', lat: getPhLat(18), lng: getPhLng(18) },
  
  // --- Administrative & Facilities ---
  { label: 'Administration Building (Senate)', lat: getPhLat(19), lng: getPhLng(19) },
  { label: 'Timothy Olagbemiro Library', lat: getPhLat(20), lng: getPhLng(20) },
  { label: 'University Worship Center (Chapel)', lat: 7.6240, lng: 4.1910 },
  { label: 'Health Centre', lat: 7.6230, lng: 4.1870 },
  { label: 'Sports Complex', lat: 7.6260, lng: 4.1890 },
  { label: 'Cafeteria', lat: getPhLat(21), lng: getPhLng(21) },
  { label: 'Bowen University Teaching Hospital (Ogbomoso)', lat: getPhLat(22), lng: getPhLng(22) },
];

export function getCampusLandmarks() {
  return CAMPUS_LANDMARKS;
}
