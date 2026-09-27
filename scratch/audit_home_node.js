const products = require('../js/products-data.js');
const prodMap = {};
products.forEach(p => prodMap[p.id] = p);

console.log(`Total products loaded: ${products.length}`);

// Verify specific key products
const heroIds = [55, 123, 70, 109];
const colIds = [27, 48, 114, 51, 91, 104];
const bestsellerIds = [17, 20, 47, 29];
const space3dIds = [1, 34, 33, 39, 44];

const allHomeIds = [...heroIds, ...colIds, ...bestsellerIds, ...space3dIds];
console.log(`Total Home Product IDs: ${allHomeIds.length}`);
const uniqueHomeIds = new Set(allHomeIds);
console.log(`Unique Home Product IDs: ${uniqueHomeIds.size}`);

if (allHomeIds.length !== uniqueHomeIds.size) {
  console.error("ERROR: Duplicate IDs found in Home sections!");
} else {
  console.log("✔ PASS: Zero duplicate IDs across Home sections!");
}

allHomeIds.forEach(pid => {
  const p = prodMap[pid];
  if (!p) {
    console.error(`ERROR: Product #${pid} missing from catalog!`);
  } else {
    console.log(`  ID #${p.id}: ${p.title} | Cat: ${p.category} | Img: ${p.images[0]}`);
  }
});
