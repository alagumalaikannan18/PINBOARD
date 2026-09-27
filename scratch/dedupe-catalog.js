const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../js/products-data.js');
let code = fs.readFileSync(filePath, 'utf8');

// Match PINBOARD_PRODUCTS array
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
if (!match) {
  console.error('Could not find PINBOARD_PRODUCTS');
  process.exit(1);
}

const products = JSON.parse(match[1]);
console.log('Original PINBOARD_PRODUCTS count:', products.length);

const seenIds = new Set();
const seenImages = new Set();
const cleanProducts = [];

products.forEach(p => {
  if (!p || !p.id) return;
  if (seenIds.has(p.id)) return;

  const rawImg = (p.images && p.images[0]) ? p.images[0] : 'poster/opt/1551192.webp';
  const baseImg = rawImg.replace(/^.*[\\\/]/, '').replace(/\.(png|jpe?g|webp|avif)$/i, '').replace(/\.jpg\.jpeg$/i, '').toLowerCase();

  if (seenImages.has(baseImg)) {
    console.log(`Removing duplicate product ID ${p.id} ("${p.title}") sharing artwork ${baseImg}`);
    return;
  }

  seenIds.add(p.id);
  seenImages.add(baseImg);

  // Normalize image path to clean poster/opt WebP
  p.images = [`poster/opt/${baseImg}.webp`];
  cleanProducts.push(p);
});

console.log('Cleaned unique PINBOARD_PRODUCTS count:', cleanProducts.length);

const formattedJson = JSON.stringify(cleanProducts, null, 2);
const updatedCode = code.replace(/var PINBOARD_PRODUCTS = \[[\s\S]*?\];\s*\n\/\/ ----------/, `var PINBOARD_PRODUCTS = ${formattedJson};\n\n// ----------`);

fs.writeFileSync(filePath, updatedCode, 'utf8');
console.log('Updated js/products-data.js with clean deduplicated catalog!');
