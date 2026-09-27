const fs = require('fs');
const path = require('path');

console.log("======================================================");
console.log("PINBOARD LAPTOP & TABLET RESPONSIVE SIZING SUITE");
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

// 1. Verify style.css
const styleCss = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');
assert(
  styleCss.includes('@media (min-width: 1024px)') && styleCss.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'),
  'style.css defines 4-column layout for Laptop (@media (min-width: 1024px))'
);
assert(
  styleCss.includes('@media (min-width: 768px) and (max-width: 1023px)') && styleCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'),
  'style.css defines 3-column layout for Tablet (@media (min-width: 768px) and (max-width: 1023px))'
);
assert(
  styleCss.includes('@media (max-width: 767px)') && styleCss.includes('padding: 4px 4px 6px;'),
  'style.css preserves exact mobile rules (@media (max-width: 767px))'
);

// 2. Verify shop.css
const shopCss = fs.readFileSync(path.join(__dirname, 'css/shop.css'), 'utf8');
assert(
  shopCss.includes('@media (min-width: 1024px)') && shopCss.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'),
  'shop.css defines 4-column layout for Laptop (@media (min-width: 1024px))'
);
assert(
  shopCss.includes('@media (min-width: 768px) and (max-width: 1023px)') && shopCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'),
  'shop.css defines 3-column layout for Tablet (@media (min-width: 768px) and (max-width: 1023px))'
);
assert(
  shopCss.includes('@media (max-width: 767px)') && shopCss.includes('padding: 4px 4px 6px;'),
  'shop.css preserves exact mobile rules (@media (max-width: 767px))'
);

// 3. Verify category.css
const catCss = fs.readFileSync(path.join(__dirname, 'css/category.css'), 'utf8');
assert(
  catCss.includes('@media (min-width: 1024px)') && catCss.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'),
  'category.css defines 4-column layout for Laptop (@media (min-width: 1024px))'
);
assert(
  catCss.includes('@media (min-width: 768px) and (max-width: 1023px)') && catCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'),
  'category.css defines 3-column layout for Tablet (@media (min-width: 768px) and (max-width: 1023px))'
);

// 4. Verify product.css
const pdpCss = fs.readFileSync(path.join(__dirname, 'css/product.css'), 'utf8');
assert(
  pdpCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));') && pdpCss.includes('.pdp-related-card {\n    padding: 10px 10px 12px;'),
  'product.css defines 3-column layout and generous card padding for Tablet related products'
);

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log("======================================================\n");

if (passed !== total) {
  process.exitCode = 1;
}
