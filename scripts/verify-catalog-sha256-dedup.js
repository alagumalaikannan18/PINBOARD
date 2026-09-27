const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateProductCreation } = require('../controllers/productController');
const { validateProductImport } = require('./import-product-validator');

console.log(`======================================================`);
console.log(`PINBOARD CATALOG DATA INTEGRITY & DEDUPLICATION SUITE`);
console.log(`======================================================\n`);

let passedCount = 0;
let totalCount = 0;

function assert(condition, label, details) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label} - ${details || ''}`);
  }
}

// Load canonical products data
const productsDataPath = path.join(process.cwd(), 'js', 'products-data.js');
const productsDataContent = fs.readFileSync(productsDataPath, 'utf8');

let sandboxWin = {};
let sandboxMod = { exports: {} };
const fn = new Function('window', 'module', productsDataContent);
fn(sandboxWin, sandboxMod);
const products = sandboxWin.PINBOARD_PRODUCTS || sandboxMod.exports.PINBOARD_PRODUCTS || [];

// 1. Catalog Integrity
console.log(`--- 1. CATALOG INTEGRITY CHECKS ---`);
assert(products.length === 155, `Catalog Total Canonical Products`, `Expected 155, got ${products.length}`);

const idSet = new Set();
const hashSet = new Set();
let brokenPaths = 0;
let missingTitles = 0;
let missingDescs = 0;
let invalidCats = 0;

const validCategories = ['Movies', 'Cars', 'Gaming', 'Sports', 'Motivation'];

products.forEach(p => {
  if (idSet.has(p.id)) console.error(`Duplicate ID: ${p.id}`);
  idSet.add(p.id);

  const imgRel = (p.images && p.images[0]) ? p.images[0] : (p.image || '');
  const absPath = path.join(process.cwd(), imgRel);
  if (!fs.existsSync(absPath)) brokenPaths++;

  if (p.imageHash) {
    if (hashSet.has(p.imageHash)) console.error(`Duplicate Image Hash: ${p.imageHash} for ID ${p.id}`);
    hashSet.add(p.imageHash);
  }

  if (!p.title || !String(p.title).trim()) missingTitles++;
  if (!p.description || !String(p.description).trim()) missingDescs++;
  if (!p.category || !validCategories.includes(p.category)) invalidCats++;
});

assert(idSet.size === products.length, `Unique Product IDs`, `Found ${idSet.size} unique IDs`);
assert(hashSet.size === products.length, `Unique Image Hashes`, `Found ${hashSet.size} unique hashes`);
assert(brokenPaths === 0, `Broken Image Paths`, `Found ${brokenPaths} broken image paths`);
assert(missingTitles === 0, `Missing Titles`, `Found ${missingTitles} missing titles`);
assert(missingDescs === 0, `Missing Descriptions`, `Found ${missingDescs} missing descriptions`);
assert(invalidCats === 0, `Invalid Categories`, `Found ${invalidCats} invalid categories`);

// 2. Search Deduplication Check
console.log(`\n--- 2. SEARCH DEDUPLICATION CHECKS ---`);
const PinboardSearch = sandboxWin.PinboardSearch;
assert(typeof PinboardSearch !== 'undefined', `PinboardSearch Engine Defined`);

const testQueries = ['master jd', 'messi', 'ronaldo', 'virat', 'bmw', 'porsche', 'spider man', 'gta', 'motivation', 'movies', 'sports', 'cars'];

testQueries.forEach(q => {
  const results = PinboardSearch.search(q);
  const resultIds = new Set();
  const resultHashes = new Set();
  let dupId = false;
  let dupHash = false;

  results.forEach(r => {
    if (resultIds.has(r.id)) dupId = true;
    resultIds.add(r.id);
    if (r.imageHash && resultHashes.has(r.imageHash)) dupHash = true;
    if (r.imageHash) resultHashes.add(r.imageHash);
  });

  assert(!dupId && !dupHash, `Search Deduplication for query "${q}" (${results.length} results)`, `Duplicates in search results!`);
});

// 3. Server-Side Duplicate Validation Check
console.log(`\n--- 3. SERVER-SIDE DUPLICATE VALIDATION CHECKS ---`);
const existingProduct = products[0];
const dupValidation = validateProductCreation({
  id: 9999,
  title: 'Duplicate Attempt Poster',
  description: 'Test description',
  category: 'Movies',
  image: existingProduct.image,
  imageHash: existingProduct.imageHash
});

assert(!dupValidation.isValid, `Server-Side Rejection of Duplicate Image Hash`, `Failed to reject duplicate creation`);
assert(dupValidation.error === 'DUPLICATE POSTER — IMAGE ALREADY EXISTS', `Correct Error Code returned ("DUPLICATE POSTER — IMAGE ALREADY EXISTS")`, `Got: ${dupValidation.error}`);

// 4. Future Import Protection Check
console.log(`\n--- 4. FUTURE IMPORT PROTECTION CHECKS ---`);
const importRes = validateProductImport(
  existingProduct.image,
  { id: 8888, title: 'Import Test', description: 'Desc', category: 'Movies' },
  products
);

assert(importRes.status === 'REJECTED', `Future Import Protection Rejects Duplicate`, `Got status ${importRes.status}`);
assert(importRes.reason === 'EXACT_DUPLICATE_IMAGE_HASH', `Correct Rejection Reason ("EXACT_DUPLICATE_IMAGE_HASH")`, `Got: ${importRes.reason}`);

// Summary
console.log(`\n======================================================`);
console.log(`SUMMARY: ${passedCount} / ${totalCount} CHECKS PASSED`);
console.log(`======================================================`);

if (passedCount === totalCount) {
  console.log(`🎉 ALL CATALOG INTEGRITY & DEDUPLICATION CHECKS PASSED!`);
  process.exit(0);
} else {
  console.error(`❌ SOME INTEGRITY CHECKS FAILED!`);
  process.exit(1);
}
