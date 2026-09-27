const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
if (!match) {
  console.error('Could not parse PINBOARD_PRODUCTS');
  process.exit(1);
}

const products = JSON.parse(match[1]);
console.log('Total items in PINBOARD_PRODUCTS:', products.length);

function normalizeImg(src) {
  if (!src) return '';
  let base = String(src)
    .replace(/^.*[\\\/]/, '')
    .replace(/\.(png|jpe?g|webp|avif)$/i, '')
    .replace(/\.jpg\.jpeg$/i, '')
    .toLowerCase();
  
  // Strip thumbnail, copy, product suffix variations like _p12, _p13, _1, (1), -thumb
  base = base
    .replace(/-thumb$/i, '')
    .replace(/_p\d+$/i, '')
    .replace(/_\d+$/i, '')
    .replace(/\s*\(\d+\)$/i, '')
    .trim();
    
  return base;
}

const imgMap = new Map();
const duplicatesFound = [];

products.forEach(p => {
  const rawImg = (p.images && p.images[0]) ? p.images[0] : '';
  const base = normalizeImg(rawImg);
  if (!imgMap.has(base)) {
    imgMap.set(base, [p]);
  } else {
    imgMap.get(base).push(p);
  }
});

console.log('\n--- DUPLICATE POSTER ARTWORKS DETECTED ---');
imgMap.forEach((list, base) => {
  if (list.length > 1) {
    console.log(`Image key "${base}":`);
    list.forEach(p => {
      console.log(`  - ID ${p.id}: "${p.title}" (img: ${p.images[0]})`);
    });
  }
});
