const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const filesToFix = [
  'poster/opt/1513633.webp',
  'poster/opt/1514230.webp',
  'poster/opt/p1.webp'
];

async function fixRemaining() {
  for (const relPath of filesToFix) {
    const absPath = path.resolve(__dirname, '..', relPath);
    if (!fs.existsSync(absPath)) continue;

    const inputBuf = fs.readFileSync(absPath);
    const meta = await sharp(inputBuf).metadata();
    console.log(`Fixing remaining mockup: ${relPath} (${meta.width}x${meta.height})`);

    const crop = { left: 255, top: 302, width: 690, height: 978 };

    const cleanBuf = await sharp(inputBuf)
      .extract(crop)
      .webp({ quality: 92 })
      .toBuffer();

    fs.writeFileSync(absPath, cleanBuf);
    console.log(`✓ Cleaned: ${relPath}`);

    const baseName = path.basename(absPath, '.webp');
    const thumbPath = path.join(path.dirname(absPath), `${baseName}-thumb.webp`);
    if (fs.existsSync(thumbPath)) {
      const thumbBuf = await sharp(cleanBuf)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      fs.writeFileSync(thumbPath, thumbBuf);
      console.log(`  └─ Updated thumbnail: ${baseName}-thumb.webp`);
    }
  }
}

fixRemaining().catch(err => console.error(err));
