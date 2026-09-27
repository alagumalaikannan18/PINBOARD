const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
const products = JSON.parse(match[1]);

function normalizeImageKey(imgSrc) {
  if (!imgSrc || typeof imgSrc !== 'string') return '';
  let str = imgSrc.split('?')[0].split('#')[0]; // Remove query/hash
  str = str.replace(/^.*[\\\/]/, '').toLowerCase().trim(); // Basename
  str = str.replace(/\.(webp|png|jpe?g|gif|svg|avif)$/i, ''); // Strip ext
  str = str.replace(/\.jpg\.jpeg$/i, '');
  str = str.replace(/-thumb$/i, '');
  str = str.replace(/_p\d+$/i, ''); // Strip _p12, _p13, _p20
  str = str.replace(/_\d+$/i, '');   // Strip _1, _2
  str = str.replace(/\s*\(\d+\)$/i, ''); // Strip (1)
  return str.trim();
}

function normalizeTitleKey(title) {
  if (!title || typeof title !== 'string') return '';
  // Take part before pipe '|' or colon ':' for poster title identity
  let mainTitle = title.split('|')[0].split(':')[0];
  return mainTitle.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

console.log('Original PINBOARD_PRODUCTS count:', products.length);

const seenIds = new Set();
const seenImages = new Set();
const seenTitles = new Set();
const cleanProducts = [];

products.forEach(p => {
  if (!p || typeof p.id === 'undefined') return;

  // Priority 1: product.id / SKU
  if (seenIds.has(p.id)) {
    console.log(`[DEDUP BY ID] Dropping duplicate ID ${p.id}: "${p.title}"`);
    return;
  }

  // Priority 2: normalized image URL/path
  const img = (p.images && p.images[0]) ? p.images[0] : '';
  const imgKey = normalizeImageKey(img);
  if (imgKey && seenImages.has(imgKey)) {
    console.log(`[DEDUP BY IMAGE] Dropping duplicate artwork ID ${p.id}: "${p.title}" (imgKey: ${imgKey})`);
    return;
  }

  // Priority 3: normalized poster title
  const titleKey = normalizeTitleKey(p.title);
  if (titleKey && seenTitles.has(titleKey)) {
    console.log(`[DEDUP BY TITLE] Dropping duplicate title ID ${p.id}: "${p.title}" (titleKey: ${titleKey})`);
    return;
  }

  seenIds.add(p.id);
  if (imgKey) seenImages.add(imgKey);
  if (titleKey) seenTitles.add(titleKey);
  cleanProducts.push(p);
});

console.log('Cleaned unique PINBOARD_PRODUCTS count:', cleanProducts.length);
