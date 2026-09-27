const fs = require('fs');
const path = require('path');

console.log("======================================================");
console.log("PINBOARD EXACT USER SCREENSHOT COLLECTIONS UI SUITE");
console.log("======================================================\n");

let passed = 0;
let total = 0;

function assert(condition, description) {
  total++;
  if (condition) {
    console.log(`  ✔ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

const styleCss = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');

// 1. Studio Wall Background per Card
assert(styleCss.includes('background: var(--wall, #ECE8E1);') || styleCss.includes('background: #ECE8E1;'), 'collection-card uses warm studio wall background (#ECE8E1)');

// 2. 2px Dark Divider Line Between Cards
assert(styleCss.includes('background: var(--ink);') && styleCss.includes('gap: 2px;'), 'collections defines gap: 2px with --ink background for exact vertical divider lines');

// 3. Framed Poster Artwork (compact width with 4px white border)
assert((styleCss.includes('width: 64%;') || styleCss.includes('width: 78%;')) && styleCss.includes('border: 4px solid #FFFFFF;'), 'collection-card img uses compact width with crisp 4px white frame border');

// 4. Studio Shadow & Color Reveal Hover Transition
assert(styleCss.includes('box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22)') && (styleCss.includes('filter: grayscale(0%)') || styleCss.includes('transform: scale(1.04);')), 'collection-card img uses studio drop shadow and color reveal hover transition');

// 5. Watermark Text
assert(styleCss.includes('VYON POSTERZ') && styleCss.includes('.collection-label .name::after'), 'collection-label renders VYON POSTERZ watermark attached to collection name for baseline alignment');

// 6. Mobile Protection
assert(styleCss.includes('@media (max-width: 767px)'), 'Mobile media query block remains present and protected');

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log("======================================================\n");

if (passed !== total) {
  process.exitCode = 1;
}
