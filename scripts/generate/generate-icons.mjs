#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = 'public/images/profile.webp';
const BRIDGES_SOURCE = 'public/logos/ba.webp';
const OUTPUT_DIR = 'public';
const ICONS_DIR = 'public/icons';
const IMAGES_DIR = 'public/images';
const SOCIAL_DIR = 'public/social';
const BRAND = {
  name: 'Cameron Aaron',
  title: 'EMT, CNA, Software Engineer, Security Researcher & Future NP',
  tagline: 'Healthcare x Technology x Security',
  site: 'cameronaaron.com',
};

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// apple-touch-icon.png stays at the public/ root: some iOS versions fetch it
// from the fixed root path regardless of the <link rel="apple-touch-icon">
// tag, so moving it risks a broken "Add to Home Screen" icon.
const sizes = [
  { size: 16, name: 'icon-16x16.png', dir: ICONS_DIR },
  { size: 32, name: 'icon-32x32.png', dir: ICONS_DIR },
  { size: 192, name: 'icon-192x192.png', dir: ICONS_DIR },
  { size: 512, name: 'icon-512x512.png', dir: ICONS_DIR },
  { size: 180, name: 'apple-touch-icon.png', dir: OUTPUT_DIR },
];

console.log('Generating brand images from profile.webp...\n');

function createSocialSvg({ width, height }) {
  const brandName = escapeXml(BRAND.name);
  const brandTitle = escapeXml(BRAND.title);
  const brandTagline = escapeXml(BRAND.tagline);
  const brandSite = escapeXml(BRAND.site);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#050b16" />
        <stop offset="55%" stop-color="#081524" />
        <stop offset="100%" stop-color="#040a12" />
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38d6ff" />
        <stop offset="100%" stop-color="#10d492" />
      </linearGradient>
    </defs>

    <rect width="100%" height="100%" fill="url(#bg)" />
    <circle cx="${width - 110}" cy="90" r="180" fill="#38d6ff" opacity="0.12" />
    <circle cx="130" cy="${height - 70}" r="190" fill="#10d492" opacity="0.1" />

    <rect x="64" y="54" width="8" height="${height - 108}" rx="4" fill="url(#accent)" opacity="0.9" />

    <text x="96" y="145" fill="#eaf4ff" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="62" font-weight="700">
      ${brandName}
    </text>

    <text x="96" y="220" fill="#9cc8e8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="38" font-weight="600">
      ${brandTitle}
    </text>

    <text x="96" y="278" fill="#86b6d0" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="28" font-weight="500">
      ${brandTagline}
    </text>

    <rect x="96" y="${height - 102}" width="360" height="48" rx="24" fill="url(#accent)" opacity="0.2" />
    <text x="122" y="${height - 70}" fill="#dbf7ff" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="24" font-weight="600">
      ${brandSite}
    </text>
  </svg>
  `;
}

async function generateIcons() {
  try {
    const sourceBuffer = readFileSync(SOURCE);
    
    for (const { size, name, dir } of sizes) {
      const outputPath = join(dir, name);

      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`Generated ${name} (${size}x${size})`);
    }

    // AVIF over webp for everything on the render path: measured 2026-07 with
    // sharp (quality 60, effort 9), avif is 16–55% smaller than the webp it
    // replaced at equal visual quality — profile-hero 15.0KB→9.2KB (-39%),
    // profile-hero-sm 8.9KB→5.3KB (-41%). Support is universal in evergreen
    // browsers (Safari ≥16.4), so no webp fallback is shipped.
    await sharp(sourceBuffer)
      .resize(384, 384, {
        fit: 'cover',
        position: 'center'
      })
      .avif({ quality: 60, effort: 9 })
      .toFile(join(IMAGES_DIR, 'profile-hero.avif'));
    console.log('Generated profile-hero.avif (384x384)');

    // Narrow viewports render the hero photo in a 192px slot (see the `sizes`
    // hint on ProfileImage's <Image>) — a dedicated smaller source avoids
    // shipping the full 384x384 desktop asset there. Static export disables
    // next/image's automatic srcset generation (`unoptimized: true`), so this
    // is served via a hand-written <picture><source> in ProfileImage.tsx.
    await sharp(sourceBuffer)
      .resize(256, 256, {
        fit: 'cover',
        position: 'center'
      })
      .avif({ quality: 60, effort: 9 })
      .toFile(join(IMAGES_DIR, 'profile-hero-sm.avif'));
    console.log('Generated profile-hero-sm.avif (256x256)');

    try {
      const bridgesBuffer = readFileSync(BRIDGES_SOURCE);
      await sharp(bridgesBuffer)
        .resize(64, 64, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .avif({ quality: 70, effort: 9 })
        .toFile(join(OUTPUT_DIR, 'logos', 'ba-logo.avif'));
      console.log('Generated ba-logo.avif (64x64)');
    } catch {
      console.warn('Skipped ba-logo.avif generation (source not found)');
    }

    const socialAssets = [
      { name: 'opengraph-image.png', width: 1200, height: 630 },
      { name: 'twitter-image.png', width: 1200, height: 630 },
    ];

    for (const asset of socialAssets) {
      const outputPath = join(SOCIAL_DIR, asset.name);
      const svg = createSocialSvg(asset);

      await sharp(Buffer.from(svg))
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`Generated ${asset.name} (${asset.width}x${asset.height})`);
    }
    
    console.log('\nAll brand images generated successfully.');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
