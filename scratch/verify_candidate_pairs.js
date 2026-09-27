const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const productsDataContent = fs.readFileSync(path.join(process.cwd(), 'js', 'products-data.js'), 'utf8');
let window = {};
let mod = { exports: {} };
const fn = new Function('window', 'module', productsDataContent);
fn(window, mod);
const products = window.PINBOARD_PRODUCTS || mod.exports.PINBOARD_PRODUCTS || mod.exports || [];

const fileToProd = {};
products.forEach(p => {
  const img = (p.images && p.images[0]) ? p.images[0] : (p.image || '');
  const fname = path.basename(img);
  fileToProd[fname] = p;
});

const candidatePairs = [
  ["1513642.png", "1554029.png"],
  ["1514179.png", "A4 Posters [55573EA].png"],
  ["1554029.png", "1555762.png"],
  ["1554532.png", "1555986.png"],
  ["1555899.png", "A4 Posters [5FE0EB5].png"],
  ["1556996.png", "file_00000000d1a482118837991a9779439a.png"],
  ["1557084.png", "A4 Posters [697243A].png"]
];

console.log("=== CANDIDATE PAIR VERIFICATION ===");
candidatePairs.forEach(([f1, f2]) => {
  const p1 = fileToProd[f1] || {};
  const p2 = fileToProd[f2] || {};
  console.log(`\nPair: ${f1} <==> ${f2}`);
  console.log(`  Prod 1 (ID ${p1.id}): "${p1.title}" (Cat: ${p1.category})`);
  console.log(`  Prod 2 (ID ${p2.id}): "${p2.title}" (Cat: ${p2.category})`);
});
