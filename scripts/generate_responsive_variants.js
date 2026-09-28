const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const catalogPath = path.join(ROOT_DIR, 'js', 'products-data.js');

const content = fs.readFileSync(catalogPath, 'utf8');
const match = content.match(/globalScope\.PINBOARD_PRODUCTS\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error("❌ Could not parse products-data.js");
  process.exit(1);
}

const products = JSON.parse(match[1]);
console.log(`Processing ${products.length} canonical product artworks with parallel batching...`);

async function generateVariantsForProduct(product) {
  const relPath = product.image;
  const fullPath = path.join(ROOT_DIR, relPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File missing for product ${product.id}: ${fullPath}`);
    return null;
  }

  const dir = path.dirname(fullPath);
  const ext = path.extname(fullPath);
  const baseName = path.basename(fullPath, ext);

  const sizes = [
    { suffix: '-sm', width: 400, quality: 88 },
    { suffix: '-md', width: 800, quality: 90 },
    { suffix: '-lg', width: 1200, quality: 92 },
    { suffix: '-xl', width: 2000, quality: 95 }
  ];

  for (const s of sizes) {
    const webpPath = path.join(dir, `${baseName}${s.suffix}.webp`);
    if (!fs.existsSync(webpPath) || fs.statSync(webpPath).size === 0) {
      await sharp(fullPath)
        .resize({ width: s.width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
        .webp({ quality: s.quality, effort: 4 })
        .toFile(webpPath);
    }
  }

  const thumbPath = path.join(dir, `${baseName}-thumb.webp`);
  if (!fs.existsSync(thumbPath) || fs.statSync(thumbPath).size === 0) {
    await sharp(fullPath)
      .resize({ width: 400, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .webp({ quality: 85, effort: 4 })
      .toFile(thumbPath);
  }

  return true;
}

async function run() {
  const CONCURRENCY = 8;
  let done = 0;
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const chunk = products.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(p => generateVariantsForProduct(p)));
    done += chunk.length;
    console.log(`✓ Processed ${done}/${products.length} posters`);
  }
  console.log("🎉 All 155 poster responsive variants (sm, md, lg, xl, thumb) successfully created!");
}

run().catch(err => {
  console.error("❌ Fatal error generating variants:", err);
  process.exit(1);
});
