/**
 * Generate temporary bobo app icons (logo + tray) using SVG + macOS sips.
 *
 * This is a placeholder for the real bobo brand icon. The output is
 * intentionally simple ("bobo" text + cat ears) and will be replaced
 * when a proper cat-themed icon is ready.
 *
 * Why SVG + sips:
 * - No new dependencies (uses macOS built-in `sips` for rasterization)
 * - SVG is the source of truth; PNG is generated
 * - Regenerating icons is one command after editing the SVG strings below
 *
 * Re-run after editing:
 *   pnpm tsx scripts/generateTemporaryIcons.ts
 */

import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ASSETS = 'src-tauri/assets'

// ─── SVG factories ──────────────────────────────────────────────

/**
 * Full-color "bobo" logo: soft pastel background, "bobo" text, two
 * cat ears, two dots for eyes. Used for app icon (logo.png / logo-mac.png)
 * at 1024x1024. Both versions are identical; logo-mac.png is kept
 * separate to follow the Tauri convention (macOS source can differ if
 * needed later).
 */
function logoSvg(size: number): string {
  // Cat ears positioned to sit above the "b" letters of "bobo".
  // For a 1024 canvas, ears are around (340, 200) and (684, 200).
  // Scale proportionally for other sizes.
  const s = size / 1024
  const earL = `M ${260 * s} ${280 * s} L ${340 * s} ${150 * s} L ${420 * s} ${290 * s} Z`
  const earR = `M ${604 * s} ${290 * s} L ${684 * s} ${150 * s} L ${764 * s} ${280 * s} Z`
  const earInnerL = `M ${300 * s} ${265 * s} L ${340 * s} ${195 * s} L ${380 * s} ${270 * s} Z`
  const earInnerR = `M ${644 * s} ${270 * s} L ${684 * s} ${195 * s} L ${724 * s} ${265 * s} Z`

  // "bobo" text — centered, rounded bold sans-serif
  const fontSize = 360 * s
  const textY = 700 * s

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE5EC"/>
      <stop offset="1" stop-color="#FFC2D1"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${180 * s}"/>
  <path d="${earL}" fill="#E91E63"/>
  <path d="${earR}" fill="#E91E63"/>
  <path d="${earInnerL}" fill="#FCE4EC"/>
  <path d="${earInnerR}" fill="#FCE4EC"/>
  <circle cx="${390 * s}" cy="${580 * s}" r="${22 * s}" fill="#2C2C2C"/>
  <circle cx="${634 * s}" cy="${580 * s}" r="${22 * s}" fill="#2C2C2C"/>
  <text x="${512 * s}" y="${textY}" font-family="-apple-system, 'SF Pro Rounded', system-ui, sans-serif" font-size="${fontSize}" font-weight="900" fill="#2C2C2C" text-anchor="middle" letter-spacing="${-8 * s}">bobo</text>
</svg>`
}

/**
 * Full-color tray icon: same color scheme as logo, but a single bold
 * "b" with a tiny ear accent, designed to read at 32x32 px.
 */
function traySvg(size: number): string {
  const s = size / 32
  // Cat ear on top of the "b"
  const ear = `M ${10 * s} ${4 * s} L ${14 * s} ${-2 * s} L ${18 * s} ${4 * s} Z`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="${32 * s}" height="${32 * s}" fill="none"/>
  <path d="${ear}" fill="#E91E63"/>
  <text x="${16 * s}" y="${26 * s}" font-family="-apple-system, 'SF Pro Rounded', system-ui, sans-serif" font-size="${26 * s}" font-weight="900" fill="#2C2C2C" text-anchor="middle">b</text>
</svg>`
}

/**
 * macOS tray template: pure black on transparent.
 * macOS automatically inverts black<->white based on menu bar appearance
 * (light vs dark mode). The image MUST be a black template (alpha mask
 * driven), not a full-color image.
 */
function trayMacSvg(size: number): string {
  const s = size / 22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 22 22">
  <path d="M 4 4 L 7 -1 L 10 4 Z" fill="black"/>
  <text x="11" y="20" font-family="-apple-system, 'SF Pro Rounded', system-ui, sans-serif" font-size="20" font-weight="900" fill="black" text-anchor="middle">b</text>
</svg>`
}

// ─── Driver ─────────────────────────────────────────────────────

interface Target {
  name: string
  svg: string
  size: number
  out: string
}

const targets: Target[] = [
  { name: 'logo.png',     svg: logoSvg(1024),   size: 1024, out: join(ASSETS, 'logo.png') },
  { name: 'logo-mac.png', svg: logoSvg(1024),   size: 1024, out: join(ASSETS, 'logo-mac.png') },
  { name: 'tray.png',     svg: traySvg(32),     size: 32,   out: join(ASSETS, 'tray.png') },
  { name: 'tray-mac.png', svg: trayMacSvg(22),  size: 22,   out: join(ASSETS, 'tray-mac.png') },
]

if (!existsSync(ASSETS)) {
  mkdirSync(ASSETS, { recursive: true })
}

const tmpDir = '/tmp/bobo-icon-gen'
if (!existsSync(tmpDir)) {
  mkdirSync(tmpDir, { recursive: true })
}

for (const t of targets) {
  const svgPath = join(tmpDir, `${t.name}.svg`)
  const pngPath = join(tmpDir, t.name)
  writeFileSync(svgPath, t.svg)
  // -s format png: ensure PNG output
  // --resampleHeightWidth <size> <size>: force exact pixel dimensions
  execSync(`sips -s format png --resampleHeightWidth ${t.size} ${t.size} "${svgPath}" --out "${pngPath}"`, { stdio: 'inherit' })
  // Move the final PNG to assets
  execSync(`cp "${pngPath}" "${t.out}"`, { stdio: 'inherit' })
  console.log(`  ✅ ${t.out}`)
}

console.log('Done. Next: pnpm run build:icon')
