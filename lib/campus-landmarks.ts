// Placeholder coordinates inside the BOWEN_BOUNDS (around 7.62, 4.18)
const PLACEHOLDER_LAT = 7.6236;
const PLACEHOLDER_LNG = 4.1890;

// Adding a tiny random offset so they don't all perfectly overlap 
// while using placeholders
const getPhLat = (i: number) => PLACEHOLDER_LAT + (i * 0.0001);
const getPhLng = (i: number) => PLACEHOLDER_LNG + (i * 0.0001);

export const CAMPUS_LANDMARKS = [
  { label: 'Main Gate', lat: 7.6236, lng: 4.1890 }, // Keep existing known roughly
  { label: 'UPE 1', lat: getPhLat(1), lng: getPhLng(1) },
  { label: 'UPE 2', lat: getPhLat(2), lng: getPhLng(2) },
  { label: 'UPE 3', lat: getPhLat(3), lng: getPhLng(3) },
  { label: 'UPE 4', lat: getPhLat(4), lng: getPhLng(4) },
  { label: 'New Hostel (Male)', lat: 7.6250, lng: 4.1900 },
  { label: 'New Hostel (Female)', lat: getPhLat(5), lng: getPhLng(5) },
  { label: 'Old Hostel', lat: 7.6220, lng: 4.1880 },
  { label: 'Chapel', lat: 7.6240, lng: 4.1910 },
  { label: 'Health Centre', lat: 7.6230, lng: 4.1870 },
  { label: 'Sports Complex', lat: 7.6260, lng: 4.1890 },
  { label: 'Library', lat: getPhLat(6), lng: getPhLng(6) },
  { label: 'Senate Building', lat: getPhLat(7), lng: getPhLng(7) },
  { label: 'College of Health Sciences', lat: getPhLat(8), lng: getPhLng(8) },
  { label: 'Faculty of Law', lat: getPhLat(9), lng: getPhLng(9) },
  { label: 'Faculty of Science and Science Education', lat: getPhLat(10), lng: getPhLng(10) },
  { label: 'Faculty of Social and Management Sciences', lat: getPhLat(11), lng: getPhLng(11) },
  { label: 'Faculty of Agriculture', lat: getPhLat(12), lng: getPhLng(12) },
  { label: 'Cafeteria', lat: getPhLat(13), lng: getPhLng(13) },
  { label: 'Bowen University Teaching Hospital', lat: getPhLat(14), lng: getPhLng(14) },
];

export function getCampusLandmarks() {
  return CAMPUS_LANDMARKS;
}
