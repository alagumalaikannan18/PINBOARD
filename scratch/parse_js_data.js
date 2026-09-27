const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/products-data.js', 'utf8');
const meta = JSON.parse(fs.readFileSync('scratch/drive_processed_meta.json', 'utf8'));

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const products = sandbox.PINBOARD_PRODUCTS || sandbox.window.PINBOARD_PRODUCTS;
console.log(`Successfully loaded ${products.length} canonical PINBOARD products.`);

const matchedItems = [];
const unMatchedItems = [];

meta.forEach(item => {
  const existing = products.find(p => p.images && p.images.some(img => img.includes(item.basename)));
  if (existing) {
    console.log(`[EXISTING MATCH] ${item.webp} matches ID #${existing.id}: "${existing.title}" [Category: ${existing.category}]`);
    matchedItems.push({ item, existing });
  } else {
    console.log(`[NEW DRIVE ITEM] ${item.webp}`);
    unMatchedItems.push(item);
  }
});

console.log(`\nSummary: ${matchedItems.length} matched existing catalog, ${unMatchedItems.length} new items.`);
