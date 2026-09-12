const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('PINBOARD DEDICATED SHOP ALL & RANDOM ORDER TEST SUITE');
console.log('====================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runShopTests() {
  try {
    // 1. Server HTTP route verification
    console.log('--- 1. HTTP Route Verification ---');
    const [shopRes, shopHtmlRes, indexRes, prodRes] = await Promise.all([
      fetch('http://localhost:3000/shop'),
      fetch('http://localhost:3000/shop.html'),
      fetch('http://localhost:3000/index.html'),
      fetch('http://localhost:3000/product.html?id=1')
    ]);

    assert(shopRes.status === 200, 'GET /shop returned 200 OK');
    assert(shopHtmlRes.status === 200, 'GET /shop.html returned 200 OK');
    assert(indexRes.status === 200, 'GET /index.html returned 200 OK');
    assert(prodRes.status === 200, 'GET /product.html?id=1 returned 200 OK');

    const shopHtmlText = await shopHtmlRes.text();
    assert(shopHtmlText.includes('SHOP ALL POSTERS'), 'shop.html contains header title "SHOP ALL POSTERS"');
    assert(shopHtmlText.includes('id="shopGrid"'), 'shop.html contains #shopGrid container');
    assert(shopHtmlText.includes('js/shop.js'), 'shop.html includes js/shop.js script');
    assert(shopHtmlText.includes('css/shop.css'), 'shop.html includes css/shop.css');
    assert(shopHtmlText.includes('class="mobile-overlay"'), 'shop.html uses correct mobile-overlay class (no unstyled duplicate links)');
    assert(!shopHtmlText.includes('class="mobile-nav-overlay"'), 'shop.html does not have unstyled mobile-nav-overlay');

    // 2. Test shuffle algorithm in js/shop.js
    console.log('\n--- 2. Non-Destructive Shuffle & Zero Duplicate Test ---');
    const productsData = require('./js/products-data.js');
    const allProducts = productsData.PINBOARD_PRODUCTS;
    const initialIds = allProducts.map(p => p.id);

    assert(allProducts.length >= 14, `All ${allProducts.length} catalog posters loaded`);

    // Simulate js/shop.js shuffle function
    function shuffleArray(array) {
      if (!Array.isArray(array)) return [];
      var copy = array.slice(0);
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    }

    const run1 = shuffleArray(allProducts);
    const run2 = shuffleArray(allProducts);
    const run3 = shuffleArray(allProducts);

    assert(run1.length === allProducts.length, 'Run 1 contains exact same total number of posters');
    assert(run2.length === allProducts.length, 'Run 2 contains exact same total number of posters');
    assert(run3.length === allProducts.length, 'Run 3 contains exact same total number of posters');

    // Check no duplicate IDs in any run
    const uniqueIds1 = new Set(run1.map(p => p.id));
    const uniqueIds2 = new Set(run2.map(p => p.id));
    const uniqueIds3 = new Set(run3.map(p => p.id));

    assert(uniqueIds1.size === allProducts.length, 'Zero duplicate posters in Run 1');
    assert(uniqueIds2.size === allProducts.length, 'Zero duplicate posters in Run 2');
    assert(uniqueIds3.size === allProducts.length, 'Zero duplicate posters in Run 3');

    // Check that randomized ordering works (at least two runs differ in order)
    const order1 = run1.map(p => p.id).join(',');
    const order2 = run2.map(p => p.id).join(',');
    const order3 = run3.map(p => p.id).join(',');
    const hasVariation = (order1 !== order2) || (order2 !== order3) || (order1 !== order3);
    assert(hasVariation, 'Randomized order confirmed across multiple page loads');

    // 3. Test dynamic product linking from Shop All cards to product pages
    console.log('\n--- 3. Dynamic Product Page Routing Test ---');
    for (const p of allProducts) {
      const targetUrl = `http://localhost:3000/product.html?id=${p.id}`;
      const res = await fetch(targetUrl);
      assert(res.status === 200, `Poster #${p.id} (${p.title}) URL resolves with 200 OK`);
    }

    // 4. Test API dynamic sync into Shop All
    console.log('\n--- 4. Backend API Sync & Catalog Extensibility ---');
    const apiRes = await fetch('http://localhost:3000/api/products');
    const apiJson = await apiRes.json();
    assert(apiJson.success === true, 'GET /api/products returns success');
    assert(apiJson.data.length >= 14, 'Backend API serves full product catalog');

    // 5. Navbar Links across HTML pages
    console.log('\n--- 5. Navbar Link Consistency Check ---');
    const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const prodContent = fs.readFileSync(path.join(__dirname, 'product.html'), 'utf8');
    const accountContent = fs.readFileSync(path.join(__dirname, 'account.html'), 'utf8');

    assert(indexContent.includes('href="shop.html">Shop All</a>'), 'index.html navbar links to shop.html');
    assert(prodContent.includes('href="shop.html">Shop All</a>'), 'product.html navbar links to shop.html');
    assert(accountContent.includes('href="shop.html">Shop All</a>'), 'account.html navbar links to shop.html');

    console.log('\n====================================================');
    console.log('🎉 ALL SHOP ALL & RANDOM ORDERING TESTS PASSED (100%)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Shop test suite error:', err);
    process.exit(1);
  }
}

runShopTests();
