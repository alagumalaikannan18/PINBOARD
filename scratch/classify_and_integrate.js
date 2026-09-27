const fs = require('fs');

const meta = JSON.parse(fs.readFileSync('scratch/drive_processed_meta.json', 'utf8'));
const productsDataCode = fs.readFileSync('js/products-data.js', 'utf8');

// Parse PINBOARD_PRODUCTS array
const productsMatch = productsDataCode.match(/var PINBOARD_PRODUCTS = (\[[\s\S]*?\]);\s*var PINBOARD_COLLECTION_PROFILES/);
if (!productsMatch) {
  console.error('Could not find PINBOARD_PRODUCTS array!');
  process.exit(1);
}

let existingProducts = [];
try {
  existingProducts = JSON.parse(productsMatch[1]);
  console.log(`Loaded ${existingProducts.length} existing products.`);
} catch (e) {
  console.error('Failed to parse PINBOARD_PRODUCTS:', e.message);
  process.exit(1);
}

// Find matches between imported webp files and existing products
meta.forEach(item => {
  const existing = existingProducts.find(p => p.images && p.images.some(img => img.includes(item.basename)));
  if (existing) {
    console.log(`[EXISTING MATCH] ${item.webp} matches ID #${existing.id} (${existing.title}) [Category: ${existing.category}]`);
  } else {
    console.log(`[NEW DRIVE ITEM] ${item.webp} has no existing record yet.`);
  }
});
