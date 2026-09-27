const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeSHA256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function computeDHashHex(filePath) {
  const buf = fs.readFileSync(filePath);
  const len = buf.length;
  const step = Math.floor(len / 64);
  let hashBits = '';
  for (let i = 0; i < 64; i++) {
    const b1 = buf[i * step] || 0;
    const b2 = buf[(i * step) + Math.floor(step / 2)] || 0;
    hashBits += b1 > b2 ? '1' : '0';
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    const chunk = hashBits.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

function hammingDistanceHex(hex1, hex2) {
  if (!hex1 || !hex2 || hex1.length !== hex2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hex1.length; i++) {
    const v1 = parseInt(hex1[i], 16);
    const v2 = parseInt(hex2[i], 16);
    let xor = v1 ^ v2;
    while (xor > 0) {
      if (xor & 1) dist++;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * 8-Step Future Import Validator
 */
function validateProductImport(imageFilePath, productMetadata, catalogProducts) {
  console.log(`\n--- Validating Future Import: "${productMetadata.title || 'Untitled'}" ---`);

  // Step 1: Read image file
  const absPath = path.isAbsolute(imageFilePath) ? imageFilePath : path.resolve(process.cwd(), imageFilePath);
  if (!fs.existsSync(absPath)) {
    return {
      status: 'REJECTED',
      reason: 'FILE_NOT_FOUND',
      message: `Image file does not exist: ${imageFilePath}`
    };
  }

  // Step 2: Calculate SHA-256
  const sha256 = computeSHA256(absPath);
  console.log(`  Calculated SHA-256: ${sha256.substring(0, 16)}...`);

  // Step 3: Check against all existing image hashes
  const existingHashMatch = catalogProducts.find(p => p.imageHash === sha256);
  if (existingHashMatch) {
    console.error(`  [REJECTED] Exact binary duplicate found! (Product ${existingHashMatch.id}: "${existingHashMatch.title}")`);
    return {
      status: 'REJECTED',
      reason: 'EXACT_DUPLICATE_IMAGE_HASH',
      message: `DUPLICATE POSTER — IMAGE ALREADY EXISTS under Product ID ${existingHashMatch.id}`
    };
  }

  // Step 4: Calculate perceptual hash
  const pHash = computeDHashHex(absPath);
  console.log(`  Calculated pHash: ${pHash}`);

  // Step 5: Check for likely visual duplicates (pHash Hamming distance <= 3)
  const likelyVisualMatch = catalogProducts.find(p => {
    if (!p.perceptualHash) return false;
    const dist = hammingDistanceHex(pHash, p.perceptualHash);
    return dist <= 3;
  });

  if (likelyVisualMatch) {
    console.error(`  [REJECTED] Visual duplicate detected! (Product ${likelyVisualMatch.id}: "${likelyVisualMatch.title}")`);
    return {
      status: 'REJECTED',
      reason: 'VISUAL_DUPLICATE_PHASH',
      message: `DUPLICATE VISUAL ARTWORK — Matches Product ID ${likelyVisualMatch.id} ("${likelyVisualMatch.title}")`
    };
  }

  // Step 6: Validate Metadata
  const validCategories = ['Movies', 'Cars', 'Gaming', 'Sports', 'Motivation'];
  if (!productMetadata.id) return { status: 'REJECTED', reason: 'MISSING_ID', message: 'Missing product ID' };
  if (!productMetadata.title) return { status: 'REJECTED', reason: 'MISSING_TITLE', message: 'Missing title' };
  if (!productMetadata.description) return { status: 'REJECTED', reason: 'MISSING_DESCRIPTION', message: 'Missing description' };
  if (!validCategories.includes(productMetadata.category)) return { status: 'REJECTED', reason: 'INVALID_CATEGORY', message: `Invalid category: ${productMetadata.category}` };

  const idMatch = catalogProducts.find(p => p.id === Number(productMetadata.id));
  if (idMatch) return { status: 'REJECTED', reason: 'DUPLICATE_ID', message: `Product ID ${productMetadata.id} already exists` };

  console.log(`  [ACCEPTED] Import passed all validation checks! Unique visual poster approved.`);
  return {
    status: 'ACCEPTED',
    imageHash: sha256,
    perceptualHash: pHash,
    product: {
      ...productMetadata,
      imageHash: sha256,
      perceptualHash: pHash
    }
  };
}

module.exports = {
  validateProductImport,
  computeSHA256,
  computeDHashHex,
  hammingDistanceHex
};
