// test-space3d-suite.js
const fs = require('fs');
const http = require('http');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: INTERACTIVE 3D SECTION ===\n');

// 1. Verify index.html contains the section in the exact specified position
console.log('Test 1: Section Placement & Flow in index.html');
const indexHtml = fs.readFileSync('index.html', 'utf8');

const placardsIndex = indexHtml.indexOf('class="placards"');
const space3dIndex = indexHtml.indexOf('id="space3d"');
const newsletterIndex = indexHtml.indexOf('class="newsletter"');

assert(placardsIndex !== -1, 'Customer Feedback (.placards) section exists');
assert(space3dIndex !== -1, 'New Interactive 3D section (#space3d) exists');
assert(newsletterIndex !== -1, 'Stay Pinned / Newsletter (.newsletter) section exists');
assert(placardsIndex < space3dIndex, 'Customer Feedback appears BEFORE 3D Section');
assert(space3dIndex < newsletterIndex, '3D Section appears BEFORE Stay Pinned / Newsletter');

// Check there is no other major section placed between them
const betweenPlacardsAnd3D = indexHtml.substring(placardsIndex, space3dIndex);
const between3DAndNewsletter = indexHtml.substring(space3dIndex, newsletterIndex);
assert(!betweenPlacardsAnd3D.includes('<section class="configurator"'), 'No unwanted section between placards and 3D');
assert(between3DAndNewsletter.includes('</section>'), '3D section closes properly before newsletter');

// 2. Verify Content & Typography
console.log('\nTest 2: PINBOARD Typography, Copy & Identity');
assert(indexHtml.includes('CURATED FOR YOUR WALL'), 'Contains small tag "CURATED FOR YOUR WALL"');
assert(indexHtml.includes('BRING YOUR WALL TO LIFE'), 'Contains main heading "BRING YOUR WALL TO LIFE"');
assert(indexHtml.includes('Discover premium prints, iconic moments, cinematic artwork'), 'Contains curated description');
assert(indexHtml.includes('Shop the Wall'), 'Contains "Shop the Wall" CTA button');
assert(indexHtml.includes('Explore All Posters'), 'Contains "Explore All Posters" CTA button');
assert(indexHtml.includes('data-mode="cluster"'), 'Contains "CLUSTER 3D" mode toggle');
assert(indexHtml.includes('data-mode="wide"'), 'Contains "WIDE VIEW" mode toggle');
assert(indexHtml.includes('data-mode="focus"'), 'Contains "MINIMAL" mode toggle');

// 3. Verify 3D Stage & Poster Data
console.log('\nTest 3: 3D Stage Architecture & Poster Attributes');
assert(indexHtml.includes('id="space3dViewport"'), 'Viewport container exists');
assert(indexHtml.includes('id="space3dStage"'), '3D Stage container exists');
assert(indexHtml.includes('data-product-id="12"'), 'Centerpiece Spider-Man poster exists');
assert(indexHtml.includes('data-product-id="2"'), 'Bauhaus No.7 card exists');
assert(indexHtml.includes('data-product-id="14"'), 'Messi Immortal card exists');
assert(indexHtml.includes('data-product-id="1"'), 'Sunset Ridge card exists');
assert(indexHtml.includes('data-product-id="13"'), 'Doctor Doom card exists');
assert(indexHtml.includes('data-base-z='), 'Cards have data-base-z coordinates');
assert(indexHtml.includes('data-depth='), 'Cards have data-depth parallax multiplier');

// 4. Verify Script & CSS Architecture
console.log('\nTest 4: CSS & JS Architecture');
assert(fs.existsSync('js/space3d.js'), 'js/space3d.js file exists');
const space3dJs = fs.readFileSync('js/space3d.js', 'utf8');
assert(space3dJs.includes('requestAnimationFrame'), 'space3d.js uses 60fps requestAnimationFrame physics loop');
assert(space3dJs.includes('pointermove'), 'space3d.js handles pointermove for cursor tracking');
assert(space3dJs.includes('touchmove'), 'space3d.js handles touchmove for mobile/tablet');
assert(space3dJs.includes('window.location.href'), 'space3d.js navigates to product.html on card click');

const styleCss = fs.readFileSync('css/style.css', 'utf8');
assert(styleCss.includes('.interactive-3d-space'), 'CSS defines .interactive-3d-space');
assert(styleCss.includes('perspective: 1400px'), 'CSS uses 1400px 3D perspective');
assert(styleCss.includes('transform-style: preserve-3d'), 'CSS uses preserve-3d for true depth');
assert(styleCss.includes('.space3d-card'), 'CSS defines .space3d-card styling and shadows');
assert(styleCss.includes('@media (max-width: 900px)'), 'CSS contains tablet responsive rules for 3D space');
assert(styleCss.includes('@media (max-width: 600px)'), 'CSS contains mobile responsive rules for 3D space');

// 5. Verify HTTP Response
console.log('\nTest 5: Live Local Server Response');
http.get('http://localhost:3000/', (res) => {
  assert(res.statusCode === 200, `Local server returns 200 OK (got ${res.statusCode})`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    assert(data.includes('id="space3d"'), 'Served index.html contains #space3d');
    assert(data.includes('js/space3d.js'), 'Served index.html references js/space3d.js');
    
    console.log(`\n========================================`);
    console.log(`RESULTS: Passed: ${passed}, Failed: ${failed}`);
    console.log(`========================================\n`);
    
    if (failed > 0) process.exit(1);
  });
}).on('error', (err) => {
  console.error('HTTP request failed:', err.message);
  process.exit(1);
});
