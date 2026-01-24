/**
 * Generate PNG icons from SVG
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';

const svg = readFileSync('public/icons/icon.svg');
const sizes = [16, 32, 48, 128];
const iconDir = 'public/icons';

for (const size of sizes) {
  const outputPath = `${iconDir}/icon-${size}.png`;
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`Generated ${outputPath}`);
}

console.log('All icons generated successfully!');
