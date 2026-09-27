const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
const products = JSON.parse(match[1]);

console.log('--- ALL PRODUCTS IN PINBOARD_PRODUCTS ---');
products.forEach(p => {
  console.log(`ID ${p.id.toString().padStart(3, ' ')} | "${p.title}" | img: ${p.images ? p.images[0] : 'NONE'}`);
});
