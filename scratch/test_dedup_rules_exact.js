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
  str = str.replace(/_\d+$/i, '');   // Strip _1, _2 if suffix
  str = str.replace(/\s*\(\d+\)$/i, ''); // Strip (1)
  return str.trim();
}

function normalizeTitleKey(title) {
  if (!title || typeof title !== 'string') return '';
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

console.log('Original PINBOARD_PRODUCTS count:', products.length);

const seenIds = new Set();
const seenImages = new Set();
const seenTitles = new Set();
const cleanProducts = [];
const removedList = [];

products.forEach(p => {
  if (!p || typeof p.id === 'undefined') return;

  // 1. product.id / SKU
  if (seenIds.has(p.id)) {
    removedList.push({ type: 'ID', product: p });
    return;
  }

  // 2. normalized image URL/path
  const img = (p.images && p.images[0]) ? p.images[0] : '';
  const imgKey = normalizeImageKey(img);
  if (imgKey && seenImages.has(imgKey)) {
    removedList.push({ type: 'IMAGE', imgKey, product: p });
    return;
  }

  // 3. normalized full title
  const titleKey = normalizeTitleKey(p.title);
  if (titleKey && seenTitles.has(titleKey)) {
    removedList.push({ type: 'TITLE', titleKey, product: p });
    return;
  }

  seenIds.add(p.id);
  if (imgKey) seenImages.add(imgKey);
  if (titleKey) seenTitles.add(titleKey);
  cleanProducts.push(p);
});

console.log('\nRemoved items count:', removedList.length);
removedList.forEach(r => {
  console.log(`- [${r.type}] ID ${r.product.id}: "${r.product.title}" (img: ${r.product.images[0]})`);
});

console.log('\nCleaned unique PINBOARD_PRODUCTS count:', cleanProducts.length);
