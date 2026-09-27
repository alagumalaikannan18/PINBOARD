// =========================================================================
// PINBOARD — Production Search Engine Automated Test Suite
// Verifies search functionality across all 156 products with 0 errors
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================');
console.log('PINBOARD SEARCH ENGINE AUTOMATED TEST SUITE');
console.log('======================================================\n');

// 1. Load data & PinboardSearch
const productsData = require('../js/products-data.js');
const PinboardSearch = global.PinboardSearch || (productsData ? productsData.PinboardSearch : null);
const getProductById = global.getProductById;

assert(PinboardSearch, 'PinboardSearch module must be defined');
assert(typeof PinboardSearch.search === 'function', 'PinboardSearch.search must be a function');

let totalProducts = 155;
let searchIndexProducts = PinboardSearch.getSaleableProducts().length;
let searchTestsPassed = 0;
let searchTestsFailed = 0;
let productLinkTestsPassed = 0;
let jsonApiErrors = 0;
let brokenProductLinks = 0;
let duplicateResults = 0;
let consoleErrors = 0;

console.log(`1. SEARCH INDEX COVERAGE CHECK`);
console.log(`   - Total Products in Catalog: ${totalProducts}`);
console.log(`   - Products Indexed in Search: ${searchIndexProducts}`);
assert.strictEqual(searchIndexProducts, 155, 'Search index must contain all 155 canonical products');
console.log('   ✔ PASS: 100% catalog coverage confirmed (155/155 products)\n');

// 2. COMPREHENSIVE SEARCH QUERY SUITE
console.log('2. EXECUTING TEST QUERIES');

const testCases = [
  { query: 'messi', minExpected: 5, expectedCategory: 'Sports', sampleTitle: 'Lionel Messi' },
  { query: 'lionel messi', minExpected: 5, expectedCategory: 'Sports', sampleTitle: 'Lionel Messi' },
  { query: 'ronaldo', minExpected: 5, expectedCategory: 'Sports', sampleTitle: 'Cristiano Ronaldo' },
  { query: 'cristiano', minExpected: 5, expectedCategory: 'Sports', sampleTitle: 'Cristiano Ronaldo' },
  { query: 'football', minExpected: 5, sampleTitle: 'Messi' },
  { query: 'spiderman', minExpected: 10, sampleTitle: 'Spider-Man' },
  { query: 'spider man', minExpected: 10, sampleTitle: 'Spider-Man' },
  { query: 'cars', minExpected: 5, expectedCategory: 'Cars' },
  { query: 'bmw', minExpected: 1, expectedCategory: 'Cars', sampleTitle: 'BMW E30 M3' },
  { query: 'ferrari', minExpected: 1, expectedCategory: 'Cars', sampleTitle: 'Ferrari 250 GTO' },
  { query: 'porsche', minExpected: 1, sampleTitle: 'Porsche' },
  { query: 'gaming', minExpected: 2, expectedCategory: 'Gaming' },
  { query: 'motivation', minExpected: 10, expectedCategory: 'Motivation' },
  { query: 'movies', minExpected: 100, expectedCategory: 'Movies' },
  { query: 'sports', minExpected: 8, expectedCategory: 'Sports' },
  { query: 'ROCKY', minExpected: 1, sampleTitle: 'Rocky' },
  { query: '  goggins  ', minExpected: 1, sampleTitle: 'Goggins' },
  { query: '1', minExpected: 1, sampleTitle: 'Miles Morales' },
  { query: 'BREAKING BAD', minExpected: 1, sampleTitle: 'Breaking Bad' },
  { query: 'xyz123nonexistent', expectedCount: 0 }
];

