const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
const products = JSON.parse(match[1]);

for (let i = 1; i <= 11; i++) {
  const p = products.find(x => x.id === i);
  if (p) {
    console.log(`ID ${p.id.toString().padStart(2, ' ')} | "${p.title}" | img: ${p.images[0]}`);
  }
}
