/**
 * TOVEDROP Favicon Generator
 * ===========================
 * Generates PNG files at all required sizes and an ICO file
 * from the SVG master files in public/favicons/
 *
 * Usage: node scripts/generate-favicons.mjs [approach]
 *   approach: 1 | 2 | all (default: all)
 *
 * Requires: sharp, png-to-ico (both in devDependencies)
 */

import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const FAVICONS_DIR = path.join(ROOT, 'public', 'favicons')
const PUBLIC_DIR = path.join(ROOT, 'public')

// ── Sizes to generate ──────────────────────────────────────────────────────
const SIZES = [16, 32, 180, 192, 512]

// ── All color variants ─────────────────────────────────────────────────────
const COLORS = ['purple', 'orange', 'white', 'black']

// ── Which approach to use as the MAIN favicon ──────────────────────────────
const MAIN_APPROACH = process.argv[2] === '2' ? 'a2' : 'a1'

console.log(`\n🎨 TOVEDROP Favicon Generator`)
console.log(`   Main approach: ${MAIN_APPROACH === 'a1' ? '1 (Discovered T)' : '2 (Dripping T)'}`)
console.log(`   Output: ${FAVICONS_DIR}\n`)

// ── Convert SVG → PNG at a given size ────────────────────────────────────
async function svgToPng(svgPath, outPath, size) {
  const svgBuffer = fs.readFileSync(svgPath)

  // For very small sizes (16, 32), add slight padding and ensure crisp render
  const density = size <= 32 ? 300 : 150

  await sharp(svgBuffer, { density })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent background
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath)
}

// ── Generate all PNGs ──────────────────────────────────────────────────────
async function generateAllPngs() {
  let generated = 0

  for (const approach of ['a1', 'a2']) {
    for (const color of COLORS) {
      const svgPath = path.join(FAVICONS_DIR, `${approach}-${color}.svg`)
      if (!fs.existsSync(svgPath)) {
        console.warn(`  ⚠️  Missing: ${approach}-${color}.svg`)
        continue
      }

      for (const size of SIZES) {
        const outName = `${approach}-${color}-${size}.png`
        const outPath = path.join(FAVICONS_DIR, outName)
        await svgToPng(svgPath, outPath, size)
        console.log(`  ✓  ${outName}`)
        generated++
      }
    }
  }

  console.log(`\n  Generated ${generated} PNGs\n`)
}

// ── Generate ICO file (16 + 32 px embedded) ───────────────────────────────
async function generateIco(approach, color = 'purple') {
  const png16Path = path.join(FAVICONS_DIR, `${approach}-${color}-16.png`)
  const png32Path = path.join(FAVICONS_DIR, `${approach}-${color}-32.png`)

  const [png16, png32] = [fs.readFileSync(png16Path), fs.readFileSync(png32Path)]

  const icoBuffer = await pngToIco([png16, png32])
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico')
  fs.writeFileSync(icoPath, icoBuffer)
  console.log(`  ✓  favicon.ico  (from ${approach}-${color}, 16+32px embedded)`)
}

// ── Copy main icons into the public/ root ────────────────────────────────
async function copyMainIcons(approach) {
  const copies = [
    { src: `${approach}-purple-192.png`, dst: 'icon-192x192.png' },
    { src: `${approach}-purple-512.png`, dst: 'icon-512x512.png' },
    { src: `${approach}-purple-180.png`, dst: 'apple-icon.png' },
  ]

  for (const { src, dst } of copies) {
    const srcPath = path.join(FAVICONS_DIR, src)
    const dstPath = path.join(PUBLIC_DIR, dst)
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, dstPath)
      console.log(`  ✓  public/${dst}  (from ${src})`)
    }
  }
}

// ── Also copy main SVG as icon.svg for the app ───────────────────────────
async function copyMainSvg(approach) {
  const svgSrc = path.join(FAVICONS_DIR, `${approach}-purple.svg`)
  const svgDst = path.join(PUBLIC_DIR, 'icon.svg')
  if (fs.existsSync(svgSrc)) {
    fs.copyFileSync(svgSrc, svgDst)
    console.log(`  ✓  public/icon.svg  (from ${approach}-purple.svg)`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
try {
  console.log('Step 1/3 — Generating all PNGs...')
  await generateAllPngs()

  console.log('Step 2/3 — Generating favicon.ico...')
  await generateIco(MAIN_APPROACH, 'purple')

  console.log('\nStep 3/3 — Copying main icons to public/...')
  await copyMainIcons(MAIN_APPROACH)
  await copyMainSvg(MAIN_APPROACH)

  console.log('\n✅ Done! All favicon assets generated.\n')
  console.log('  Next steps:')
  console.log('  1. Open public/favicons/ and compare a1 vs a2 at 16px size')
  console.log('  2. Run: node scripts/generate-favicons.mjs 2  (to switch to Approach 2)')
  console.log('  3. Rebuild the app for the new favicon.ico to be served\n')
} catch (err) {
  console.error('\n❌ Error generating favicons:', err)
  process.exit(1)
}
