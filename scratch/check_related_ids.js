const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '../js/products-data.js'), 'utf8');
const match = code.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*\n\/\/ ----------/);
const products = JSON.parse(match[1]);

products.forEach(p => {
  if (p.relatedIds && (p.relatedIds.includes(12) || p.relatedIds.includes(13) || p.relatedIds.includes(20))) {
    console.log(`Product ID ${p.id} ("${p.title}") has relatedIds:`, p.relatedIds);
  }
});
