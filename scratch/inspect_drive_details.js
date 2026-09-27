const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const optDir = path.join(__dirname, '../poster/opt');
const files = [
  '1562655.webp', '1562656.webp', '1562657.webp', '1562658.webp',
  '1562659.webp', '1562660.webp', '1562661.webp', '1562662.webp',
  '1562663.webp', '1562664.webp', '1562810.webp', '1562818.webp',
  '1562819.webp', '1562820.webp', '1562826.webp', '1562840.webp',
  '1562841.webp', '1562842.webp'
];

async function inspectImages() {
  for (const f of files) {
    const p = path.join(optDir, f);
    const meta = await sharp(p).metadata();
    const stats = await sharp(p).stats();
    // DOMINANT COLORS
    const r = Math.round(stats.channels[0].mean);
    const g = Math.round(stats.channels[1].mean);
    const b = Math.round(stats.channels[2].mean);
    console.log(`${f}: ${meta.width}x${meta.height}, RGB(${r},${g},${b})`);
  }
}

inspectImages();
