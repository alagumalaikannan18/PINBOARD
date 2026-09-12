const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'poster', 'Posters');
const DEST_DIR = path.join(ROOT_DIR, 'poster', 'opt');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

async function optimizeOne(file) {
  const srcPath = path.join(SRC_DIR, file);
  const baseName = path.parse(file).name;
  const destWebp = path.join(DEST_DIR, `${baseName}.webp`);
  const destThumb = path.join(DEST_DIR, `${baseName}-thumb.webp`);

  const stat = fs.statSync(srcPath);

  // If already generated and non-empty, skip
  if (fs.existsSync(destWebp) && fs.existsSync(destThumb)) {
    const s1 = fs.statSync(destWebp);
    const s2 = fs.statSync(destThumb);
    if (s1.size > 0 && s2.size > 0) {
      return { skipped: true, file, origSize: stat.size, optSize: s1.size + s2.size };
    }
  }

  // 1. Standard full-size WebP (1200px max width, quality 85)
  await sharp(srcPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toFile(destWebp);

  // 2. High-speed Thumbnail WebP (480px max width, quality 80)
  await sharp(srcPath)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(destThumb);

  const opt1 = fs.statSync(destWebp);
  const opt2 = fs.statSync(destThumb);

  return {
    skipped: false,
    file,
    origSize: stat.size,
    optSize: opt1.size + opt2.size,
    webpSize: opt1.size,
    thumbSize: opt2.size
  };
}

async function runBatch() {
  const files = fs.readdirSync(SRC_DIR).filter(f => {
    if (f.startsWith('.trashed') || f.includes('(1)')) return false;
    const ext = path.extname(f).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  });

  console.log(`🚀 Starting optimization for ${files.length} poster images...`);
  console.log(`Source: ${SRC_DIR}`);
  console.log(`Destination: ${DEST_DIR}`);
  console.log('----------------------------------------------------');

  let totalOrigBytes = 0;
  let totalOptBytes = 0;
  let processedCount = 0;
  let skippedCount = 0;

  // Process with concurrency limit of 4
  const CONCURRENCY = 4;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (f) => {
        try {
          return await optimizeOne(f);
        } catch (err) {
          console.error(`❌ Error optimizing ${f}:`, err.message);
          return null;
        }
      })
    );

    for (const res of results) {
      if (!res) continue;
      totalOrigBytes += res.origSize;
      totalOptBytes += res.optSize;
      if (res.skipped) {
        skippedCount++;
      } else {
        processedCount++;
        console.log(`✓ [${processedCount + skippedCount}/${files.length}] ${res.file}: ${(res.origSize / 1024 / 1024).toFixed(1)}MB -> WebP ${(res.webpSize / 1024).toFixed(0)}KB | Thumb ${(res.thumbSize / 1024).toFixed(0)}KB`);
      }
    }
  }

  console.log('====================================================');
  console.log(`Done! Processed: ${processedCount}, Already cached: ${skippedCount}`);
  console.log(`Original total size: ${(totalOrigBytes / (1024 * 1024)).toFixed(1)} MB`);
  console.log(`Optimized total size: ${(totalOptBytes / (1024 * 1024)).toFixed(1)} MB`);
  const reduction = totalOrigBytes > 0 ? (((totalOrigBytes - totalOptBytes) / totalOrigBytes) * 100).toFixed(1) : 0;
  console.log(`Total Bandwidth Reduction: ${reduction}%`);
  console.log('====================================================');
}

runBatch().catch(console.error);
