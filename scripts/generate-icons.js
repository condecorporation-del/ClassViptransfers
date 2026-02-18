#!/usr/bin/env node

/**
 * Generate PWA icons from logo.png
 * Requires: sharp (npm install -D sharp)
 * 
 * Usage: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '../public/logo.png');
const iconsDir = path.join(__dirname, '../public/icons');

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('❌ Error: sharp is not installed.');
  console.log('📦 Install it with: npm install -D sharp');
  process.exit(1);
}

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('❌ Error: logo.png not found at', logoPath);
  process.exit(1);
}

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');
  console.log('📸 Source image: public/logo.png\n');

  try {
    // Generate 192x192 icon
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    console.log('✅ Generated icon-192x192.png');

    // Generate 512x512 icon
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(iconsDir, 'icon-512x512.png'));
    console.log('✅ Generated icon-512x512.png');

    // Generate Apple touch icon (180x180 with white background)
    await sharp(logoPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 247, g: 250, b: 255, alpha: 1 } // Off-white background
      })
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('✅ Generated apple-touch-icon.png');

    console.log('\n✨ All icons generated successfully!');
    console.log('📁 Icons saved to:', iconsDir);
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();

