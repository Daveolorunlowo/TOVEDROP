const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const BASE_DIR = path.join(__dirname, '..', 'public', 'favicons');
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

// 100 x 161.8 drop centered in 256x256
// Top: (128, 47.1)
// Bottom: (128, 208.9)
// Left/Right at widest: 78, 178
// Golden point: X = 78 + 61.8 = 139.8. Y = 47.1 + 61.8 = 108.9.
// Negative space circle at golden point with radius 9 (ensures it's at least ~1.12px at 16x16)

const dropPath = `M 128,47.1 C 128,100 78,125 78,158.9 C 78,186.5 100.4,208.9 128,208.9 C 155.6,208.9 178,186.5 178,158.9 C 178,125 128,100 128,47.1 Z`;
// To subtract the circle, we must draw it in the opposite direction (counter-clockwise)
// Arc command: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
const r = 10; // larger radius for clarity at 16px
const cx = 139.8;
const cy = 108.9;
// A counter-clockwise circle starting at (cx+r, cy)
const circlePath = `M ${cx+r},${cy} A ${r},${r} 0 1,0 ${cx-r},${cy} A ${r},${r} 0 1,0 ${cx+r},${cy} Z`;

const colors = [
  { name: 'purple', hex: '#8B5CF6' },
  { name: 'orange', hex: '#F97316' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'black', hex: '#000000' }
];

const sizes = [16, 32, 180, 192, 512];

async function generate() {
  for (const color of colors) {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
      <path d="${dropPath} ${circlePath}" fill="${color.hex}" fill-rule="evenodd" />
    </svg>`;
    
    const svgPath = path.join(BASE_DIR, `favicon-${color.name}.svg`);
    fs.writeFileSync(svgPath, svgStr);
    
    console.log(`Created ${svgPath}`);

    for (const size of sizes) {
      const pngPath = path.join(BASE_DIR, `favicon-${color.name}-${size}x${size}.png`);
      await sharp(Buffer.from(svgStr))
        .resize(size, size, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
        .png()
        .toFile(pngPath);
      console.log(`Created ${pngPath}`);
    }

    // Generate .ico
    const png32 = path.join(BASE_DIR, `favicon-${color.name}-32x32.png`);
    const png16 = path.join(BASE_DIR, `favicon-${color.name}-16x16.png`);
    const icoPath = path.join(BASE_DIR, `favicon-${color.name}.ico`);
    
    try {
      const buf = await pngToIco.default([png32, png16]);
      fs.writeFileSync(icoPath, buf);
      console.log(`Created ${icoPath}`);
    } catch (err) {
      console.error(`Failed to create .ico for ${color.name}`, err);
    }
  }

  // Update default public favicons with primary purple
  console.log('Setting default favicons...');
  const defaultIco = path.join(__dirname, '..', 'app', 'favicon.ico');
  const defaultIconPng = path.join(__dirname, '..', 'app', 'icon.png');
  
  fs.copyFileSync(path.join(BASE_DIR, 'favicon-purple.ico'), defaultIco);
  fs.copyFileSync(path.join(BASE_DIR, 'favicon-purple-512x512.png'), defaultIconPng);
  fs.copyFileSync(path.join(BASE_DIR, 'favicon-purple-180x180.png'), path.join(__dirname, '..', 'public', 'apple-icon.png'));
  fs.copyFileSync(path.join(BASE_DIR, 'favicon-purple-192x192.png'), path.join(__dirname, '..', 'public', 'icon-192x192.png'));
  fs.copyFileSync(path.join(BASE_DIR, 'favicon-purple-512x512.png'), path.join(__dirname, '..', 'public', 'icon-512x512.png'));
  
  console.log('All favicons generated successfully!');
}

generate().catch(console.error);
