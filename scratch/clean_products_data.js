const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'products-data.js');
let code = fs.readFileSync(filePath, 'utf8');

// Match PINBOARD_PRODUCTS array
const startMarker = 'var PINBOARD_PRODUCTS = [';
const endMarker = '];\n\nfunction getSaleableProducts';

const startIndex = code.indexOf('var PINBOARD_PRODUCTS = [');
const fnIndex = code.indexOf('function getSaleableProducts');

if (startIndex === -1 || fnIndex === -1) {
  console.error('Could not locate markers');
  process.exit(1);
}

// Find the last '];' before fnIndex
const endIndex = code.lastIndexOf('];', fnIndex);

const rawArrayCode = code.substring(startIndex + 'var PINBOARD_PRODUCTS = '.length, endIndex + 1);

let products;
try {
  products = eval('(' + rawArrayCode + ')');
} catch (err) {
  console.error('Eval error:', err);
  process.exit(1);
}

console.log('Original items count:', products.length);

const seenIds = new Set();
const cleanProducts = [];

for (const p of products) {
  if (!seenIds.has(p.id)) {
    seenIds.add(p.id);
    cleanProducts.push(p);
  }
}

console.log('Clean unique products count:', cleanProducts.length);
console.log('Min ID:', Math.min(...cleanProducts.map(p => p.id)), 'Max ID:', Math.max(...cleanProducts.map(p => p.id)));

const formattedArray = JSON.stringify(cleanProducts, null, 2);

const newCode = code.substring(0, startIndex) + 'var PINBOARD_PRODUCTS = ' + formattedArray + ';\n\nfunction getSaleableProducts' + code.substring(endIndex + endMarker.length);

fs.writeFileSync(filePath, newCode, 'utf8');
console.log('Successfully updated js/products-data.js with clean PINBOARD_PRODUCTS array!');
