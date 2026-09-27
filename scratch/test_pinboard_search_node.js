const productsData = require('../js/products-data.js');
const PinboardSearch = global.PinboardSearch || (productsData ? productsData.PinboardSearch : null);

console.log('PinboardSearch initialized:', Boolean(PinboardSearch));

const testQueries = [
  'messi',
  'lionel messi',
  'ronaldo',
  'cristiano',
  'spiderman',
  'spider man',
  'cars',
  'bmw',
  'ferrari',
  'porsche',
  'gaming',
  'movies',
  'sports',
  'motivation',
  'rocky',
  'goggins',
  '1',
  'xyz123nonexistent'
];

testQueries.forEach(q => {
  const res = PinboardSearch.search(q);
  console.log(`Query '${q}': ${res.length} results returned`);
});
