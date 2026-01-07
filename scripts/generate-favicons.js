/**
 * Generate all favicon variants from lockstep-favicon-2026.png
 * Run with: node scripts/generate-favicons.js
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const sourceIcon = join(publicDir, 'lockstep-favicon-2026.png');

async function generateFavicons() {
  console.log('Generating favicons from lockstep-favicon-2026.png...\n');

  try {
    // Read the source image
    const sourceBuffer = readFileSync(sourceIcon);
    
    // Get source image metadata
    const metadata = await sharp(sourceBuffer).metadata();
    console.log(`Source image: ${metadata.width}x${metadata.height}`);

    // Define all the sizes we need
    const sizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'lockstep-icon.png', size: 32 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'icon-192.png', size: 192 },
      { name: 'icon-512.png', size: 512 },
    ];

    // Generate each size
    for (const { name, size } of sizes) {
      const outputPath = join(publicDir, name);
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Created ${name} (${size}x${size})`);
    }

    // Generate favicon.ico (multi-size ICO file with 16x16 and 32x32)
    const ico16 = await sharp(sourceBuffer)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    
    const ico32 = await sharp(sourceBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const icoBuffer = await pngToIco([ico16, ico32]);
    writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('✓ Created favicon.ico (16x16 + 32x32)');

    // Create a simple SVG version for Safari pinned tab (monochrome)
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="currentColor"/>
  <text x="16" y="22" font-family="system-ui" font-size="16" font-weight="bold" fill="white" text-anchor="middle">L</text>
</svg>`;
    writeFileSync(join(publicDir, 'safari-pinned-tab.svg'), svgContent);
    console.log('✓ Created safari-pinned-tab.svg');

    console.log('\n✅ All favicons generated successfully!');
    console.log('\nGenerated files:');
    console.log('  - favicon.ico (for legacy browsers)');
    console.log('  - favicon-16x16.png');
    console.log('  - favicon-32x32.png');
    console.log('  - lockstep-icon.png (32x32)');
    console.log('  - apple-touch-icon.png (180x180 for iOS)');
    console.log('  - icon-192.png (for Android/Chrome)');
    console.log('  - icon-512.png (for PWA install)');
    console.log('  - safari-pinned-tab.svg');

  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
