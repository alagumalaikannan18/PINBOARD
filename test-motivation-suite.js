const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('====================================================');
console.log('PINBOARD MOTIVATION CATEGORY FULL VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Check all HTML files for category overlay card
console.log('--- 1. Testing Category Overlays in All HTML Pages ---');
const pages = [
  'index.html',
  'shop.html',
  'movies.html',
  'cars.html',
  'motivation.html',
  'gaming.html',
  'sports.html',
  'custom-posters.html',
  'cart.html',
  'account.html'
];

pages.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('href="motivation.html"'), `${file} has href="motivation.html"`);
  assert(content.includes('data-category="motivation"'), `${file} has data-category="motivation"`);
  assert(content.includes('cat_motivation.webp'), `${file} references cat_motivation.webp`);
  assert(content.includes('cat_motivation.jpg'), `${file} has fallback cat_motivation.jpg`);
  assert(content.includes('Motivation'), `${file} has visible text Motivation`);
  console.log(`✅ PASS: ${file} overlay card updated to MOTIVATION`);
});

// 2. Check motivation.html architecture
console.log('\n--- 2. Testing motivation.html Dedicated Page Architecture ---');
const motHtml = fs.readFileSync('motivation.html', 'utf8');
assert(motHtml.includes('<body data-category="motivation" class="theme-motivation">'), 'Correct body data-category and class');
assert(motHtml.includes('<h1 class="category-main-title">MOTIVATION</h1>'), 'Main title is MOTIVATION');
assert(motHtml.includes('cat_motivation.webp'), 'Hero artwork uses cat_motivation.webp');
assert(motHtml.includes('id="categoryPosterGrid"'), 'Has categoryPosterGrid');
assert(motHtml.includes('id="categoryHeroStage"'), 'Has 3D hero stage');
assert(motHtml.includes('id="categoryFilterTrack"'), 'Has filter track');

const expectedPills = ['all', 'discipline', 'gym & fitness', 'hustle', 'mindfulness', 'leadership', 'legends', 'success'];
expectedPills.forEach(pill => {
  assert(motHtml.toLowerCase().includes(`data-sub="${pill}"`), `Filter pill data-sub="${pill}" present`);
});
console.log('✅ PASS: motivation.html page structure and 8 subcategory filter pills verified');

// 3. Check js/category.js
console.log('\n--- 3. Testing js/category.js Config & Matcher ---');
const catJs = fs.readFileSync('js/category.js', 'utf8');
assert(catJs.includes('motivation: {'), 'CATEGORY_CONFIG has motivation entry');
assert(catJs.includes("name: 'Motivation'"), 'Motivation config has correct name');
assert(catJs.includes("path.includes('motivation')"), 'detectCurrentCategory handles motivation path');
assert(catJs.includes("cLow === 'anime'"), 'detectCurrentCategory aliases anime to motivation');
console.log('✅ PASS: js/category.js correctly configured with motivation and backward compatibility');

// 4. Check products data
console.log('\n--- 4. Testing Motivation Products Catalog ---');
const { PINBOARD_PRODUCTS } = require('./js/products-data.js');
const motProducts = PINBOARD_PRODUCTS.filter(p => p.category === 'Motivation');
assert(motProducts.length >= 6, `Expected at least 6 Motivation products, got ${motProducts.length}`);
motProducts.forEach(p => {
  assert(p.id && p.title && p.images && p.images.length > 0, `Product ${p.id} has complete data`);
  assert(p.tags && p.tags.includes('motivation'), `Product ${p.id} has 'motivation' tag`);
  console.log(`  ✓ Product ${p.id}: "${p.title}" [₹${p.salePrice || p.regularPrice}] - Tags: ${p.tags.slice(0, 4).join(', ')}...`);
});
console.log(`✅ PASS: ${motProducts.length} authentic Motivation products verified`);

// 5. Check server routing via HTTP
console.log('\n--- 5. Testing Server Routing & Backward Compatibility ---');
async function testServer() {
  const resMot = await fetch('http://localhost:3000/motivation');
  assert.strictEqual(resMot.status, 200, 'GET /motivation returns 200');

  const resMotHtml = await fetch('http://localhost:3000/motivation.html');
  assert.strictEqual(resMotHtml.status, 200, 'GET /motivation.html returns 200');

  const resAnime = await fetch('http://localhost:3000/anime', { redirect: 'manual' });
  assert(resAnime.status === 301 || resAnime.status === 200, 'GET /anime handled with 301 redirect or 200');

  console.log('✅ PASS: HTTP endpoints /motivation, /motivation.html, and /anime verified');
  console.log('\n====================================================');
  console.log('🎉 ALL MOTIVATION VERIFICATION TESTS PASSED (100%)!');
  console.log('====================================================');
}

testServer().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
