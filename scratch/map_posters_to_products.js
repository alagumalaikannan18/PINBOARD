const fs = require('fs');
const path = require('path');

const productsDataContent = fs.readFileSync('d:/PINBOARD-GIT/js/products-data.js', 'utf8');

let products = [];
const fn = new Function('window', productsDataContent + '; return window.PINBOARD_PRODUCTS || PINBOARD_PRODUCTS;');
products = fn({});

const posterDir = 'd:/PINBOARD-GIT/all_new_poster_no_repeated_poster';
const files = fs.readdirSync(posterDir);

// Map filenames to products
// 1. Check direct filename matches (e.g. 1513605.png -> product title/id/old_image)
// Let's see all product IDs and titles
const categoryCounts = {};
products.forEach(p => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
});

console.log("Existing Product Catalog Summary:");
console.log("Total products in products-data.js:", products.length);
console.log("Categories distribution in products-data.js:", categoryCounts);

// Let's match each file with a product in products-data.js
const mappedCatalog = [];
const unmappedFiles = [];

files.forEach((file, index) => {
  const baseName = path.parse(file).name;
  
  // Attempt 1: Exact baseName match with product ID as string
  let p = products.find(item => String(item.id) === baseName);
  
  // Attempt 2: Filename substring in title or description or id
  if (!p) {
    p = products.find(item => item.title && item.title.includes(baseName));
  }
  
  // Attempt 3: 1-to-1 sequential mapping by index (if product exists at index)
  if (!p && index < products.length) {
    p = products[index];
  }

  if (p) {
    mappedCatalog.push({
      catalogId: `poster-${String(index + 1).padStart(3, '0')}`,
      productId: p.id,
      title: p.title,
      category: p.category || 'Movies',
      filename: file,
      imagePath: `all_new_poster_no_repeated_poster/${file}`,
      price: p.price,
      rating: p.rating
    });
  } else {
    unmappedFiles.push(file);
  }
});

console.log(`Successfully mapped ${mappedCatalog.length} posters to products.`);
if (unmappedFiles.length > 0) {
  console.log(`Unmapped files (${unmappedFiles.length}):`, unmappedFiles);
}

// Check category distribution of final mapped catalog
const mappedCatCounts = {};
mappedCatalog.forEach(c => {
  mappedCatCounts[c.category] = (mappedCatCounts[c.category] || 0) + 1;
});
console.log("Mapped Catalog Category Counts:", mappedCatCounts);

fs.writeFileSync('d:/PINBOARD-GIT/scratch/mapped_catalog_sample.json', JSON.stringify(mappedCatalog.slice(0, 10), null, 2));
