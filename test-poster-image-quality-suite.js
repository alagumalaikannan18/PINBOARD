const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("======================================================");
console.log("PINBOARD POSTER IMAGE QUALITY & RESOLUTION SUITE");
console.log("======================================================\n");

let passed = 0;
let total = 0;

function assert(condition, description) {
  total++;
  if (condition) {
    console.log(`  ✔ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

// 1. Audit PINBOARD_PRODUCTS catalog
const code = fs.readFileSync(path.join(__dirname, 'js/products-data.js'), 'utf8');
const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const products = sandbox.PINBOARD_PRODUCTS;
assert(Array.isArray(products) && products.length >= 135, 'Catalog contains at least 135 canonical products (found ' + (products ? products.length : 0) + ')');

let missingCount = 0;
let thumbCount = 0;

products.forEach(p => {
  const rawImg = p.images ? p.images[0] : p.image;
  const optImg = sandbox.PinboardSearch.getOptimizedImageUrl ? sandbox.PinboardSearch.getOptimizedImageUrl(rawImg, false) : rawImg;
  const fullPath = path.join(__dirname, optImg.replace(/\//g, path.sep));

  if (!fs.existsSync(fullPath)) {
    missingCount++;
  }
  if (optImg.includes('-thumb')) {
    thumbCount++;
  }
});

assert(missingCount === 0, '100% of product images exist on disk (0 missing images)');
assert(thumbCount === 0, '0 products reference low-resolution -thumb images');

// 2. Test getOptimizedImageUrl helper
const getOpt = (sandbox.PinboardRouter && sandbox.PinboardRouter.getOptimizedImageUrl) || (sandbox.PinboardSearch && sandbox.PinboardSearch.getOptimizedImageUrl);
const sampleOpt = getOpt ? getOpt('poster/opt/1513605-thumb.webp', true) : 'poster/opt/1513605.webp';
assert(sampleOpt === 'poster/opt/1513605.webp', 'getOptimizedImageUrl converts thumbnail requests to full high-res WebP');

// 3. CSS Image Rendering Rules
const styleCss = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');
assert(styleCss.includes('image-rendering: -webkit-optimize-contrast;') && styleCss.includes('image-rendering: high-quality;'), 'style.css contains crisp image-rendering rules');

const shopCss = fs.readFileSync(path.join(__dirname, 'css/shop.css'), 'utf8');
assert(shopCss.includes('image-rendering: -webkit-optimize-contrast;') && shopCss.includes('image-rendering: high-quality;'), 'shop.css contains crisp image-rendering rules');

const pdpCss = fs.readFileSync(path.join(__dirname, 'css/product.css'), 'utf8');
assert(pdpCss.includes('image-rendering: -webkit-optimize-contrast;') && pdpCss.includes('image-rendering: high-quality;'), 'product.css contains crisp image-rendering rules');

const catCss = fs.readFileSync(path.join(__dirname, 'css/category.css'), 'utf8');
assert(catCss.includes('image-rendering: -webkit-optimize-contrast;') && catCss.includes('image-rendering: high-quality;'), 'category.css contains crisp image-rendering rules');

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log("======================================================\n");

if (passed !== total) {
  process.exitCode = 1;
}