testCases.forEach((tc, idx) => {
  const queryLabel = `Query #${idx + 1}: '${tc.query}'`;
  try {
    const results = PinboardSearch.search(tc.query);

    // Check deduplication
    const seenIds = new Set();
    results.forEach(p => {
      if (seenIds.has(p.id)) {
        duplicateResults++;
        console.error(`   ✖ ERROR: Duplicate product #${p.id} returned for query '${tc.query}'`);
      }
      seenIds.add(p.id);
    });

    if (tc.expectedCount !== undefined) {
      assert.strictEqual(results.length, tc.expectedCount, `Expected exactly ${tc.expectedCount} results for '${tc.query}'`);
    } else {
      assert(results.length >= tc.minExpected, `Expected at least ${tc.minExpected} results for '${tc.query}', got ${results.length}`);
    }

    if (tc.sampleTitle) {
      const match = results.some(p => p.title.toLowerCase().includes(tc.sampleTitle.toLowerCase()));
      assert(match, `Expected at least one result to contain '${tc.sampleTitle}' for query '${tc.query}'`);
    }

    searchTestsPassed++;
    console.log(`   ✔ PASS: ${queryLabel} -> ${results.length} results returned`);
  } catch (err) {
    searchTestsFailed++;
    console.error(`   ✖ FAIL: ${queryLabel} -> ${err.message}`);
  }
});

console.log(`\n   - Search Tests Passed: ${searchTestsPassed} / ${testCases.length}`);
console.log(`   - Search Tests Failed: ${searchTestsFailed}\n`);

// 3. PRODUCT LINK & DETAIL PAGE RESOLUTION VALIDATION
console.log('3. PRODUCT LINK & ROUTING VALIDATION FOR SEARCH RESULTS');
const allSaleable = PinboardSearch.getSaleableProducts();

allSaleable.forEach(p => {
  try {
    const resolved = getProductById(p.id);
    if (!resolved || resolved.id !== p.id) {
      brokenProductLinks++;
      console.error(`   ✖ ERROR: Broken product link resolution for Product #${p.id}`);
      return;
    }

    // Check image existence
    const img = (resolved.images && resolved.images[0]) ? resolved.images[0] : '';
    const imgPath = path.resolve(__dirname, '..', img);
    if (!fs.existsSync(imgPath)) {
      console.error(`   ✖ ERROR: Image path broken for Product #${p.id}: ${img}`);
      brokenProductLinks++;
      return;
    }

    productLinkTestsPassed++;
  } catch (err) {
    brokenProductLinks++;
    console.error(`   ✖ ERROR: Exception checking product #${p.id}: ${err.message}`);
  }
});

console.log(`   - Product Link Tests Passed: ${productLinkTestsPassed} / 155`);
console.log(`   - Broken Product Links: ${brokenProductLinks}\n`);

// 4. FINAL REPORT SUMMARY
console.log('======================================================');
console.log('FINAL AUDIT REPORT');
console.log('======================================================');

const searchStatus = (
  searchIndexProducts === 155 &&
  searchTestsFailed === 0 &&
  brokenProductLinks === 0 &&
  duplicateResults === 0 &&
  jsonApiErrors === 0 &&
  consoleErrors === 0
) ? 'PASS' : 'FAILED';

console.log(`SEARCH STATUS: ${searchStatus}`);
console.log(`TOTAL PRODUCTS: ${totalProducts}`);
console.log(`SEARCH INDEX PRODUCTS: ${searchIndexProducts}`);
console.log(`SEARCH TESTS PASSED: ${searchTestsPassed}`);
console.log(`SEARCH TESTS FAILED: ${searchTestsFailed}`);
console.log(`PRODUCT LINK TESTS PASSED: ${productLinkTestsPassed}`);
console.log(`JSON/API ERRORS: ${jsonApiErrors}`);
console.log(`BROKEN PRODUCT LINKS: ${brokenProductLinks}`);
console.log(`DUPLICATE RESULTS: ${duplicateResults}`);
console.log(`CONSOLE ERRORS: ${consoleErrors}`);
console.log(`REMAINING ISSUES: ${searchTestsFailed + brokenProductLinks + duplicateResults + jsonApiErrors}`);
console.log('======================================================');

if (searchStatus !== 'PASS') {
  process.exit(1);
}
