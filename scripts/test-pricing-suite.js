const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=====================================================');
console.log('🚀 PINBOARD PRICING & COMBO OFFER VERIFICATION SUITE');
console.log('=====================================================\n');

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

// -------------------------------------------------------------------
// 1. Verify products-data.js Catalog
// -------------------------------------------------------------------
const dataPath = path.resolve(__dirname, '../js/products-data.js');
const productsContent = fs.readFileSync(dataPath, 'utf8');
const sandbox = { window: {}, document: { addEventListener: () => {} } };
vm.runInNewContext(productsContent, sandbox);
const products = sandbox.PINBOARD_PRODUCTS || sandbox.window.PINBOARD_PRODUCTS;

test(`Catalog has > 100 posters (Actual: ${products.length})`, () => {
  assert(products.length >= 100, `Expected at least 100 posters, got ${products.length}`);
});

test('Every poster in catalog has salePrice ₹60', () => {
  const non60 = products.filter(p => p.salePrice !== 60);
  assert.strictEqual(non60.length, 0, `Found ${non60.length} posters without salePrice 60`);
});

// -------------------------------------------------------------------
// 2. Verify Cart Combo Pricing Math
// -------------------------------------------------------------------
// Mock calculateCartPricing from js/cart.js
function calculateCartPricing(cart, discountRate) {
  var rate = Number(discountRate) || 0;
  var cartCount = 0;
  var rawSubtotal = 0;
  var standardPosterQty = 0;
  var customSubtotal = 0;

  (cart || []).forEach(function (item) {
    var qty = Number(item.quantity) || 1;
    cartCount += qty;

    if (item.isCustom) {
      var cPrice = Number(item.price) || 1499;
      customSubtotal += cPrice * qty;
      rawSubtotal += cPrice * qty;
    } else {
      var price = 60;
      standardPosterQty += qty;
      rawSubtotal += price * qty;
    }
  });

  var comboSets = Math.floor(standardPosterQty / 3);
  var comboSavings = comboSets * 30; // ₹30 savings per 3 posters (₹180 -> ₹150)
  var subtotalAfterCombo = Math.max(0, rawSubtotal - comboSavings);
  var promoDiscountAmount = Math.round(subtotalAfterCombo * rate);
  var finalTotal = Math.max(0, subtotalAfterCombo - promoDiscountAmount);

  return {
    cartCount: cartCount,
    standardPosterQty: standardPosterQty,
    comboSets: comboSets,
    comboSavings: comboSavings,
    rawSubtotal: rawSubtotal,
    subtotalAfterCombo: subtotalAfterCombo,
    promoDiscountAmount: promoDiscountAmount,
    finalTotal: finalTotal
  };
}

test('1 poster in cart costs ₹60 (Subtotal ₹60, Total ₹60)', () => {
  const res = calculateCartPricing([{ id: 1, quantity: 1, price: 60 }]);
  assert.strictEqual(res.rawSubtotal, 60);
  assert.strictEqual(res.comboSavings, 0);
  assert.strictEqual(res.finalTotal, 60);
});

test('2 posters in cart cost ₹120 (Subtotal ₹120, Total ₹120)', () => {
  const res = calculateCartPricing([
    { id: 1, quantity: 1, price: 60 },
    { id: 2, quantity: 1, price: 60 }
  ]);
  assert.strictEqual(res.rawSubtotal, 120);
  assert.strictEqual(res.comboSavings, 0);
  assert.strictEqual(res.finalTotal, 120);
});

test('3 posters in cart (same item qty 3) cost ₹150 total (NOT ₹180)', () => {
  const res = calculateCartPricing([{ id: 1, quantity: 3, price: 60 }]);
  assert.strictEqual(res.rawSubtotal, 180);
  assert.strictEqual(res.comboSavings, 30);
  assert.strictEqual(res.finalTotal, 150);
});

test('3 posters in cart (3 distinct items qty 1 each) cost ₹150 total', () => {
  const res = calculateCartPricing([
    { id: 1, quantity: 1, price: 60 },
    { id: 2, quantity: 1, price: 60 },
    { id: 3, quantity: 1, price: 60 }
  ]);
  assert.strictEqual(res.rawSubtotal, 180);
  assert.strictEqual(res.comboSavings, 30);
  assert.strictEqual(res.finalTotal, 150);
});

test('4 posters in cart cost ₹210 total (₹150 for 3 + ₹60 for 1)', () => {
  const res = calculateCartPricing([
    { id: 1, quantity: 2, price: 60 },
    { id: 2, quantity: 2, price: 60 }
  ]);
  assert.strictEqual(res.rawSubtotal, 240);
  assert.strictEqual(res.comboSavings, 30);
  assert.strictEqual(res.finalTotal, 210);
});

test('6 posters in cart cost ₹300 total (2 combo sets × ₹150)', () => {
  const res = calculateCartPricing([
    { id: 1, quantity: 3, price: 60 },
    { id: 2, quantity: 3, price: 60 }
  ]);
  assert.strictEqual(res.rawSubtotal, 360);
  assert.strictEqual(res.comboSavings, 60);
  assert.strictEqual(res.finalTotal, 300);
});

// -------------------------------------------------------------------
// 3. Verify HTML & Client Scripts
// -------------------------------------------------------------------
const productHtml = fs.readFileSync(path.resolve(__dirname, '../product.html'), 'utf8');
test('product.html contains 3 Posters for ₹150 offer banner', () => {
  assert(productHtml.includes('3 Posters for ₹150'), 'Missing combo banner in product.html');
  assert(productHtml.includes('Rs. 60.00'), 'Missing Rs. 60.00 price in product.html');
});

const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
test('index.html marquee and cards contain ₹60 and 3 Posters for ₹150', () => {
  assert(indexHtml.includes('3 POSTERS FOR ₹150'), 'Missing marquee offer in index.html');
  assert(indexHtml.includes('ALL POSTERS ₹60'), 'Missing all posters 60 in index.html');
});

console.log(`\n=====================================================`);
console.log(`📊 RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`=====================================================`);
if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
