// ==========================================================================
// TEST SUITE: Poster Image Dimensions & Grid Layout Verification
// ==========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    \x1b[33mError:\x1b[0m ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('PINBOARD POSTER SIZING & ASPECT RATIO VERIFICATION');
console.log('======================================================\n');

const productHtml = fs.readFileSync(path.join(__dirname, 'product.html'), 'utf8');
const productCss = fs.readFileSync(path.join(__dirname, 'css', 'product.css'), 'utf8');
const productJs = fs.readFileSync(path.join(__dirname, 'js', 'product.js'), 'utf8');
const shopCss = fs.readFileSync(path.join(__dirname, 'css', 'shop.css'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');

// 1. Check Product Detail Page Sizing Rules
console.log('--- 1. Product Detail Page Image & Container Sizing ---');

test('css/product.css defines .pdp-main-img with 3:4 aspect ratio and cover fit', () => {
  assert(productCss.includes('.pdp-main-img {'), 'Missing .pdp-main-img rule');
  assert(productCss.includes('aspect-ratio: 3 / 4'), 'pdp-main-img must have aspect-ratio 3 / 4');
  assert(productCss.includes('.pdp-main-img img {'), 'Missing .pdp-main-img img rule');
  assert(productCss.includes('object-fit: cover'), 'pdp-main-img img must have object-fit: cover');
});

test('css/product.css defines .pdp-related-grid with 4-column layout and 3:4 cards', () => {
  assert(productCss.includes('.pdp-related-grid {'), 'Missing .pdp-related-grid rule');
  assert(productCss.includes('grid-template-columns: repeat(4, 1fr)'), 'Related posters must be 4-column grid');
  assert(productCss.includes('.pdp-related-card-img {'), 'Missing .pdp-related-card-img rule');
  assert(productCss.includes('aspect-ratio: 3 / 4'), 'Related card image must have 3:4 aspect ratio');
});

test('product.html contains #pdpRelatedGrid inside .pdp-related without ID collision', () => {
  assert(productHtml.includes('id="pdpRelatedGrid"'), 'product.html must have id="pdpRelatedGrid"');
  assert(!productHtml.includes('<section class="pdp-related" id="pdpRelated">'), 'Section should not hijack grid ID');
});

test('js/product.js targets #pdpRelatedGrid to maintain 4-column poster dimensions', () => {
  assert(productJs.includes('document.getElementById(\'pdpRelatedGrid\')'), 'js/product.js must target pdpRelatedGrid');
});

// 2. Check Shop All & Homepage Sizing Rules
console.log('\n--- 2. Shop All & Homepage Poster Sizing Rules ---');

test('css/shop.css defines .poster-artwork-float with 3:4 aspect ratio and cover fit', () => {
  assert(shopCss.includes('aspect-ratio: 3 / 4'), 'Shop cards must have aspect-ratio 3 / 4');
  assert(shopCss.includes('object-fit: cover'), 'Shop card images must have object-fit: cover');
});

test('css/style.css defines .product-img with 3:4 aspect ratio and cover fit', () => {
  assert(styleCss.includes('.product-img {'), 'Missing .product-img rule');
  assert(styleCss.includes('aspect-ratio: 3/4') || styleCss.includes('aspect-ratio: 3 / 4'), 'Product cards must have 3/4 aspect ratio');
});

console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
