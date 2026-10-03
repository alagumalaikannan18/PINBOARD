// =========================================================================
// PINBOARD — Complete Product Routing & Detail Verification Suite
// Validates all 156 unique posters from catalog click to detail rendering
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================');
console.log('PINBOARD PRODUCT ROUTING & INTEGRITY TEST SUITE');
console.log('======================================================\n');

const productsData = require('../js/products-data.js');
const products = Array.isArray(productsData) ? productsData : (productsData.PINBOARD_PRODUCTS || global.PINBOARD_PRODUCTS || []);
const { getLocalProducts } = require('../controllers/productController.js');

let totalProducts = 0;
let uniqueProductIds = new Set();
let brokenProductLinks = 0;
let brokenImagePaths = 0;
let productNotFoundErrors = 0;
let duplicateIds = 0;
let cartMappingErrors = 0;
let consoleErrors = 0;

// 1. TOTAL & UNIQUE PRODUCT IDS
console.log('1. CATALOG DATA & ID INTEGRITY CHECK');
totalProducts = products.length;
console.log(`   - Total Products in Data: ${totalProducts}`);

const idCounts = {};
products.forEach(p => {
  if (idCounts[p.id]) {
    duplicateIds++;
  }
  idCounts[p.id] = (idCounts[p.id] || 0) + 1;
  uniqueProductIds.add(p.id);
});

console.log(`   - Unique Product IDs: ${uniqueProductIds.size}`);
console.log(`   - Duplicate IDs Count: ${duplicateIds}`);
assert.strictEqual(totalProducts, 164, 'Total canonical products must be 164');
assert.strictEqual(uniqueProductIds.size, 164, 'Must have 164 unique product IDs');
assert.strictEqual(duplicateIds, 0, 'Must have 0 duplicate IDs');
console.log('   ✔ PASS: Product ID uniqueness confirmed\n');

// 2. IMAGE PATH EXISTENCE ON DISK
console.log('2. IMAGE PATH RESOLUTION CHECK');
products.forEach(p => {
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    brokenImagePaths++;
    console.error(`   ✖ ERROR: Product #${p.id} missing images array`);
    return;
  }

  p.images.forEach(img => {
    const fullPath = path.resolve(__dirname, '..', img);
    if (!fs.existsSync(fullPath)) {
      brokenImagePaths++;
      console.error(`   ✖ ERROR: Product #${p.id} image path broken: ${img}`);
    }
  });
});

console.log(`   - Broken Image Paths Count: ${brokenImagePaths}`);
assert.strictEqual(brokenImagePaths, 0, 'Must have 0 broken image paths');
console.log('   ✔ PASS: All 156 image paths physically exist on disk\n');

// 3. PRODUCT LOOKUP & QUERY PARAMETER RESOLUTION FOR ALL CANONICAL POSTERS
console.log('3. PRODUCT LOOKUP & ROUTING RESOLUTION FOR ALL CANONICAL POSTERS');
const getProductById = global.getProductById;

if (typeof getProductById !== 'function') {
  console.error('   ✖ ERROR: getProductById is not defined globally');
  consoleErrors++;
}

products.forEach(p => {
  const id = p.id;
  // Test numeric ID lookup
  const pByNum = getProductById ? getProductById(id) : null;
  // Test string ID lookup
  const pByStr = getProductById ? getProductById(String(id)) : null;

  if (!pByNum || !pByStr) {
    productNotFoundErrors++;
    brokenProductLinks++;
    console.error(`   ✖ ERROR: Product lookup failed for valid product ID #${id}`);
  } else {
    if (pByNum.id !== id || pByStr.id !== id) {
      productNotFoundErrors++;
      console.error(`   ✖ ERROR: Mismatched product returned for ID #${id}`);
    }
  }
});

// Verify unassigned ID returns null ("POSTER NOT FOUND")
[152].forEach(mergedId => {
  const res = getProductById ? getProductById(mergedId) : null;
  if (res !== null) {
    productNotFoundErrors++;
    console.error(`   ✖ ERROR: Merged duplicate ID #${mergedId} should resolve to null / POSTER NOT FOUND`);
  }
});

console.log(`   - Broken Product Links: ${brokenProductLinks}`);
console.log(`   - Product Not Found Errors (Valid Products): ${productNotFoundErrors}`);
assert.strictEqual(brokenProductLinks, 0, 'Must have 0 broken product links');
assert.strictEqual(productNotFoundErrors, 0, 'Must have 0 Product Not Found errors');
console.log('   ✔ PASS: All canonical products resolve cleanly via numeric and string lookups\n');

// 4. BACKEND CONTROLLER CATALOG INTEGRITY
console.log('4. BACKEND CONTROLLER INTEGRITY CHECK');
const localProds = getLocalProducts();
console.log(`   - Local Products Returned by Backend Controller: ${localProds.length}`);
assert.strictEqual(localProds.length, 164, 'Backend controller getLocalProducts must return all 164 canonical products');
console.log('   ✔ PASS: Backend controller returns full 164 product catalog\n');

// 5. CART & CHECKOUT IDENTIFIER STABILITY CHECK
console.log('5. CART MAPPING INTEGRITY CHECK');
products.forEach(p => {
  const resolved = getProductById(p.id);
  if (!resolved || resolved.title !== p.title) {
    cartMappingErrors++;
    console.error(`   ✖ ERROR: Cart lookup mismatch for product #${p.id}`);
  }
});
console.log(`   - Cart Mapping Errors: ${cartMappingErrors}`);
assert.strictEqual(cartMappingErrors, 0, 'Must have 0 cart mapping errors');
console.log('   ✔ PASS: Cart identity stable across all products\n');

// 6. FINAL INTEGRITY REPORT OUTPUT
console.log('======================================================');
console.log('FINAL INTEGRITY REPORT');
console.log('======================================================');
console.log(`TOTAL PRODUCTS: ${totalProducts}`);
console.log(`UNIQUE PRODUCT IDS: ${uniqueProductIds.size}`);
console.log(`BROKEN PRODUCT LINKS: ${brokenProductLinks}`);
console.log(`BROKEN IMAGE PATHS: ${brokenImagePaths}`);
console.log(`PRODUCT NOT FOUND ERRORS (valid products): ${productNotFoundErrors}`);
console.log(`DUPLICATE IDS: ${duplicateIds}`);
console.log(`CART MAPPING ERRORS: ${cartMappingErrors}`);
console.log(`CONSOLE ERRORS: ${consoleErrors}`);

const finalStatus = (
  totalProducts === 164 &&
  uniqueProductIds.size === 164 &&
  brokenProductLinks === 0 &&
  brokenImagePaths === 0 &&
  productNotFoundErrors === 0 &&
  duplicateIds === 0 &&
  cartMappingErrors === 0 &&
  consoleErrors === 0
) ? 'PASS' : 'FAILED';

console.log(`\nFINAL STATUS: ${finalStatus}`);
console.log('======================================================');

if (finalStatus !== 'PASS') {
  process.exit(1);
}
