// ==========================================================================
// TEST SUITE: Separate Collection Profile Images From Sale Products
// ==========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n======================================================');
console.log('PINBOARD COLLECTION PROFILE SEPARATION VERIFICATION');
console.log('======================================================\n');

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

const productsJs = fs.readFileSync(path.join(__dirname, 'js', 'products-data.js'), 'utf8');
const categoryJs = fs.readFileSync(path.join(__dirname, 'js', 'category.js'), 'utf8');
const shopJs = fs.readFileSync(path.join(__dirname, 'js', 'shop.js'), 'utf8');

// 1. PINBOARD_COLLECTION_PROFILES dataset exists
test('js/products-data.js defines PINBOARD_COLLECTION_PROFILES dataset', () => {
  assert(productsJs.includes('var PINBOARD_COLLECTION_PROFILES ='), 'Missing PINBOARD_COLLECTION_PROFILES dataset');
  assert(productsJs.includes('type: "collection-profile"'), 'Collection profiles must have type collection-profile');
  assert(productsJs.includes('saleable: false'), 'Collection profiles must have saleable false');
});

// 2. getSaleableProducts safety filter function
test('js/products-data.js defines getSaleableProducts safety filter function', () => {
  assert(productsJs.includes('function getSaleableProducts(products)'), 'Missing getSaleableProducts function');
  assert(productsJs.includes('product.type === \'collection-profile\''), 'getSaleableProducts must exclude collection-profile type');
  assert(productsJs.includes('img.includes(\'cat_\')'), 'getSaleableProducts must exclude cat_ images');
});

// 3. Dataset evaluation test
test('PINBOARD_PRODUCTS contains zero collection-profile images (cat_*.webp)', () => {
  eval(productsJs);
  const profileItems = PINBOARD_PRODUCTS.filter(p => p.images.some(img => img.includes('cat_') || p.type === 'collection-profile'));
  assert.strictEqual(profileItems.length, 0, 'PINBOARD_PRODUCTS must contain 0 collection profile images');
});

// 4. PinboardSearch engine excludes collection profile images
test('PinboardSearch functions filter out collection profile assets', () => {
  eval(productsJs);
  const searchResults = PinboardSearch.search('motivation');
  const catResults = PinboardSearch.getByCategory('Motivation');
  
  const searchProfileImgs = searchResults.filter(p => p.images.some(img => img.includes('cat_')));
  const catProfileImgs = catResults.filter(p => p.images.some(img => img.includes('cat_')));

  assert.strictEqual(searchProfileImgs.length, 0, 'Search results must contain 0 collection profile images');
  assert.strictEqual(catProfileImgs.length, 0, 'Category results must contain 0 collection profile images');
});

// 5. Category JS and Shop JS integration
test('js/category.js and js/shop.js integrate getSaleableProducts safety filter', () => {
  assert(categoryJs.includes('getSaleableProducts'), 'js/category.js must integrate getSaleableProducts');
  assert(productsJs.includes('getSaleableProducts: getSaleableProducts'), 'PinboardSearch must expose getSaleableProducts');
});

console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
