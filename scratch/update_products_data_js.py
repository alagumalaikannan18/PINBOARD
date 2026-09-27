import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = """// ---------- COLLECTION PROFILES (NON-SALEABLE SHOWCASE ASSETS) ----------
var PINBOARD_COLLECTION_PROFILES = [
  { id: 991, title: "Anime Collection", category: "Anime", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_anime.webp"] },
  { id: 992, title: "Cars Collection", category: "Cars", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_cars.webp"] },
  { id: 993, title: "Football Collection", category: "Sports", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_football.webp"] },
  { id: 994, title: "Gaming Collection", category: "Gaming", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_gaming.webp"] },
  { id: 995, title: "Motivation Collection", category: "Motivation", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_motivation.webp"] },
  { id: 996, title: "Movies Collection", category: "Movies", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_movies.webp"] }
];

function getSaleableProducts(productsList) {
  if (!Array.isArray(productsList)) return [];
  return productsList.filter(function(product) {
    if (!product || typeof product.id === 'undefined') return false;
    if (product.type === 'collection-profile' || product.saleable === false || product.isCollection === true) return false;
    var img = (product.images && product.images[0]) ? String(product.images[0]) : '';
    if (img.indexOf('cat_') === 0 || (product.category && product.category.toLowerCase().indexOf('cat_') === 0)) return false;
    return true;
  });
}

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

  var base = img.split('?')[0].split('#')[0].replace(/^.*[\\\\/]/, '').toLowerCase().trim();
  base = base
    .replace(/\\.(png|jpe?g|webp|avif|gif|svg)$/i, '')
    .replace(/\\.jpg\\.jpeg$/i, '')
    .replace(/-thumb$/i, '')
    .replace(/_p\\d+$/i, '')
    .replace(/_\\d+$/i, '')
    .replace(/\\s*\\(\\d+\\)$/i, '')
    .trim();

  if (base.indexOf('cat_') === 0) return 'cat-profile-' + base;
  return 'art-img-' + base;
}

function expandQueryAliases(queryStr) {
  var raw = (queryStr || '').toLowerCase().trim();
  var normalized = raw.replace(/[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]+/g, ' ').replace(/\\s+/g, ' ').trim();
  
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

// ---------- CLIENT-SIDE SEARCH & FILTER ENGINE ----------
var PinboardSearch = {
  products: PINBOARD_PRODUCTS,

  search: function(query, options) {
    options = options || {};
    var category = options.category || null;
    var collection = options.collection || null;
    var maxPrice = options.maxPrice || Infinity;
    var minPrice = options.minPrice || 0;
    var sort = options.sort || 'relevance';

    var candidates = getSaleableProducts(this.products).filter(function(p) {
      if (category && (p.category || '').toLowerCase() !== category.toLowerCase()) return false;
      if (collection && (p.collection || '').toLowerCase().indexOf(collection.toLowerCase()) === -1) return false;
      var price = p.salePrice || p.regularPrice || 60;
      if (price < minPrice || price > maxPrice) return false;
      return true;
    });

    if (!query || query.trim() === '') {
      var deduplicated = this.deduplicateProducts(candidates);
      return this.sortResults(deduplicated, sort);
    }

    var cleanQuery = query.toLowerCase().trim();
    var aliasTerms = expandQueryAliases(cleanQuery);
    var queryWords = cleanQuery.replace(/[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]+/g, ' ').split(/\\s+/).filter(Boolean);

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
    return this.deduplicateProducts(sortedProducts);
  },

  sortResults: function(list, sortBy) {
    var copy = list.slice();
    switch (sortBy) {
      case 'price-low':
        return copy.sort(function(a, b) { return (a.salePrice || a.regularPrice) - (b.salePrice || b.regularPrice); });
      case 'price-high':
        return copy.sort(function(a, b) { return (b.salePrice || b.regularPrice) - (a.salePrice || a.regularPrice); });
      case 'rating':
        return copy.sort(function(a, b) { return b.rating - a.rating; });
      case 'popular':
        return copy.sort(function(a, b) { return b.reviewCount - a.reviewCount; });
      case 'newest':
        return copy.sort(function(a, b) { return (b.badge === 'NEW' ? 1 : 0) - (a.badge === 'NEW' ? 1 : 0); });
      default:
        return copy;
    }
  },

  getByCategory: function(category) {
    var saleable = getSaleableProducts(this.products);
    var filtered = saleable.filter(function(p) {
      return (p.category || '').toLowerCase() === category.toLowerCase();
    });
    return this.deduplicateProducts(filtered);
  },

  getByCollection: function(collection) {
    var saleable = getSaleableProducts(this.products);
    var filtered = saleable.filter(function(p) {
      return (p.collection || '').toLowerCase() === collection.toLowerCase();
    });
    return this.deduplicateProducts(filtered);
  },

  getFeatured: function(limit) {
    limit = limit || 8;
    var saleable = getSaleableProducts(this.products);
    var featured = saleable.filter(function(p) {
      return p.badge === 'HOT' || p.badge === 'BESTSELLER' || p.badge === 'NEW' || p.rating >= 4.9;
    });
    return this.deduplicateProducts(featured).slice(0, limit);
  },

  getCategories: function() {
    var map = {};
    var saleable = getSaleableProducts(this.products);
    for (var i = 0; i < saleable.length; i++) {
      var c = saleable[i].category;
      map[c] = (map[c] || 0) + 1;
    }
    return map;
  },

  getCollections: function() {
    var map = {};
    var saleable = getSaleableProducts(this.products);
    for (var i = 0; i < saleable.length; i++) {
      var c = saleable[i].collection;
      map[c] = (map[c] || 0) + 1;
    }
    return map;
  },

  getSaleableProducts: getSaleableProducts,

  isDuplicatePoster: function(poster, list) {
    if (!poster || !Array.isArray(list)) return false;
    var targetKey = getCanonicalArtworkKey(poster);
    var targetTitle = (poster.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;

      if (item.id === poster.id) return true;

      var itemKey = getCanonicalArtworkKey(item);
      if (targetKey && itemKey && targetKey === itemKey) return true;

      var itemTitle = (item.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (targetTitle && itemTitle && targetTitle === itemTitle) return true;
    }

    return false;
  },

  deduplicateProducts: function(productsList) {
    if (!Array.isArray(productsList)) return [];
    var saleable = getSaleableProducts(productsList);
    var uniqueList = [];

    for (var i = 0; i < saleable.length; i++) {
      var p = saleable[i];
      if (!this.isDuplicatePoster(p, uniqueList)) {
        uniqueList.push(p);
      }
    }

    return uniqueList;
  },

  getUniqueProducts: function(productsList) {
    return this.deduplicateProducts(productsList);
  }
};"""

target_pattern = r'// ---------- CLIENT-SIDE SEARCH & FILTER ENGINE ----------[\s\S]*?var PinboardSearch = \{[\s\S]*?\};'
new_code = re.sub(target_pattern, lambda m: replacement, code, count=1)

if 'window.PINBOARD_COLLECTION_PROFILES = PINBOARD_COLLECTION_PROFILES;' not in new_code:
    new_code = new_code.replace(
        'window.PinboardSearch = PinboardSearch;',
        'window.PINBOARD_COLLECTION_PROFILES = PINBOARD_COLLECTION_PROFILES;\n  window.PinboardSearch = PinboardSearch;'
    )

if 'PINBOARD_COLLECTION_PROFILES: PINBOARD_COLLECTION_PROFILES,' not in new_code:
    new_code = new_code.replace(
        'PinboardSearch: PinboardSearch,',
        'PINBOARD_COLLECTION_PROFILES: PINBOARD_COLLECTION_PROFILES,\n    PinboardSearch: PinboardSearch,'
    )

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Updated js/products-data.js successfully!")
