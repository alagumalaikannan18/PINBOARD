const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const driveDir = path.join(__dirname, '../poster/drive');
const optDir = path.join(__dirname, '../poster/opt');

async function processDriveImages() {
  const files = fs.readdirSync(driveDir);
  console.log(`Processing ${files.length} images from Google Drive...`);

  const results = [];

  for (const file of files) {
    const srcPath = path.join(driveDir, file);
    const basename = path.parse(file).name;
    const destName = `${basename}.webp`;
    const destPath = path.join(optDir, destName);

    try {
      const meta = await sharp(srcPath).metadata();
      // Resize to web-optimized max 1200px width/height webp
      await sharp(srcPath)
        .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(destPath);

      const optStat = fs.statSync(destPath);
      results.push({
        file,
        basename,
        webp: destName,
        relPath: `poster/opt/${destName}`,
        width: meta.width,
        height: meta.height,
        sizeKb: Math.round(optStat.size / 1024)
      });
      console.log(`✓ Processed ${file} -> ${destName} (${Math.round(optStat.size / 1024)} KB)`);
    } catch (err) {
      console.error(`✗ Error processing ${file}:`, err.message);
    }
  }

  fs.writeFileSync('scratch/drive_processed_meta.json', JSON.stringify(results, null, 2));
}

processDriveImages();
