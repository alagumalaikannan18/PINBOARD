/**
 * PINBOARD Product Page Isolation & Redesign Verification Suite
 * Verifies:
 * 1. Product 11 (Red Jersey Messi) contains ONLY 1554016.png (no cross-pollution)
 * 2. Product 14 (Blue Jersey Messi) contains ONLY 1551192.png (no cross-pollution)
 * 3. product.html has completely eliminated derivative widgets (yellow emoji box, BYO wall cross-sell)
 * 4. product.html implements the new editorial design system (3D stage, size cards A6/A5/A4/A3, stepper, CTAs)
 * 5. js/product.js contains isolated rendering, size engine, and 3D perspective handlers
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('PINBOARD PRODUCT ISOLATION & REDESIGN VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
    }
  }

  // --- 1. Product Data Isolation Verification ---
  console.log('--- 1. Testing Product Data Isolation ---');
  const dataPath = path.resolve(__dirname, 'js/products-data.js');
  const dataContent = fs.readFileSync(dataPath, 'utf8');
  const sandbox = {};
  vm.runInNewContext(dataContent, sandbox);
  const products = sandbox.PINBOARD_PRODUCTS || [];

  const prod11 = products.find(p => p.id === 11);
  const prod14 = products.find(p => p.id === 14);

  test('Product 11 (Red Jersey Messi) exists in catalog', () => {
    assert(prod11, 'Product 11 exists');
    assert.strictEqual(prod11.title, 'JUGADOR 10 | Leo Messi Poster');
  });

  test('Product 11 contains strictly ONLY 1 image (Red Jersey: 1554016.png)', () => {
    assert(Array.isArray(prod11.images), 'images is array');
    assert.strictEqual(prod11.images.length, 1, `Expected 1 image, found ${prod11.images.length}`);
    assert.strictEqual(prod11.images[0], '1554016.png');
    assert(!prod11.images.includes('1551192.png'), 'Does NOT contain Product 14 blue jersey image');
  });

  test('Product 14 (Blue Jersey World Cup Messi) contains strictly ONLY 1 image (1551192.png)', () => {
    assert(prod14, 'Product 14 exists');
    assert.strictEqual(prod14.images.length, 1, `Expected 1 image, found ${prod14.images.length}`);
    assert.strictEqual(prod14.images[0], '1551192.png');
    assert(!prod14.images.includes('1554016.png'), 'Does NOT contain Product 11 red jersey image');
  });

  // --- 2. Live API Verification ---
  console.log('\n--- 2. Testing Live Express API Output ---');
  const res11 = await fetch(`${BASE_URL}/api/products/11`).then(r => r.json());
  test('GET /api/products/11 returns isolated image array with strictly 1 image', () => {
    assert(res11.success, 'API call succeeded');
    assert.strictEqual(res11.data.images.length, 1);
    assert.strictEqual(res11.data.images[0], '1554016.png');
  });

  const res14 = await fetch(`${BASE_URL}/api/products/14`).then(r => r.json());
  test('GET /api/products/14 returns isolated image array with strictly 1 image', () => {
    assert(res14.success, 'API call succeeded');
    assert.strictEqual(res14.data.images.length, 1);
    assert.strictEqual(res14.data.images[0], '1551192.png');
  });

  // --- 3. HTML Structure & Old PINBOARD UI Verification ---
  console.log('\n--- 3. Verifying Restored product.html Markup ---');
  const htmlPath = path.resolve(__dirname, 'product.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  test('product.html does NOT contain delivery tracker card (cleanly removed)', () => {
    assert(!htmlContent.includes('pdp-delivery-card'), 'Does not contain pdp-delivery-card');
    assert(!htmlContent.includes('ESTIMATED DELIVERY'), 'Does not contain ESTIMATED DELIVERY');
    assert(!htmlContent.includes('id="pdpDeliveryDate"'), 'Does not contain pdpDeliveryDate');
  });

  test('product.html contains "CREATE YOUR WALL" banner linking to custom-posters.html', () => {
    assert(htmlContent.includes('pdp-wall-banner'), 'Contains pdp-wall-banner');
    assert(htmlContent.includes('CREATE YOUR WALL'), 'Contains CREATE YOUR WALL banner text');
    assert(htmlContent.includes('custom-posters.html'), 'Links to custom-posters.html');
  });

  test('product.html contains breadcrumb and rating rows', () => {
    assert(htmlContent.includes('id="pdpBreadcrumb"'), 'Contains pdpBreadcrumb');
    assert(htmlContent.includes('id="pdpRatingScore"'), 'Contains pdpRatingScore');
    assert(htmlContent.includes('id="pdpReviewCount"'), 'Contains pdpReviewCount');
  });

  test('product.html contains studio wall gallery stage and framed image', () => {
    assert(htmlContent.includes('id="pdpStagePerspective"'), 'Contains pdpStagePerspective');
    assert(htmlContent.includes('id="pdpPosterWrapper"'), 'Contains pdpPosterWrapper');
    assert(htmlContent.includes('id="pdpMainImg"'), 'Contains pdpMainImg');
  });

  test('product.html contains 4-tier interactive size selector (A6, A5, A4, A3)', () => {
    assert(htmlContent.includes('id="pdpSizeGrid"'), 'Contains pdpSizeGrid');
    assert(htmlContent.includes('data-size="A6"'), 'Contains A6 size card');
    assert(htmlContent.includes('data-size="A5"'), 'Contains A5 size card');
    assert(htmlContent.includes('data-size="A4"'), 'Contains A4 size card');
    assert(htmlContent.includes('data-size="A3"'), 'Contains A3 size card');
  });

  test('product.html contains price module and action CTAs', () => {
    assert(htmlContent.includes('id="pdpCurrentPrice"'), 'Contains pdpCurrentPrice');
    assert(htmlContent.includes('id="pdpOriginalMrp"'), 'Contains pdpOriginalMrp');
    assert(htmlContent.includes('id="pdpAddCart"'), 'Contains pdpAddCart');
    assert(htmlContent.includes('id="pdpBuyNow"'), 'Contains pdpBuyNow');
    assert(htmlContent.includes('id="pdpQtyMinus"'), 'Contains pdpQtyMinus');
    assert(htmlContent.includes('id="pdpQtyPlus"'), 'Contains pdpQtyPlus');
  });

  // --- 4. Logic & Interactivity Verification in js/product.js ---
  console.log('\n--- 4. Verifying js/product.js Logic ---');
  const jsPath = path.resolve(__dirname, 'js/product.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  test('js/product.js contains dynamic computeSizePrice engine', () => {
    assert(jsContent.includes('computeSizePrice'), 'Contains computeSizePrice');
    assert(jsContent.includes('SIZE_SPECS'), 'Contains SIZE_SPECS');
  });

  test('js/product.js handles 3D perspective hover tilt', () => {
    assert(jsContent.includes('pdpStagePerspective'), 'Inspects pdpStagePerspective');
    assert(jsContent.includes('rotateY'), 'Computes rotateY');
    assert(jsContent.includes('rotateX'), 'Computes rotateX');
  });

  test('js/product.js strictly hides thumbnail container when images.length <= 1', () => {
    assert(jsContent.includes("thumbsContainer.style.display = 'none'"), 'Hides thumbs when 1 image');
  });

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed}/${total} PRODUCT ISOLATION & REDESIGN TESTS PASSED!`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
