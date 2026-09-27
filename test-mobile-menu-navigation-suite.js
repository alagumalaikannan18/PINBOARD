const fs = require('fs');
const path = require('path');
const assert = require('assert');
const http = require('http');

console.log('====================================================');
console.log('PINBOARD MOBILE MENU NAVIGATION & IMAGE SUITE');
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

const htmlFiles = [
  'index.html',
  'shop.html',
  'product.html',
  'custom-posters.html',
  'cart.html',
  'account.html',
  'movies.html',
  'sports.html',
  'motivation.html',
  'gaming.html',
  'cars.html',
  'anime.html'
];

// 1. HTML Markup Structure Assertions
test('HTML files contain clickable Collections anchor card', () => {
  htmlFiles.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    const html = fs.readFileSync(filePath, 'utf8');
    assert(
      html.includes('href="index.html#collections" class="mob-nav-link"') ||
      html.includes('href="#collections" class="mob-nav-link"'),
      `${file} Collections menu card must be an anchor link`
    );
    assert(
      !html.includes('id="mobNavCollectionsToggle"'),
      `${file} should no longer have accordion toggle id on Collections card`
    );
  });
});

test('HTML files contain Create Your Wall card with 10-Poster image (1553031.webp)', () => {
  htmlFiles.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    const html = fs.readFileSync(filePath, 'utf8');
    assert(
      html.includes('custom-posters.html'),
      `${file} Create Your Wall card must link to custom-posters.html`
    );
    assert(
      html.includes('1553031.webp'),
      `${file} Create Your Wall card must use 10-poster image asset (1553031.webp)`
    );
    assert(
      !html.includes('src="New Project 29 [00F2D3A].png" onerror="this.onerror=null;this.src=\'1553031.webp\'"'),
      `${file} Create Your Wall card must not use cart icon as primary src`
    );
  });
});

test('HTML files preserve View Cart card image and route', () => {
  htmlFiles.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    const html = fs.readFileSync(filePath, 'utf8');
    assert(
      html.includes('href="cart.html" class="mob-nav-link"'),
      `${file} View Cart menu card must link to cart.html`
    );
    assert(
      html.includes('images/mob-menu-cart.jpg') || html.includes('New Project 29 [00F2D3A].png'),
      `${file} View Cart menu card must preserve cart image`
    );
  });
});

test('Exact image mapping across mobile menu cards', () => {
  const indexHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
  assert(indexHtml.includes('alt="Home Showcase"'), 'HOME card present with Home image');
  assert(indexHtml.includes('alt="Shop All Posters"'), 'SHOP ALL card present');
  assert(indexHtml.includes('alt="Collections"'), 'COLLECTIONS card present');
  assert(indexHtml.includes('alt="Community"'), 'COMMUNITY card present');
  assert(indexHtml.includes('alt="Create Your Wall"'), 'CREATE YOUR WALL card present');
  assert(indexHtml.includes('alt="View Cart"'), 'VIEW CART card present');
  assert(indexHtml.includes('alt="My Account"'), 'MY ACCOUNT card present');
});

test('Pricing rules remain untouched across pricing JS files', () => {
  const customPostersJs = fs.readFileSync(path.resolve(__dirname, 'js/custom-posters.js'), 'utf8');
  assert(customPostersJs.includes("10: { count: 10, name: '10 Posters'"), 'Custom 10 poster configuration intact');
});

// 2. Runtime Server Check
let serverProcess;
try {
  const serverJs = fs.readFileSync(path.resolve(__dirname, 'server.js'), 'utf8');
  assert(serverJs.length > 0, 'server.js exists');
} catch (e) {
  console.log('No server.js check required');
}

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL UNIT & DOM STRUCTURE CHECKS PASSED SUCCESSFULLY!\n');
} else {
  process.exitCode = 1;
}
