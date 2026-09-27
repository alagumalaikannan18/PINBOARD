const fs = require('fs');
const path = require('path');
const vm = require('vm');

const content = fs.readFileSync('js/products-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(content, sandbox);
const products = sandbox.PINBOARD_PRODUCTS;

function getCanonicalArtworkKey(p) {
  if (!p) return '';
  var id = p.id;
  
  var idArtworkMap = {
    12: 'art-rebirth-spiderman',
    18: 'art-rebirth-spiderman',
    54: 'art-rebirth-spiderman',
    11: 'art-messi-crest-kiss',
    139: 'art-messi-crest-kiss',
    13: 'art-doom-hellme',
    53: 'art-doom-hellme',
    14: 'art-argentina-worldcup-kiss',
    130: 'art-argentina-worldcup-kiss',
    16: 'art-cr7-portugal-crest',
    132: 'art-cr7-portugal-crest',
    20: 'art-doom-sovereign',
    87: 'art-doom-sovereign',
    68: 'art-master-jd-halo',
    98: 'art-master-jd-halo',
    90: 'art-brotherhood-cadillac',
    99: 'art-brotherhood-cadillac',
    127: 'art-arthur-morgan-slab',
    128: 'art-arthur-morgan-slab'
  };

  if (id && idArtworkMap[id]) {
    return idArtworkMap[id];
  }

  var img = (p.images && p.images[0]) ? String(p.images[0]) : '';
  if (!img) return 'art-prod-' + p.id;

  var base = img.split('?')[0].split('#')[0].replace(/^.*[\\\/]/, '').toLowerCase().trim();
  base = base
    .replace(/\.(png|jpe?g|webp|avif|gif|svg)$/i, '')
    .replace(/\.jpg\.jpeg$/i, '')
    .replace(/-thumb$/i, '')
    .replace(/_p\d+$/i, '')
    .replace(/_\d+$/i, '')
    .replace(/\s*\(\d+\)$/i, '')
    .trim();

  if (base.startsWith('cat_')) return 'cat-profile-' + base;
  return 'art-img-' + base;
}

function expandQueryAliases(queryStr) {
  var raw = (queryStr || '').toLowerCase().trim();
  var normalized = raw.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  var aliases = [raw];
  if (normalized && normalized !== raw) aliases.push(normalized);

  if (raw.indexOf('spiderman') !== -1 || raw.indexOf('spider man') !== -1 || raw.indexOf('spider-man') !== -1) {
    aliases.push('spider-man');
    aliases.push('spiderman');
    aliases.push('spider man');
  }
  if (raw === 'cr7' || raw === 'ronaldo' || raw === 'cristiano') {
    aliases.push('cristiano ronaldo');
    aliases.push('ronaldo');
    aliases.push('cr7');
  }
  if (raw === 'messi' || raw === 'leo messi') {
    aliases.push('lionel messi');
    aliases.push('messi');
    aliases.push('leo messi');
  }
  if (raw === 'goggins' || raw === 'stayhard' || raw === 'stay hard') {
    aliases.push('david goggins');
    aliases.push('stay hard');
    aliases.push('goggins');
  }
  if (raw === 'batman' || raw === 'dark knight') {
    aliases.push('the batman');
    aliases.push('dark knight');
    aliases.push('batman');
  }

  var uniqueAliases = [];
  for (var i = 0; i < aliases.length; i++) {
    if (uniqueAliases.indexOf(aliases[i]) === -1) {
      uniqueAliases.push(aliases[i]);
    }
  }
  return uniqueAliases;
}

function deduplicateProducts(productsList) {
  if (!Array.isArray(productsList)) return [];
  var seenIds = {};
  var seenArtworkKeys = {};
  var uniqueList = [];

  for (var i = 0; i < productsList.length; i++) {
    var p = productsList[i];
    if (!p || typeof p.id === 'undefined') continue;
    if (p.type === 'collection-profile' || p.saleable === false || p.isCollection === true) continue;

    var img = (p.images && p.images[0]) ? String(p.images[0]) : '';
    if (img.indexOf('cat_') === 0 || (p.category && p.category.toLowerCase().indexOf('cat_') === 0)) continue;

    if (seenIds[p.id]) continue;

    var artKey = getCanonicalArtworkKey(p);
    if (artKey && seenArtworkKeys[artKey]) continue;

    seenIds[p.id] = true;
    if (artKey) seenArtworkKeys[artKey] = true;

    uniqueList.push(p);
  }

  return uniqueList;
}

function search(query, options) {
  options = options || {};
  var category = options.category || null;
  var collection = options.collection || null;
  var maxPrice = options.maxPrice || Infinity;
  var minPrice = options.minPrice || 0;

  var candidates = products.filter(function(p) {
    if (!p || typeof p.id === 'undefined') return false;
    if (p.type === 'collection-profile' || p.saleable === false || p.isCollection === true) return false;
    
    var img = (p.images && p.images[0]) ? String(p.images[0]) : '';
    if (img.indexOf('cat_') === 0 || (p.category && p.category.toLowerCase().indexOf('cat_') === 0)) return false;

    if (category && (p.category || '').toLowerCase() !== category.toLowerCase()) return false;
    if (collection && (p.collection || '').toLowerCase().indexOf(collection.toLowerCase()) === -1) return false;
    
    var price = p.salePrice || p.regularPrice || 60;
    if (price < minPrice || price > maxPrice) return false;
    
    return true;
  });

  if (!query || query.trim() === '') {
    return deduplicateProducts(candidates);
  }

  var cleanQuery = query.toLowerCase().trim();
  var aliasTerms = expandQueryAliases(cleanQuery);
  var queryWords = cleanQuery.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, ' ').split(/\s+/).filter(Boolean);

  var scored = [];

  for (var i = 0; i < candidates.length; i++) {
    var p = candidates[i];
    var score = 0;

    var titleLower = (p.title || '').toLowerCase().trim();
    var subtitleLower = (p.subtitle || '').toLowerCase().trim();
    var artistLower = (p.artist || '').toLowerCase().trim();
    var subjectLower = (p.subject || '').toLowerCase().trim();
    var tags = Array.isArray(p.tags) ? p.tags.map(function(t) { return String(t).toLowerCase(); }) : [];
    var tagsLower = tags.join(' ');
    var keywordsLower = (p.keywords || '').toLowerCase().trim();
    var descLower = (p.description || '').toLowerCase().trim();
    var catLower = (p.category || '').toLowerCase().trim();
    var colLower = (p.collection || '').toLowerCase().trim();

    if (titleLower === cleanQuery) {
      score += 10000;
    } else if (titleLower.indexOf(cleanQuery) === 0) {
      score += 5000;
    } else if (titleLower.indexOf(cleanQuery) !== -1) {
      score += 2000;
    }

    for (var a = 0; a < aliasTerms.length; a++) {
      var alias = aliasTerms[a];
      if (!alias) continue;

      if (titleLower.indexOf(alias) !== -1) score += 1500;
      if (keywordsLower.indexOf(alias) !== -1) score += 800;
      if (tagsLower.indexOf(alias) !== -1) score += 600;
      if (subjectLower.indexOf(alias) !== -1) score += 400;
      if (catLower.indexOf(alias) !== -1 || colLower.indexOf(alias) !== -1) score += 300;
    }

    for (var w = 0; w < queryWords.length; w++) {
      var qw = queryWords[w];
      if (!qw || qw.length < 2) continue;

      if (titleLower.indexOf(qw) !== -1) score += 300;
      if (keywordsLower.indexOf(qw) !== -1) score += 150;
      if (tagsLower.indexOf(qw) !== -1) score += 120;
      if (subjectLower.indexOf(qw) !== -1) score += 100;
      if (artistLower.indexOf(qw) !== -1) score += 80;
      if (catLower.indexOf(qw) !== -1) score += 50;
      if (colLower.indexOf(qw) !== -1) score += 40;
      if (subtitleLower.indexOf(qw) !== -1) score += 30;
      if (descLower.indexOf(qw) !== -1) score += 10;
    }

    if (score > 0) {
      scored.push({ product: p, score: score });
    }
  }

  scored.sort(function(a, b) {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.product.id - b.product.id;
  });

  var sortedProducts = scored.map(function(item) { return item.product; });
  return deduplicateProducts(sortedProducts);
}

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
  const res = search(q);
  console.log(`\nQuery: "${q}" -> Returned ${res.length} UNIQUE results:`);
  res.slice(0, 5).forEach((p, idx) => {
    console.log(`  ${idx+1}. [ID ${p.id}] ${p.title} (img: ${p.images ? p.images[0] : 'none'})`);
  });
});
