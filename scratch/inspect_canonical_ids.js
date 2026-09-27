const products = require('../js/products-data.js');

function findProd(term) {
  const matches = products.filter(p => p.title.toLowerCase().includes(term.toLowerCase()) || p.description.toLowerCase().includes(term.toLowerCase()));
  console.log(`=== Matches for '${term}' ===`);
  matches.forEach(p => console.log(`  ID: ${p.id} | Title: ${p.title} | Cat: ${p.category} | Img: ${p.images[0]}`));
}

findProd('messi');
findProd('baba yaga');
findProd('e30');
findProd('after hours');
findProd('spider-man');
findProd('porsche');
findProd('gta');
findProd('rocky');
