const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Read products-data.js to extract all product metadata (titles, categories, product IDs, etc.)
const productsDataContent = fs.readFileSync('d:/PINBOARD-GIT/js/products-data.js', 'utf8');

// Parse products array from products-data.js
let products = [];
try {
  // Use Function to extract PINBOARD_PRODUCTS or window.PINBOARD_PRODUCTS
  const fn = new Function('window', productsDataContent + '; return window.PINBOARD_PRODUCTS || PINBOARD_PRODUCTS;');
  products = fn({});
} catch (e) {
  console.error("Error parsing products-data.js:", e.message);
}

console.log(`Parsed ${products.length} products from products-data.js`);

// 2. Read all 156 files in all_new_poster_no_repeated_poster
const posterDir = 'd:/PINBOARD-GIT/all_new_poster_no_repeated_poster';
const files = fs.readdirSync(posterDir);

console.log(`Found ${files.length} files in ${posterDir}`);

// Function to compute SHA-256 hash of file
function getFileHash(filepath) {
  const fileBuffer = fs.readFileSync(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Simple PNG / JPG header reader for width and height without external dependencies
function getImageDimensions(filepath) {
  const buf = fs.readFileSync(filepath);
  let width = 0, height = 0;

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    // PNG
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  } else if (buf[0] === 0xFF && buf[1] === 0xD8) {
    // JPEG
    let i = 2;
    while (i < buf.length) {
      const marker = buf.readUInt16BE(i);
      i += 2;
      if (marker === 0xFFC0 || marker === 0xFFC1 || marker === 0xFFC2) {
        height = buf.readUInt16BE(i + 3);
        width = buf.readUInt16BE(i + 5);
        break;
      } else {
        const len = buf.readUInt16BE(i);
        i += len;
      }
    }
  }
  return { width, height };
}

const hashes = new Set();
const duplicates = [];
const fileInfos = [];

files.forEach((file, index) => {
  const fullPath = path.join(posterDir, file);
  const stat = fs.statSync(fullPath);
  const dims = getImageDimensions(fullPath);
  const hash = getFileHash(fullPath);

  if (hashes.has(hash)) {
    duplicates.push(file);
  } else {
    hashes.add(hash);
  }

  const baseName = path.parse(file).name;
  const ext = path.parse(file).ext;
  const aspectRatio = dims.width && dims.height ? parseFloat((dims.width / dims.height).toFixed(3)) : 0.737;

  // Try to find matching product in products-data.js by id, title, or filename matching
  let matchedProduct = products.find(p => p.id === index + 1);
  if (!matchedProduct) {
    matchedProduct = products.find(p => p.id === parseInt(baseName) || (p.title && p.title.toLowerCase().includes(baseName.toLowerCase())));
  }

  fileInfos.push({
    index: index + 1,
    id: `poster-${String(index + 1).padStart(3, '0')}`,
    filename: file,
    baseName: baseName,
    extension: ext,
    sizeBytes: stat.size,
    width: dims.width,
    height: dims.height,
    aspectRatio: aspectRatio,
    hash: hash,
    matchedProductId: matchedProduct ? matchedProduct.id : (index + 1),
    matchedTitle: matchedProduct ? matchedProduct.title : `Poster ${index + 1}`,
    matchedCategory: matchedProduct ? matchedProduct.category : 'Movies'
  });
});

console.log(`Unique hashes count: ${hashes.size} / ${files.length}`);
console.log(`Duplicate files count: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log("Duplicates found:", duplicates);
}

fs.writeFileSync('d:/PINBOARD-GIT/scratch/poster_inspection.json', JSON.stringify(fileInfos, null, 2));
console.log("Inspection summary written to scratch/poster_inspection.json");
