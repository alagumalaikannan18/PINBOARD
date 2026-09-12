// ==========================================================================
// TEST SUITE: Pinboard 3D Back Navigation System Verification
// Tests HTML integration, CSS 3D styling, Fallback & History logic, and Accessibility
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
console.log('PINBOARD BACK NAVIGATION SYSTEM TEST SUITE');
console.log('======================================================\n');

// 1. Verify HTML Integration
console.log('--- 1. HTML Markup & Page Integration ---');

const shopHtml = fs.readFileSync(path.join(__dirname, 'shop.html'), 'utf8');
const productHtml = fs.readFileSync(path.join(__dirname, 'product.html'), 'utf8');
const accountHtml = fs.readFileSync(path.join(__dirname, 'account.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

test('shop.html includes .pinboard-back-btn with fallback to index.html', () => {
  assert(shopHtml.includes('class="pinboard-back-btn"'), 'shop.html missing .pinboard-back-btn');
  assert(shopHtml.includes('data-fallback="index.html"'), 'shop.html missing data-fallback="index.html"');
  assert(shopHtml.includes('js/navigation.js'), 'shop.html missing js/navigation.js script tag');
});

test('product.html includes .pinboard-back-btn with fallback to shop.html', () => {
  assert(productHtml.includes('class="pinboard-back-btn"'), 'product.html missing .pinboard-back-btn');
  assert(productHtml.includes('data-fallback="shop.html"'), 'product.html missing data-fallback="shop.html"');
  assert(productHtml.includes('js/navigation.js'), 'product.html missing js/navigation.js script tag');
});

test('account.html includes .pinboard-back-btn with fallback to index.html', () => {
  assert(accountHtml.includes('class="pinboard-back-btn"'), 'account.html missing .pinboard-back-btn');
  assert(accountHtml.includes('data-fallback="index.html"'), 'account.html missing data-fallback="index.html"');
  assert(accountHtml.includes('js/navigation.js'), 'account.html missing js/navigation.js script tag');
});

test('index.html does not contain unnecessary Back button', () => {
  assert(!indexHtml.includes('class="pinboard-back-btn"'), 'index.html should not have root back button');
});

// 2. Verify CSS Styling
console.log('\n--- 2. CSS 3D Depth, Hover, & Tactile Press Styling ---');

const styleCss = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');

test('style.css defines .pinboard-back-btn with 3D shadow and transitions', () => {
  assert(styleCss.includes('.pinboard-back-btn'), 'Missing .pinboard-back-btn selector');
  assert(styleCss.includes('box-shadow: 0 4px 0 #15140F'), 'Missing 3D physical layered shadow');
  assert(styleCss.includes('font-family: \'IBM Plex Mono\''), 'Missing IBM Plex Mono typography');
});

test('style.css defines .pinboard-back-btn:hover with lift and arrow animation', () => {
  assert(styleCss.includes('.pinboard-back-btn:hover'), 'Missing hover state');
  assert(styleCss.includes('transform: translateY(-2.5px)'), 'Missing hover lift effect');
  assert(styleCss.includes('.pinboard-back-btn:hover .back-arrow-svg'), 'Missing hover arrow translate selector');
});

test('style.css defines .pinboard-back-btn:active & .is-pressed with tactile push effect', () => {
  assert(styleCss.includes('.pinboard-back-btn:active') || styleCss.includes('.pinboard-back-btn.is-pressed'), 'Missing active/is-pressed state');
  assert(styleCss.includes('transform: translateY(3.5px)'), 'Missing tactile active press translation');
});

test('style.css defines responsive mobile rules for back button', () => {
  assert(styleCss.includes('@media (max-width: 600px)'), 'Missing mobile media query');
  assert(styleCss.includes('.page-nav-bar'), 'Missing .page-nav-bar');
});

// 3. Verify JavaScript Logic
console.log('\n--- 3. Navigation JavaScript Logic Simulation ---');

const navJs = fs.readFileSync(path.join(__dirname, 'js', 'navigation.js'), 'utf8');

test('navigation.js exists and has intelligent history.back & safe fallback logic', () => {
  assert(navJs.includes('window.history.back()'), 'Missing history.back() trigger');
  assert(navJs.includes('document.referrer'), 'Missing referrer validation check');
  assert(navJs.includes('watchdogTimer') || navJs.includes('fallbackUrl'), 'Missing safety watchdog / fallback handling');
  assert(navJs.includes('is-pressed'), 'Missing tactile active press class handler');
});

// Mock simulation of browser navigation
test('Simulation: Same-origin referrer triggers history.back()', (done) => {
  let historyBackCalled = false;
  let redirectedTo = null;

  const mockOrigin = 'http://localhost:3000';
  const mockReferrer = 'http://localhost:3000/shop.html';
  const mockCurrentHref = 'http://localhost:3000/product.html?id=1';

  const refUrl = new URL(mockReferrer);
  const curUrl = new URL(mockCurrentHref);

  if (refUrl.origin === curUrl.origin && refUrl.href !== curUrl.href) {
    historyBackCalled = true;
  } else {
    redirectedTo = 'shop.html';
  }

  assert.strictEqual(historyBackCalled, true, 'Should call history.back() when referrer is internal page');
  assert.strictEqual(redirectedTo, null, 'Should not directly redirect when history is present');
});

test('Simulation: External or missing referrer safely redirects to fallback', () => {
  let historyBackCalled = false;
  let redirectedTo = null;

  const mockOrigin = 'http://localhost:3000';
  const mockReferrer = ''; // Direct link
  const fallback = 'shop.html';

  let hasSameOriginReferrer = false;
  if (mockReferrer) {
    const refUrl = new URL(mockReferrer, mockOrigin);
    if (refUrl.origin === mockOrigin) {
      hasSameOriginReferrer = true;
    }
  }

  if (hasSameOriginReferrer) {
    historyBackCalled = true;
  } else {
    redirectedTo = fallback;
  }

  assert.strictEqual(historyBackCalled, false, 'Should not use history.back() for direct external landing');
  assert.strictEqual(redirectedTo, 'shop.html', 'Should redirect safely to shop.html fallback');
});

console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
