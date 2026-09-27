const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('PINBOARD POSTER CATALOG DEDUPLICATION & ARTWORK SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// 1. PINBOARD_PRODUCTS Dataset Integrity
const productsDataCode = fs.readFileSync(path.resolve(__dirname, 'js/products-data.js'), 'utf8');
const match = productsDataCode.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
assert(match, 'PINBOARD_PRODUCTS defined in js/products-data.js');
const products = JSON.parse(match[1]);
const { PinboardSearch } = require('./js/products-data.js');

test('PINBOARD_PRODUCTS dataset has zero duplicate IDs', () => {
  const seenIds = new Set();
  products.forEach(p => {
    assert(!seenIds.has(p.id), `Duplicate product ID found in dataset: ${p.id}`);
    seenIds.add(p.id);
  });
});

test('PinboardSearch.deduplicateProducts produces zero duplicate poster artworks', () => {
  const deduplicated = PinboardSearch.deduplicateProducts(products);
  const seenImages = new Set();
  deduplicated.forEach(p => {
    const img = (p.images && p.images[0]) ? String(p.images[0]) : '';
    const baseImg = img.replace(/^.*[\\\/]/, '').replace(/\.(png|jpe?g|webp|avif)$/i, '').replace(/\.jpg\.jpeg$/i, '').toLowerCase();
    assert(!seenImages.has(baseImg), `Duplicate poster artwork found in deduplicated results: ID ${p.id} (${p.title}) shares image ${baseImg}`);
    seenImages.add(baseImg);
  });
});

test('All products use clean WebP artwork files in poster/opt/ without mockup extensions', () => {
  products.forEach(p => {
    const img = (p.images && p.images[0]) ? String(p.images[0]) : '';
    assert(img.startsWith('poster/opt/'), `Product ID ${p.id} (${p.title}) should use clean poster/opt/ artwork path`);
    assert(img.endsWith('.webp'), `Product ID ${p.id} (${p.title}) should use .webp clean image format`);
    assert(!img.includes('.jpg.jpeg'), `Product ID ${p.id} (${p.title}) must not use .jpg.jpeg mockup format`);
  });
});

// 2. PinboardSearch Engine Deduplication Tests

test('PinboardSearch.search deduplicates results across queries', () => {
  const spidermanResults = PinboardSearch.search('Spider-Man');
  const seenIds = new Set();
  spidermanResults.forEach(p => {
    assert(!seenIds.has(p.id), `Search returned duplicate Spider-Man product ID: ${p.id}`);
    seenIds.add(p.id);
  });
});

test('PinboardSearch.getByCategory deduplicates results across categories', () => {
  ['Movies', 'Motivation', 'Cars', 'Gaming', 'Sports'].forEach(cat => {
    const catResults = PinboardSearch.getByCategory(cat);
    const seenIds = new Set();
    catResults.forEach(p => {
      assert(!seenIds.has(p.id), `Category ${cat} returned duplicate product ID: ${p.id}`);
      seenIds.add(p.id);
    });
  });
});

test('PinboardSearch.sortResults deduplicates sorted products', () => {
  ['price-low', 'price-high', 'rating', 'popular', 'newest'].forEach(sort => {
    const sorted = PinboardSearch.sortResults(products, sort);
    const seenIds = new Set();
    sorted.forEach(p => {
      assert(!seenIds.has(p.id), `Sort ${sort} returned duplicate product ID: ${p.id}`);
      seenIds.add(p.id);
    });
  });
});

// 3. Shop & Category Controller Code Assertions
test('js/shop.js uses deduplication in renderShopGrid', () => {
  const shopJsCode = fs.readFileSync(path.resolve(__dirname, 'js/shop.js'), 'utf8');
  assert(shopJsCode.includes('deduplicateProducts'), 'js/shop.js applies deduplicateProducts');
});

test('js/category.js uses deduplication in getFilteredCategoryProducts', () => {
  const categoryJsCode = fs.readFileSync(path.resolve(__dirname, 'js/category.js'), 'utf8');
  assert(categoryJsCode.includes('deduplicateProducts'), 'js/category.js applies deduplicateProducts');
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL POSTER CATALOG DEDUPLICATION CHECKS PASSED SUCCESSFULLY!\n');
} else {
  process.exitCode = 1;
}
