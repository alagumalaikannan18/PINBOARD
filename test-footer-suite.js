// ==========================================================================
// TEST SUITE: Pinboard 4-Column Responsive Footer Layout Verification
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
console.log('PINBOARD 4-COLUMN FOOTER SYSTEM TEST SUITE');
console.log('======================================================\n');

const files = ['index.html', 'shop.html', 'product.html', 'account.html'];
const styleCss = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');

// 1. Verify 4-Column Markup on all Pages
console.log('--- 1. HTML Multi-Column Structure Across All Pages ---');

files.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

  test(`${file} contains .foot-grid with all 4 columns`, () => {
    assert(content.includes('class="foot-grid"'), `${file} missing .foot-grid`);
    assert(content.includes('class="foot-brand"'), `${file} missing Column 1 .foot-brand`);
    assert(content.includes('<h4>SHOP</h4>'), `${file} missing Column 2 SHOP`);
    assert(content.includes('<h4>STUDIO</h4>'), `${file} missing Column 3 STUDIO`);
    assert(content.includes('<h4>SUPPORT</h4>'), `${file} missing Column 4 SUPPORT`);
    assert(content.includes('© 2026 PINBOARD STUDIO'), `${file} missing copyright`);
    assert(content.includes('MADE IN INDIA'), `${file} missing MADE IN INDIA`);
  });
});

// 2. Verify CSS Responsive Multi-Column Rules
console.log('\n--- 2. CSS Grid, Column Spacing & Responsive Rules ---');

test('css/style.css defines 4-column desktop grid for footer', () => {
  assert(styleCss.includes('.foot-grid'), 'Missing .foot-grid rule');
  assert(styleCss.includes('grid-template-columns: 1.5fr 1fr 1fr 1fr') || styleCss.includes('grid-template-columns: 1.4fr 1fr 1fr 1fr'), 'Footer must use multi-column grid');
  assert(styleCss.includes('max-width: 1360px'), 'Footer grid should have balanced max-width container');
});

test('css/style.css defines hover micro-interaction for footer links', () => {
  assert(styleCss.includes('.foot-col a:hover'), 'Missing .foot-col a:hover');
  assert(styleCss.includes('transform: translateX(3px)'), 'Missing hover link transition');
});

test('css/style.css defines 2-column tablet layout and 1-column mobile layout', () => {
  assert(styleCss.includes('grid-template-columns: 1fr 1fr'), 'Missing tablet 2-column rule');
  assert(styleCss.includes('grid-template-columns: 1fr'), 'Missing mobile 1-column rule');
});

console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
