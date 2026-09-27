const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const vm = require('vm');

// 1. Load products data
const productsPath = path.resolve(__dirname, '../js/products-data.js');
const content = fs.readFileSync(productsPath, 'utf8');
const sandbox = {};
vm.runInNewContext(content, sandbox);
const products = sandbox.PINBOARD_PRODUCTS;

// 2. Load universal audit results
const auditPath = path.resolve(__dirname, 'universal_mockups_audit.json');
const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

console.log(`Starting image cleanup for PINBOARD catalog...`);
console.log(`Total products scanned: ${products.length}`);

let totalMockupsDetected = 0;
let totalImagesCleaned = 0;
let totalWallsRemoved = 0;
let totalFramesRemoved = 0;
let totalBrandingRemoved = 0;

const cleanedFilesSet = new Set();

async function cleanImageFile(relativeImgPath, cropInfo) {
  const absPath = path.resolve(__dirname, '..', relativeImgPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`File not found: ${relativeImgPath}`);
    return;
  }

  // Backup original file to scratch/backup/ if not already backed up
  const backupDir = path.resolve(__dirname, 'backup', path.dirname(relativeImgPath));
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, path.basename(relativeImgPath));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(absPath, backupPath);
  }

  const { left, top, width, height } = cropInfo;

  // Read metadata of original
  const meta = await sharp(backupPath).metadata();
  const ext = path.extname(relativeImgPath).toLowerCase();

  // Temporary buffer for cropped clean artwork
  let pipeline = sharp(backupPath).extract({ left, top, width, height });

  // Output to original path in high quality
  if (ext === '.webp') {
    await pipeline.webp({ quality: 92, effort: 4 }).toFile(absPath + '.tmp');
  } else if (ext === '.png') {
    await pipeline.png({ compressionLevel: 6 }).toFile(absPath + '.tmp');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await pipeline.jpeg({ quality: 92 }).toFile(absPath + '.tmp');
  }

  // Atomic replace
  fs.renameSync(absPath + '.tmp', absPath);
  cleanedFilesSet.add(relativeImgPath);
  totalImagesCleaned++;
  totalWallsRemoved++;
  totalFramesRemoved++;
  totalBrandingRemoved++;

  console.log(`✓ Cleaned: ${relativeImgPath} -> Crop (${width}x${height})`);

  // Also check if there are derived .webp and -thumb.webp variants in root or images/
  const dirName = path.dirname(absPath);
  const baseNameWithoutExt = path.basename(absPath, ext);

  // Check possible variant paths
  const possibleVariants = [
    path.join(dirName, `${baseNameWithoutExt}.webp`),
    path.join(dirName, `${baseNameWithoutExt}-thumb.webp`),
    path.join(dirName, `${baseNameWithoutExt}.jpg-thumb.webp`),
    path.join(dirName, `${baseNameWithoutExt}.png-thumb.webp`)
  ];

  for (const vPath of possibleVariants) {
    if (vPath !== absPath && fs.existsSync(vPath)) {
      if (vPath.endsWith('-thumb.webp')) {
        await sharp(absPath)
          .resize({ width: 480, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(vPath + '.tmp');
        fs.renameSync(vPath + '.tmp', vPath);
        cleanedFilesSet.add(path.relative(path.resolve(__dirname, '..'), vPath));
        console.log(`  └─ Updated thumbnail: ${path.basename(vPath)}`);
      } else if (vPath.endsWith('.webp')) {
        await sharp(absPath)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 92 })
          .toFile(vPath + '.tmp');
        fs.renameSync(vPath + '.tmp', vPath);
        cleanedFilesSet.add(path.relative(path.resolve(__dirname, '..'), vPath));
        console.log(`  └─ Updated webp variant: ${path.basename(vPath)}`);
      }
    }
  }
}

async function runMasterCleanup() {
  for (const [imgPath, info] of Object.entries(auditData)) {
    if (info.is_mockup && info.crop) {
      totalMockupsDetected++;
      await cleanImageFile(imgPath, info.crop);
    }
  }

  console.log(`\n==================================================`);
  console.log(`POSTER IMAGE CLEANUP SUMMARY`);
  console.log(`==================================================`);
  console.log(`Products scanned: ${products.length}`);
  console.log(`Mockup images detected: ${totalMockupsDetected}`);
  console.log(`Images cleaned: ${totalImagesCleaned}`);
  console.log(`Total files updated (including variants): ${cleanedFilesSet.size}`);
  console.log(`==================================================\n`);
}

runMasterCleanup().catch(err => console.error(err));
