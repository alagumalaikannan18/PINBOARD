const fs = require('fs');
const path = require('path');

const productsDataContent = fs.readFileSync('js/products-data.js', 'utf8');
let window = {};
let mod = { exports: {} };
const fn = new Function('window', 'module', productsDataContent);
fn(window, mod);
const products = window.PINBOARD_PRODUCTS || mod.exports.PINBOARD_PRODUCTS || [];

const targetIds = [33, 80, 113, 116, 151, 152, 153, 155];
targetIds.forEach(id => {
  const p = products.find(x => x.id === id);
  console.log(`\n=== PRODUCT ${id} ===`);
  console.log(JSON.stringify(p, null, 2));
});
