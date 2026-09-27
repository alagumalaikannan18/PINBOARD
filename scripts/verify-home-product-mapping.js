// =========================================================================
// PINBOARD — Home Page Product Mapping & Visual Curation Verification Suite
// Verifies 1-to-1 card accuracy, zero duplicates, and zero broken links
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================');
console.log('PINBOARD HOME PAGE PRODUCT MAPPING AUDIT SUITE');
console.log('======================================================\n');

// Load products dataset & getProductById
const products = require('../js/products-data.js');
const getProductById = global.getProductById;

assert(typeof getProductById === 'function', 'getProductById must be defined');

// Read index.html content
const indexPath = path.resolve(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// Parse cards from index.html
const homeCards = [];
const cardRegex = /<[^>]+data-product-id="(\d+)"[^>]*>/gi;

// Also parse section blocks from index.html
let match;
while ((match = cardRegex.exec(indexHtml)) !== null) {
  const pid = parseInt(match[1], 10);

  // Extract snippet surrounding card to identify section, title, and image
  const cardStart = match.index;
  const cardSnippet = indexHtml.substring(cardStart, cardStart + 600);

  let section = 'Unknown';
  if (cardStart < indexHtml.indexOf('<section class="section" id="collections">')) {
    section = cardSnippet.includes('pinned-link') ? 'Hero Pinned' : 'Hero';
  } else if (cardStart < indexHtml.indexOf('<section class="section grid-wrap" id="shop">')) {
    section = 'Collections Slider';
  } else if (cardStart < indexHtml.indexOf('<section class="interactive-3d-space" id="space3d">')) {
    section = 'Best Sellers';
  } else if (cardStart < indexHtml.indexOf('<footer>')) {
    section = '3D Interactive Stage';
  }

  // Extract img src
  const imgMatch = cardSnippet.match(/src="([^"]+)"/i);
  const cardImg = imgMatch ? imgMatch[1] : '';

  // Extract title/alt
  const altMatch = cardSnippet.match(/alt="([^"]+)"/i);
  const cardTitle = altMatch ? altMatch[1] : '';

  homeCards.push({
    section: section,
    productId: pid,
    cardImg: cardImg,
    cardTitle: cardTitle
  });
}

console.log(`1. PARSED HOME PAGE POSTER CARDS`);
console.log(`   - Total Home Poster Cards Found: ${homeCards.length}`);
assert(homeCards.length > 0, 'Must find poster cards on index.html');

let totalHomePosterCards = homeCards.length;
let uniqueHomeProductIds = new Set();
let duplicateHomeProductIds = 0;
let duplicateImageUsage = 0;
let brokenImagePaths = 0;
let missingProductIds = 0;
let wrongProductLinks = 0;

const homeAuditTable = [];
const seenImages = new Set();

console.log(`\n2. AUDITING CARD MAPPINGS & ACCURACY ACROSS SECTIONS`);
console.log('| Section | Product ID | Title | Category | Image | Duplicate? |');
console.log('|---|---|---|---|---|---|');

homeCards.forEach((card, idx) => {
  const pid = card.productId;
  let isDuplicate = false;

  if (uniqueHomeProductIds.has(pid)) {
    duplicateHomeProductIds++;
    isDuplicate = true;
  }
  uniqueHomeProductIds.add(pid);

  const product = getProductById(pid);

  if (!product) {
    missingProductIds++;
    wrongProductLinks++;
    console.error(`   ✖ ERROR: Product ID #${pid} not found in catalog!`);
    return;
  }

  // Check 1:1 image match
  const catImg = product.images[0];
  const cleanCardImg = card.cardImg.replace(/^.*[\\\/]/, '').split('?')[0];
  const cleanCatImg = catImg.replace(/^.*[\\\/]/, '').split('?')[0];

  if (cleanCardImg && cleanCatImg && cleanCardImg !== cleanCatImg) {
    wrongProductLinks++;
    console.error(`   ✖ MISMATCH: Card #${idx + 1} (ID #${pid}) displays image '${cleanCardImg}' but product record has '${cleanCatImg}'`);
  }

  if (seenImages.has(cleanCatImg)) {
    duplicateImageUsage++;
  }
  seenImages.add(cleanCatImg);

  // Check image file existence on disk
  const fullImgPath = path.resolve(__dirname, '..', catImg);
  if (!fs.existsSync(fullImgPath)) {
    brokenImagePaths++;
    console.error(`   ✖ BROKEN PATH: Image file missing at ${fullImgPath}`);
  }

  const shortTitle = product.title.length > 30 ? product.title.substring(0, 27) + '...' : product.title;
  const shortImg = cleanCatImg.length > 25 ? cleanCatImg.substring(0, 22) + '...' : cleanCatImg;

  console.log(`| ${card.section} | #${product.id} | ${shortTitle} | ${product.category} | ${shortImg} | ${isDuplicate ? 'YES (FAIL)' : 'NO (PASS)'} |`);
});

console.log('\n======================================================');
console.log('HOME PAGE AUDIT SUMMARY & ASSERTIONS');
console.log('======================================================');
console.log(`TOTAL HOME POSTER CARDS : ${totalHomePosterCards}`);
console.log(`UNIQUE HOME PRODUCT IDS : ${uniqueHomeProductIds.size}`);
console.log(`DUPLICATE PRODUCT IDS   : ${duplicateHomeProductIds}`);
console.log(`DUPLICATE IMAGE USAGE   : ${duplicateImageUsage}`);
console.log(`BROKEN IMAGE PATHS      : ${brokenImagePaths}`);
console.log(`MISSING PRODUCT IDS     : ${missingProductIds}`);
console.log(`WRONG PRODUCT LINKS     : ${wrongProductLinks}`);
console.log('======================================================');

assert.strictEqual(duplicateHomeProductIds, 0, 'DUPLICATE HOME PRODUCT IDS must be 0');
assert.strictEqual(duplicateImageUsage, 0, 'DUPLICATE IMAGE USAGE must be 0');
assert.strictEqual(brokenImagePaths, 0, 'BROKEN IMAGE PATHS must be 0');
assert.strictEqual(missingProductIds, 0, 'MISSING PRODUCT IDS must be 0');
assert.strictEqual(wrongProductLinks, 0, 'WRONG PRODUCT LINKS must be 0');

console.log('\n🎉 ALL HOME PAGE MAPPING ASSERTIONS PASSED SUCCESSFULLY!\n');
