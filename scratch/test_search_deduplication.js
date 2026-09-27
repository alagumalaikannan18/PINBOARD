const fs = require('fs');
const path = require('path');
const vm = require('vm');

const content = fs.readFileSync('js/products-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(content, sandbox);
const PinboardSearch = sandbox.PinboardSearch;
const products = sandbox.PINBOARD_PRODUCTS;

console.log(`Loaded ${products.length} products.`);

// Test queries
const testQueries = [
  'rebirth',
  'spider-man',
  'spiderman',
  'messi',
  'ronaldo',
  'cr7',
  'batman',
  'superman',
  'john wick',
  'motivation',
  'cars',
  'movies',
  'gaming'
];

testQueries.forEach(q => {
  const results = PinboardSearch.search(q);
  console.log(`\nQuery: "${q}" -> Returned ${results.length} results:`);
  results.slice(0, 5).forEach((p, idx) => {
    console.log(`  ${idx+1}. [ID ${p.id}] ${p.title} (img: ${p.images ? p.images[0] : 'none'})`);
  });
});
