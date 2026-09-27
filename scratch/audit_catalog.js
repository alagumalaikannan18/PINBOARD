const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Audit all_new_poster_no_repeated_poster directory files
const posterDir = path.join(process.cwd(), 'all_new_poster_no_repeated_poster');
const dirFiles = fs.readdirSync(posterDir).filter(f => fs.statSync(path.join(posterDir, f)).isFile());

console.log(`=== 1. PHYSICAL FILES AUDIT ===`);
console.log(`Total files in all_new_poster_no_repeated_poster: ${dirFiles.length}`);

const fileHashMap = {}; // sha256 -> filename
const fileByHash = {}; // sha256 -> [filenames]
dirFiles.forEach(f => {
  const buf = fs.readFileSync(path.join(posterDir, f));
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  if (!fileByHash[sha]) fileByHash[sha] = [];
  fileByHash[sha].push(f);
  fileHashMap[f] = sha;
});

const uniquePhysicalHashes = Object.keys(fileByHash).length;
console.log(`Unique SHA256 hashes among physical files: ${uniquePhysicalHashes}`);
if (uniquePhysicalHashes < dirFiles.length) {
  console.log(`DUPLICATE PHYSICAL FILES FOUND:`);
  for (const [sha, files] of Object.entries(fileByHash)) {
    if (files.length > 1) {
      console.log(`  - SHA256 ${sha.substring(0, 12)}... : ${files.join(', ')}`);
    }
  }
} else {
  console.log(`All ${dirFiles.length} physical poster files have unique SHA-256 hashes!`);
}

// 2. Audit products-data.js catalog
console.log(`\n=== 2. PRODUCTS-DATA.JS AUDIT ===`);
const productsDataContent = fs.readFileSync(path.join(process.cwd(), 'js', 'products-data.js'), 'utf8');

let window = {};
let mod = { exports: {} };
const fn = new Function('window', 'module', productsDataContent);
fn(window, mod);
const products = window.PINBOARD_PRODUCTS || mod.exports.PINBOARD_PRODUCTS || mod.exports || [];

console.log(`Total catalog records in products-data.js: ${products.length}`);

const prodImageMap = {}; // imageRelPath -> [products]
const prodHashMap = {};  // sha256 -> [products]
const missingImages = [];

products.forEach(p => {
  let imgPath = '';
  if (Array.isArray(p.images) && p.images.length > 0) {
    imgPath = p.images[0];
  } else if (typeof p.image === 'string') {
    imgPath = p.image;
  }
  
  const normPath = imgPath.split('?')[0].replace(/\\/g, '/').trim();
  p._normImage = normPath;

  if (!prodImageMap[normPath]) prodImageMap[normPath] = [];
  prodImageMap[normPath].push(p);

  const fullPath = path.isAbsolute(normPath) ? normPath : path.join(process.cwd(), normPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const buf = fs.readFileSync(fullPath);
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    p._sha256 = sha;
    if (!prodHashMap[sha]) prodHashMap[sha] = [];
    prodHashMap[sha].push(p);
  } else {
    missingImages.push({ id: p.id, title: p.title, path: normPath });
  }
});

console.log(`Unique image paths referenced in products-data.js: ${Object.keys(prodImageMap).length}`);
console.log(`Unique SHA256 image hashes referenced in products-data.js: ${Object.keys(prodHashMap).length}`);
console.log(`Missing image files referenced: ${missingImages.length}`);
if (missingImages.length > 0) {
  missingImages.forEach(m => console.log(`  - Missing: Product ID ${m.id} -> ${m.path}`));
}

let duplicatePathGroups = 0;
for (const [relPath, prods] of Object.entries(prodImageMap)) {
  if (prods.length > 1) {
    duplicatePathGroups++;
    console.log(`\nDUPLICATE PATH GROUP ${duplicatePathGroups} ("${relPath}"):`);
    prods.forEach(p => console.log(`  - Product ID ${p.id}: "${p.title}" (Category: ${p.category})`));
  }
}

let duplicateHashGroups = 0;
for (const [sha, prods] of Object.entries(prodHashMap)) {
  if (prods.length > 1) {
    duplicateHashGroups++;
    console.log(`\nDUPLICATE HASH GROUP ${duplicateHashGroups} (SHA256: ${sha.substring(0, 12)}...):`);
    prods.forEach(p => console.log(`  - Product ID ${p.id}: "${p.title}" | Path: ${p._normImage} (Category: ${p.category})`));
  }
}

// 3. Audit poster-catalog.js
console.log(`\n=== 3. POSTER-CATALOG.JS AUDIT ===`);
const posterCatPath = path.join(process.cwd(), 'js', 'poster-catalog.js');
if (fs.existsSync(posterCatPath)) {
  const posterCatContent = fs.readFileSync(posterCatPath, 'utf8');
  let window2 = {};
  let mod2 = { exports: {} };
  const fn2 = new Function('window', 'module', 'define', posterCatContent);
  fn2(window2, mod2, undefined);
  const posterCat = window2.PINBOARD_POSTER_CATALOG || window2.PinboardPosterCatalog || mod2.exports || [];
  console.log(`Total items in poster-catalog.js: ${posterCat.length}`);

  const catHashMap = {};
  posterCat.forEach(item => {
    const normPath = (item.image || '').split('?')[0].replace(/\\/g, '/').trim();
    const fullPath = path.isAbsolute(normPath) ? normPath : path.join(process.cwd(), normPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const sha = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
      if (!catHashMap[sha]) catHashMap[sha] = [];
      catHashMap[sha].push(item);
    }
  });
  console.log(`Unique SHA256 hashes in poster-catalog.js: ${Object.keys(catHashMap).length}`);
  let dupCatGroups = 0;
  for (const [sha, items] of Object.entries(catHashMap)) {
    if (items.length > 1) {
      dupCatGroups++;
      console.log(`\nPOSTER-CATALOG DUPLICATE GROUP ${dupCatGroups} (SHA256: ${sha.substring(0, 12)}...):`);
      items.forEach(it => console.log(`  - posterId: ${it.id} | productId: ${it.productId} | title: "${it.title}" | image: ${it.image}`));
    }
  }
}

