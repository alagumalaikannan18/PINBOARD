// ==========================================================================
// TEST SUITE: Global Poster Duplicate Cleanup & Prevention Engine
// ==========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n======================================================');
console.log('PINBOARD GLOBAL DUPLICATE CLEANUP & PREVENTION SUITE');
console.log('======================================================\n');

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

const productsJs = fs.readFileSync(path.join(__dirname, 'js', 'products-data.js'), 'utf8');
eval(productsJs);

// 1. PINBOARD_PRODUCTS Master Dataset Health
test('PINBOARD_PRODUCTS contains 158 canonical saleable products with 0 duplicate IDs', () => {
  assert.strictEqual(PINBOARD_PRODUCTS.length, 158, 'Master dataset must contain exactly 158 products');
  
  const idSet = new Set();
  PINBOARD_PRODUCTS.forEach(p => {
    assert(!idSet.has(p.id), `Duplicate Product ID found: ${p.id}`);
    idSet.add(p.id);
  });
});

// 2. Collection Profile Separation
test('PINBOARD_COLLECTION_PROFILES is separated from saleable PINBOARD_PRODUCTS dataset', () => {
  assert(Array.isArray(PINBOARD_COLLECTION_PROFILES), 'PINBOARD_COLLECTION_PROFILES must be an array');
  assert.strictEqual(PINBOARD_COLLECTION_PROFILES.length, 6, 'Must contain 6 collection profiles');

  const profileImgsInProducts = PINBOARD_PRODUCTS.filter(p => p.images.some(img => img.includes('cat_')));
  assert.strictEqual(profileImgsInProducts.length, 0, 'PINBOARD_PRODUCTS must contain 0 collection profile images');
});

// 3. PinboardSearch.isDuplicatePoster logic check
test('PinboardSearch.isDuplicatePoster correctly identifies duplicate ID, image, and normalized title', () => {
  assert(typeof PinboardSearch.isDuplicatePoster === 'function', 'isDuplicatePoster must be defined');

  const sampleList = [
    { id: 1, title: 'Spider-Man Rebirth', images: ['poster/opt/1514312.webp'] }
  ];

  // Test 1: Duplicate ID
  const dupId = { id: 1, title: 'Other Title', images: ['poster/opt/999.webp'] };
  assert(PinboardSearch.isDuplicatePoster(dupId, sampleList), 'isDuplicatePoster must reject duplicate ID');

  // Test 2: Duplicate Image
  const dupImg = { id: 9999, title: 'Other Title', images: ['poster/opt/1514312.webp'] };
  assert(PinboardSearch.isDuplicatePoster(dupImg, sampleList), 'isDuplicatePoster must reject duplicate image');

  // Test 3: Duplicate Normalized Title
  const dupTitle = { id: 9998, title: 'SPIDER MAN REBIRTH', images: ['poster/opt/888.webp'] };
  assert(PinboardSearch.isDuplicatePoster(dupTitle, sampleList), 'isDuplicatePoster must reject duplicate normalized title');

  // Test 4: Unique Poster
  const uniquePoster = { id: 2, title: 'Doctor Doom', images: ['poster/opt/1553164.webp'] };
  assert(!PinboardSearch.isDuplicatePoster(uniquePoster, sampleList), 'isDuplicatePoster must accept unique poster');
});

// 4. PinboardSearch.getUniqueProducts logic check
test('PinboardSearch.getUniqueProducts removes duplicates and filters out profile images', () => {
  const dirtyList = [
    { id: 1, title: 'Batman', images: ['poster/opt/1513642.webp'] },
    { id: 1, title: 'Batman Duplicate ID', images: ['poster/opt/999.webp'] },
    { id: 2, title: 'Batman Duplicate Image', images: ['poster/opt/1513642.webp'] },
    { id: 3, title: 'BATMAN', images: ['poster/opt/888.webp'] },
    { id: 99, title: 'Movies Profile', images: ['cat_movies.webp'], type: 'collection-profile' },
    { id: 4, title: 'Doctor Doom', images: ['poster/opt/1553164.webp'] }
  ];

  const cleaned = PinboardSearch.getUniqueProducts(dirtyList);
  assert.strictEqual(cleaned.length, 2, 'getUniqueProducts should reduce 6 items to 2 unique saleable products');
  assert.strictEqual(cleaned[0].id, 1, 'First item must be Batman ID 1');
  assert.strictEqual(cleaned[1].id, 4, 'Second item must be Doctor Doom ID 4');
});

console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
