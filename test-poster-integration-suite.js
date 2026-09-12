const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PINBOARD 100+ POSTER COLLECTION INTEGRATION TEST SUITE');
console.log('====================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runIntegrationTests() {
  try {
    const productsData = require('./js/products-data.js');
    const allProducts = productsData.PINBOARD_PRODUCTS;

    console.log('--- 1. Catalog Size & ID Continuity ---');
    assert(Array.isArray(allProducts), 'PINBOARD_PRODUCTS is an array');
    assert(allProducts.length >= 100, `Catalog contains 100+ posters (Total: ${allProducts.length})`);
    
    // Check IDs 1 to 20 are strictly preserved
    for (let i = 1; i <= 20; i++) {
      const p = allProducts.find(prod => prod.id === i);
      assert(p !== undefined, `Original Product ID #${i} exists`);
    }

    // Check IDs 21+ are sequential and have unique slugs
    const slugs = new Set();
    const ids = new Set();
    allProducts.forEach(p => {
      assert(!ids.has(p.id), `Unique ID #${p.id}`);
      ids.add(p.id);

      assert(!slugs.has(p.slug), `Unique slug "${p.slug}" for ID #${p.id}`);
      slugs.add(p.slug);
    });

    console.log('\n--- 2. Asset Integrity & WebP Verification ---');
    const ROOT_DIR = path.resolve(__dirname);
    let checkedAssets = 0;

    allProducts.forEach(p => {
      assert(p.title && p.title.trim().length > 0, `Product #${p.id} has valid title`);
      assert(p.regularPrice > 0, `Product #${p.id} has positive regular price (₹${p.regularPrice})`);
      assert(p.salePrice > 0, `Product #${p.id} has positive sale price (₹${p.salePrice})`);
      assert(Array.isArray(p.images) && p.images.length > 0, `Product #${p.id} has images array`);

      // For posters in poster/opt/
      if (p.images[0].startsWith('poster/opt/')) {
        const fullWebp = path.join(ROOT_DIR, p.images[0]);
        assert(fs.existsSync(fullWebp), `Product #${p.id} full WebP exists: ${p.images[0]}`);
        const stat = fs.statSync(fullWebp);
        assert(stat.size > 1000, `Product #${p.id} WebP is non-empty (${(stat.size / 1024).toFixed(0)}KB)`);

        // Check thumbnail
        const thumbWebp = productsData.PinboardRouter.getOptimizedImageUrl(p.images[0], true);
        const thumbPath = path.join(ROOT_DIR, thumbWebp);
        assert(fs.existsSync(thumbPath), `Product #${p.id} thumb exists: ${thumbWebp}`);
        checkedAssets++;
      }
    });
    console.log(`Verified ${checkedAssets} optimized WebP assets and thumbnails.`);

    console.log('\n--- 3. Category Distribution & Tagging ---');
    const categories = ['Movies', 'Cars', 'Motivation', 'Gaming', 'Sports'];
    categories.forEach(cat => {
      const prods = allProducts.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
      assert(prods.length > 0, `Category "${cat}" contains ${prods.length} posters`);
    });

    console.log('\n--- 4. Client Search Engine Verification ---');
    const testQueries = ['spider-man', 'batman', 'porsche', 'mcqueen', 'messi', 'ronaldo', 'arthur morgan', 'discipline', 'tony stark', 'vijay'];
    testQueries.forEach(q => {
      const results = productsData.PinboardSearch.search(q);
      assert(results.length > 0, `Search for "${q}" returned ${results.length} results (Top: "${results[0].title}")`);
    });

    console.log('\n--- 5. Live Server & Endpoint Verification ---');
    // Test product endpoints for new posters
    const sampleIds = [21, 50, 100, 125, 150];
    for (const id of sampleIds) {
      const res = await fetch(`http://localhost:3000/product?id=${id}`);
      assert(res.status === 200, `GET /product?id=${id} returns 200 OK`);
    }

    // Verify static WebP serving
    const sampleWebpRes = await fetch('http://localhost:3000/poster/opt/1513605.webp');
    assert(sampleWebpRes.status === 200, 'Static WebP asset /poster/opt/1513605.webp serves with 200 OK');
    assert(sampleWebpRes.headers.get('content-type').includes('webp'), 'Content-Type header is image/webp');

    console.log('\n====================================================');
    console.log('🎉 ALL 100+ POSTER INTEGRATION TESTS PASSED (100%)!');
    console.log('====================================================');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runIntegrationTests();
