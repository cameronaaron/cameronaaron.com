#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = 'public/profile.webp';
const OUTPUT_DIR = 'public';

const sizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

console.log('🎨 Generating PWA icons from profile.webp...\n');

async function generateIcons() {
  try {
    const sourceBuffer = readFileSync(SOURCE);
    
    for (const { size, name } of sizes) {
      const outputPath = join(OUTPUT_DIR, name);
      
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }
    
    console.log('\n🎉 All PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
