const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
const products = JSON.parse(match[1]);

console.log('--- SEARCH RESULTS IN PINBOARD_PRODUCTS ---');

products.forEach(p => {
  const str = (p.title + ' ' + p.subtitle + ' ' + (p.images ? p.images.join(' ') : '') + ' ' + (p.keywords || '')).toLowerCase();
  if (str.includes('peter') || str.includes('spider') || str.includes('just do it') || str.includes('1514179') || str.includes('1554016') || str.includes('1514312')) {
    console.log(`ID ${p.id.toString().padStart(3, ' ')} | "${p.title}" | img: ${p.images[0]}`);
  }
});
