const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("======================================================");
console.log("PINBOARD COLLECTION POSTER <-> TITLE MAPPING SUITE");
console.log("======================================================\n");

let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`  ✔ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}\n     ${err.message}`);
  }
}

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');

// 1. Verify Card 01: AFTER HOURS
test('Card 01: Product 43 (After Hours) has title AFTER HOURS', () => {
  assert(indexHtml.includes('data-product-id="43"'), 'Card 01 data-product-id is 43');
  assert(indexHtml.includes('alt="AFTER HOURS"'), 'Card 01 image alt is AFTER HOURS');
  assert(indexHtml.includes('<span class="name">AFTER HOURS</span>'), 'Card 01 title is AFTER HOURS');
});

// 2. Verify Card 02: PETER PARKER
test('Card 02: Product 7 (Peter Parker) has title PETER PARKER', () => {
  assert(indexHtml.includes('data-product-id="7"'), 'Card 02 data-product-id is 7');
  assert(indexHtml.includes('alt="PETER PARKER"'), 'Card 02 image alt is PETER PARKER');
  assert(indexHtml.includes('<span class="name">PETER PARKER</span>'), 'Card 02 title is PETER PARKER');
});

// 3. Verify Card 03: LEO IN PINK
test('Card 03: Product 151 (Leo in Pink) has title LEO IN PINK', () => {
  assert(indexHtml.includes('data-product-id="151"'), 'Card 03 data-product-id is 151');
  assert(indexHtml.includes('alt="LEO IN PINK"'), 'Card 03 image alt is LEO IN PINK');
  assert(indexHtml.includes('<span class="name">LEO IN PINK</span>'), 'Card 03 title is LEO IN PINK');
});

// 4. Verify Card 04: RED DEVIL
test('Card 04: Product 135 (Red Devil) has title RED DEVIL', () => {
  assert(indexHtml.includes('data-product-id="135"'), 'Card 04 data-product-id is 135');
  assert(indexHtml.includes('alt="RED DEVIL"'), 'Card 04 image alt is RED DEVIL');
  assert(indexHtml.includes('<span class="name">RED DEVIL</span>'), 'Card 04 title is RED DEVIL');
});

// 5. Verify Card 05: SYMBOL OF HOPE
test('Card 05: Product 91 (Symbol of Hope) has title SYMBOL OF HOPE', () => {
  assert(indexHtml.includes('data-product-id="91"'), 'Card 05 data-product-id is 91');
  assert(indexHtml.includes('alt="SYMBOL OF HOPE"'), 'Card 05 image alt is SYMBOL OF HOPE');
  assert(indexHtml.includes('<span class="name">SYMBOL OF HOPE</span>'), 'Card 05 title is SYMBOL OF HOPE');
});

// 6. Verify Card 06: BABA YAGA
test('Card 06: Product 84 (Baba Yaga) has title BABA YAGA', () => {
  assert(indexHtml.includes('data-product-id="84"'), 'Card 06 data-product-id is 84');
  assert(indexHtml.includes('alt="BABA YAGA"'), 'Card 06 image alt is BABA YAGA');
  assert(indexHtml.includes('<span class="name">BABA YAGA</span>'), 'Card 06 title is BABA YAGA');
});

// 7. Text Selection / Blue Highlight Protection
test('Carousel elements have user-select: none to prevent text/image selection highlight on interaction', () => {
  assert(styleCss.includes('.collections-viewport {') && styleCss.includes('user-select: none;'), '.collections-viewport has user-select: none');
  assert(styleCss.includes('.collection-card {') && styleCss.includes('user-select: none;'), '.collection-card has user-select: none');
  assert(styleCss.includes('.collection-card img {') && styleCss.includes('-webkit-user-drag: none;'), '.collection-card img has -webkit-user-drag: none');
});

// 8. Watermark Text & Baseline Alignment
test('Collection watermark text VYON POSTERZ remains consistently attached to collection title', () => {
  assert(styleCss.includes('.collection-label .name::after {') && styleCss.includes('content: "VYON POSTERZ";'), 'Watermark content is "VYON POSTERZ"');
});

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log("======================================================\n");

if (passed !== total) {
  process.exitCode = 1;
}
