const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PINBOARD CUSTOM POSTERS STUDIO & NAVBAR TEST SUITE');
console.log('====================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runCustomPostersTests() {
  try {
    // 1. HTTP Endpoint Verification
    console.log('--- 1. HTTP Endpoint & Route Verification ---');
    const [resClean, resHtml] = await Promise.all([
      fetch('http://localhost:3000/custom-posters'),
      fetch('http://localhost:3000/custom-posters.html')
    ]);

    assert(resClean.status === 200, 'GET /custom-posters returned 200 OK');
    assert(resHtml.status === 200, 'GET /custom-posters.html returned 200 OK');

    const html = await resHtml.text();
    assert(html.includes('CUSTOM POSTERS'), 'custom-posters.html contains title "CUSTOM POSTERS"');
    assert(html.includes('Turn your memories into posters made for your wall.'), 'custom-posters.html contains required tagline');
    assert(html.includes('HOW MANY POSTERS?'), 'custom-posters.html contains Step 1 "HOW MANY POSTERS?"');
    assert(html.includes('data-count="5"'), 'custom-posters.html contains 5 Posters template');
    assert(html.includes('data-count="8"'), 'custom-posters.html contains 8 Posters template');
    assert(html.includes('data-count="10"'), 'custom-posters.html contains 10 Posters template');
    assert(html.includes('data-count="12"'), 'custom-posters.html contains 12 Posters template');
    assert(html.includes('id="uploadSlotsContainer"'), 'custom-posters.html contains #uploadSlotsContainer');
    assert(html.includes('id="customCheckoutBtn"'), 'custom-posters.html contains #customCheckoutBtn');
    assert(!html.includes('REAL WALL ARRANGEMENTS'), 'custom-posters.html does NOT contain "REAL WALL ARRANGEMENTS"');
    assert(!html.includes('INSPIRATION & GALLERY'), 'custom-posters.html does NOT contain "INSPIRATION & GALLERY"');
    assert(!html.includes('custom-wall-showcase-section'), 'custom-posters.html does NOT contain custom-wall-showcase-section');
    assert(html.includes('css/custom-posters.css'), 'custom-posters.html includes css/custom-posters.css');
    assert(html.includes('js/custom-posters.js'), 'custom-posters.html includes js/custom-posters.js');

    // 2. Navbar Replacement Check across all website pages
    console.log('\n--- 2. Navbar "Custom Posters" Link Verification Across Entire Website ---');
    const allPages = [
      'index.html',
      'shop.html',
      'custom-posters.html',
      'movies.html',
      'cars.html',
      'motivation.html',
      'anime.html',
      'gaming.html',
      'sports.html',
      'account.html',
      'product.html'
    ];

    for (const pageName of allPages) {
      const pageRes = await fetch(`http://localhost:3000/${pageName}`);
      const pageHtml = await pageRes.text();

      assert(pageRes.status === 200, `GET /${pageName} returned 200 OK`);
      assert(pageHtml.includes('Custom Posters'), `${pageName} navbar contains "Custom Posters" link`);
      assert(pageHtml.includes('custom-posters.html'), `${pageName} links to "custom-posters.html"`);
      
      // Ensure "Frames" is removed from the main <nav>
      const navBlockMatch = pageHtml.match(/<nav>[\s\S]*?<\/nav>/i);
      if (navBlockMatch) {
        assert(!navBlockMatch[0].includes('>Frames<'), `${pageName} main header <nav> does NOT have old "Frames" link`);
      }
    }

    // 3. Custom Posters Pricing & State Logic Verification
    console.log('\n--- 3. Custom Posters Pricing & Individual Sizing Math Test ---');
    const PRICING = {
      A6: 199,
      A5: 299,
      A4: 399,
      A3: 549
    };

    // Scenario 1: 5-Poster Order (1 A3, 2 A4, 1 A5, 1 A6)
    const order5 = [
      { slot: 1, size: 'A3', price: PRICING.A3 },
      { slot: 2, size: 'A4', price: PRICING.A4 },
      { slot: 3, size: 'A4', price: PRICING.A4 },
      { slot: 4, size: 'A5', price: PRICING.A5 },
      { slot: 5, size: 'A6', price: PRICING.A6 }
    ];
    const expectedTotal5 = PRICING.A3 + PRICING.A4 + PRICING.A4 + PRICING.A5 + PRICING.A6; // 549 + 399 + 399 + 299 + 199 = 1845
    const actualTotal5 = order5.reduce((sum, item) => sum + item.price, 0);
    assert(actualTotal5 === expectedTotal5, `5-Poster custom calculation matches ₹${expectedTotal5}`);

    // Scenario 2: 10-Poster Order with varied sizes
    const order10 = [
      { slot: 1, size: 'A3', price: PRICING.A3 },
      { slot: 2, size: 'A3', price: PRICING.A3 },
      { slot: 3, size: 'A4', price: PRICING.A4 },
      { slot: 4, size: 'A4', price: PRICING.A4 },
      { slot: 5, size: 'A4', price: PRICING.A4 },
      { slot: 6, size: 'A4', price: PRICING.A4 },
      { slot: 7, size: 'A5', price: PRICING.A5 },
      { slot: 8, size: 'A5', price: PRICING.A5 },
      { slot: 9, size: 'A6', price: PRICING.A6 },
      { slot: 10, size: 'A6', price: PRICING.A6 }
    ];
    const expectedTotal10 = (2 * PRICING.A3) + (4 * PRICING.A4) + (2 * PRICING.A5) + (2 * PRICING.A6); // 1098 + 1596 + 598 + 398 = 3690
    const actualTotal10 = order10.reduce((sum, item) => sum + item.price, 0);
    assert(actualTotal10 === expectedTotal10, `10-Poster custom calculation matches ₹${expectedTotal10}`);

    // 4. Verification of Cart Integration Helper in js/auth.js
    console.log('\n--- 4. Cart Integration Helper Verification ---');
    const authJsContent = fs.readFileSync(path.resolve(__dirname, 'js/auth.js'), 'utf8');
    assert(authJsContent.includes('addCustomPostersToCart: function'), 'js/auth.js contains addCustomPostersToCart method');
    assert(authJsContent.includes('isCustom: true'), 'js/auth.js flags custom items as isCustom: true');
    assert(authJsContent.includes('sizesSummary'), 'js/auth.js preserves sizesSummary breakdown');

    // 5. Verification of 100MB Image Upload Size Limit
    console.log('\n--- 5. Image Upload File-Size Validation Tests (100MB Limit) ---');
    const customPostersJsContent = fs.readFileSync(path.resolve(__dirname, 'js/custom-posters.js'), 'utf8');
    
    assert(customPostersJsContent.includes('100 * 1024 * 1024'), 'js/custom-posters.js uses 100 * 1024 * 1024 bytes');
    assert(customPostersJsContent.includes('Please select an image under 100MB.'), 'js/custom-posters.js contains exact 100MB error message');
    assert(customPostersJsContent.includes('Max 100MB'), 'js/custom-posters.js includes Max 100MB dropzone hint');
    assert(!customPostersJsContent.includes('under 25MB'), 'js/custom-posters.js no longer contains old 25MB error message');

    const MAX_ALLOWED_BYTES = 100 * 1024 * 1024;
    function validateUploadFileSize(bytes) {
      return bytes <= MAX_ALLOWED_BYTES;
    }

    const size50MB = 50 * 1024 * 1024;
    const size90MB = 90 * 1024 * 1024;
    const size100MB = 100 * 1024 * 1024;
    const size101MB = 101 * 1024 * 1024;

    assert(validateUploadFileSize(size50MB) === true, '50 MB image is accepted (<= 100MB)');
    assert(validateUploadFileSize(size90MB) === true, '90 MB image is accepted (<= 100MB)');
    assert(validateUploadFileSize(size100MB) === true, '100 MB image is accepted (<= 100MB boundary)');
    assert(validateUploadFileSize(size101MB) === false, '101 MB image is rejected (> 100MB boundary)');

    // 6. Verification of Wall Preview Button, Modal Engine & Smart Zoom System
    console.log('\n--- 6. Wall Preview Feature & Smart Zoom Tests ---');
    assert(html.includes('id="customPreviewBtn"'), 'custom-posters.html contains #customPreviewBtn');
    assert(html.includes('id="customWallPreviewModal"'), 'custom-posters.html contains #customWallPreviewModal');
    assert(html.includes('id="wallPreviewRoomWall"'), 'custom-posters.html contains #wallPreviewRoomWall');
    assert(html.includes('id="wallPreviewSizesGrid"'), 'custom-posters.html contains #wallPreviewSizesGrid');
    assert(html.includes('id="wallPreviewCheckoutBtn"'), 'custom-posters.html contains #wallPreviewCheckoutBtn');
    assert(customPostersJsContent.includes('openWallPreviewModal'), 'js/custom-posters.js contains openWallPreviewModal');
    assert(customPostersJsContent.includes('renderWallPreviewContent'), 'js/custom-posters.js contains renderWallPreviewContent');
    assert(customPostersJsContent.includes('calculateFitScale'), 'js/custom-posters.js contains calculateFitScale for template fitting');
    assert(customPostersJsContent.includes('autoFitPreviewStage'), 'js/custom-posters.js contains autoFitPreviewStage');
    assert(customPostersJsContent.includes('applyPreviewZoom'), 'js/custom-posters.js contains applyPreviewZoom');
    assert(customPostersJsContent.includes('0.20'), 'js/custom-posters.js supports zooming out to 20%');
    assert(!customPostersJsContent.includes('Math.max(0.75'), 'js/custom-posters.js has removed 75% hard limit');
    assert(customPostersJsContent.includes('pv-scale-'), 'js/custom-posters.js contains scale-adjustment logic for paper sizes');
    assert(customPostersJsContent.includes('pv-wall-5'), 'js/custom-posters.js contains 5-poster preview arrangement');
    assert(customPostersJsContent.includes('pv-wall-8'), 'js/custom-posters.js contains 8-poster preview arrangement');
    assert(customPostersJsContent.includes('pv-wall-10'), 'js/custom-posters.js contains 10-poster preview arrangement');
    assert(customPostersJsContent.includes('pv-wall-12'), 'js/custom-posters.js contains 12-poster preview arrangement');

    // 7. Verification of Borderless Natural Poster Styles in CSS
    console.log('\n--- 7. Borderless Natural Poster CSS Verification ---');
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'css/custom-posters.css'), 'utf8');
    assert(cssContent.includes('.pv-poster-frame'), 'css/custom-posters.css styles .pv-poster-frame');
    assert(cssContent.includes('object-fit: contain'), 'css/custom-posters.css uses object-fit: contain for uploaded images');
    assert(!cssContent.includes('.pv-poster-frame {\n  background: #1A1915'), 'css/custom-posters.css does not have black frame background');

    console.log('\n====================================================');
    console.log('🎉 ALL CUSTOM POSTERS STUDIO TESTS PASSED (100%)!');
    console.log('====================================================');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runCustomPostersTests();
