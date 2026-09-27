const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('js/products-data.js', 'utf8');

const targetStr = 'globalScope.PINBOARD_PRODUCTS = [';
const assignIdx = content.indexOf(targetStr, 100); // start search after header
const startArr = assignIdx + 'globalScope.PINBOARD_PRODUCTS = '.length;
const endArr = content.indexOf('];\n\nif (typeof module', startArr);

const jsonText = content.substring(startArr, endArr + 1);
console.log('JSON text length:', jsonText.length);

const products = JSON.parse(jsonText);
console.log(`Successfully parsed ${products.length} products with JSON.parse!`);

fs.writeFileSync('scratch/products_clean.json', JSON.stringify(products, null, 2), 'utf8');
console.log('Saved clean products array to scratch/products_clean.json');
