const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
const products = JSON.parse(match[1]);

[5, 6, 7, 10, 47].forEach(id => {
  const p = products.find(x => x.id === id);
  console.log(`\n--- Product ID ${id} ---`);
  console.log(JSON.stringify(p, null, 2));
});
