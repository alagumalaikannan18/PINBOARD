const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const OPT_DIR = path.join(ROOT_DIR, 'images', 'opt');

if (!fs.existsSync(OPT_DIR)) {
  fs.mkdirSync(OPT_DIR, { recursive: true });
}

async function runOptimization() {
  const files = fs.readdirSync(ROOT_DIR);
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.png', '.jpg', '.jpeg'].includes(ext) && (f.startsWith('New Project') || f.startsWith('cat_') || f.startsWith('155') || f.startsWith('WhatsApp'));
  });

  console.log(`Found ${imageFiles.length} images to optimize...`);

  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;

  for (const file of imageFiles) {
    const srcPath = path.join(ROOT_DIR, file);
    const stats = fs.statSync(srcPath);
    totalOriginalBytes += stats.size;

    const baseName = path.parse(file).name;
    const destWebp = path.join(ROOT_DIR, `${baseName}.webp`);
    const destThumbWebp = path.join(ROOT_DIR, `${baseName}-thumb.webp`);

    try {
      // 1. Standard WebP (Quality 85, max width 1200)
      await sharp(srcPath)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toFile(destWebp);

      // 2. Fast Thumbnail WebP (Quality 80, max width 480)
      await sharp(srcPath)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(destThumbWebp);

      const optStats = fs.statSync(destWebp);
      const thumbStats = fs.statSync(destThumbWebp);
      totalOptimizedBytes += optStats.size + thumbStats.size;

      console.log(`✓ ${file}: ${(stats.size / 1024).toFixed(0)}KB -> WebP: ${(optStats.size / 1024).toFixed(0)}KB | Thumb: ${(thumbStats.size / 1024).toFixed(0)}KB`);
    } catch (err) {
      console.error(`Error optimizing ${file}:`, err.message);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Original total size: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Optimized total size: ${(totalOptimizedBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Bandwidth reduction: ${(((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(1)}%`);
}

runOptimization();
