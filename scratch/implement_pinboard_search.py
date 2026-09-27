import re

search_engine_code = """
// ---------- PRODUCTION-GRADE PINBOARD SEARCH ENGINE ----------
(function () {
  'use strict';

  var ENTITY_ALIASES = {
    // Sports & Football Legends
    'messi': ['lionel messi', 'leo messi', 'messi 10', 'goat', 'argentina', 'barcelona', 'inter miami', 'blaugrana', 'qatar 2022', 'camp nou'],
    'lionel': ['lionel messi', 'messi', 'leo messi'],
    'lionel messi': ['messi', 'leo messi', 'goat', 'argentina', 'barcelona', 'inter miami'],
    'ronaldo': ['cristiano ronaldo', 'cr7', 'portugal', 'real madrid', 'man united', 'old trafford', 'siuu'],
    'cristiano': ['cristiano ronaldo', 'ronaldo', 'cr7'],
    'cr7': ['cristiano ronaldo', 'ronaldo', 'portugal'],
    'mcgregor': ['conor mcgregor', 'ufc', 'notorious', 'mma'],
    'conor': ['conor mcgregor', 'ufc', 'notorious'],
    'football': ['messi', 'ronaldo', 'qatar 2022', 'argentina', 'portugal', 'barcelona', 'man united', 'champions league'],

    // Superheroes & Comics
    'spiderman': ['spider-man', 'spider man', 'peter parker', 'miles morales', 'spider-verse', 'gwen', 'marvel', 'daily bugle', 'no way home'],
    'spider-man': ['spiderman', 'spider man', 'peter parker', 'miles morales', 'spider-verse', 'gwen', 'marvel'],
    'spider man': ['spiderman', 'spider-man', 'peter parker', 'miles morales', 'spider-verse'],
    'batman': ['the batman', 'dark knight', 'gotham', 'bruce wayne', 'dc'],
    'dark knight': ['the batman', 'batman', 'joker', 'gotham'],
    'doom': ['doctor doom', 'dr doom', 'monarch of latveria', 'marvel', 'latveria'],
    'ironman': ['iron man', 'tony stark', 'avengers', 'marvel'],
    'iron man': ['ironman', 'tony stark', 'avengers', 'marvel'],
    'superman': ['man of steel', 'clark kent', 'symbol of hope', 'dc'],
    'wanda': ['scarlet witch', 'wanda maximoff', 'marvel'],
    'marvel': ['spider-man', 'spiderman', 'iron man', 'doom', 'wanda'],

    // Cult Cinema & TV Series
    'breaking bad': ['walter white', 'heisenberg', 'jesse pinkman', 'saul goodman', 'wanna cook'],
    'walter white': ['breaking bad', 'heisenberg'],
    'fight club': ['tyler durden', 'soap', 'first rule', 'brad pitt', 'edward norton'],
    'tyler durden': ['fight club', 'soap'],
    'john wick': ['baba yaga', 'keanu reeves', 'continental'],
    'baba yaga': ['john wick'],
    'american psycho': ['patrick bateman', 'christian bale'],
    'patrick bateman': ['american psycho'],
    'interstellar': ['cooper', 'gargantua', 'nolan', 'christopher nolan'],
    'the shining': ['jack torrance', 'redrum', 'kubrick'],
    'parasite': ['bong joon-ho', 'oscar winner'],
    'money heist': ['la casa de papel', 'professor', 'tokyo'],
    'peaky blinders': ['thomas shelby', 'tommy shelby', 'cillian murphy'],
    'shelby': ['peaky blinders', 'thomas shelby'],
    'stranger things': ['mind flayer', 'eleven', 'hawkins'],
    'atonement': ['dunkirk', 'keira knightley', 'romance'],

    // Anime & Gaming
    'arthur morgan': ['red dead redemption', 'rdr2', 'rockstar games', 'outlaw'],
    'rdr2': ['arthur morgan', 'red dead redemption'],
    'red dead': ['arthur morgan', 'red dead redemption', 'rdr2'],
    'gta': ['gta vi', 'grand theft auto', 'rockstar games', 'vice city', 'jason and lucia'],
    'gta vi': ['gta', 'grand theft auto', 'vice city'],
    'cyberpunk': ['night city', 'v', 'cd projekt red'],

    // Cars & Motorsports
    'cars': ['supercars', 'lightning mcqueen', 'bmw', 'ferrari', 'porsche', 'mustang'],
    'bmw': ['bmw e30 m3', 'e30', 'm3', 'white smoke drift'],
    'ferrari': ['ferrari 250 gto', 'vintage red legend'],
    'porsche': ['porsche 911', 'supercar'],
    'mcqueen': ['lightning mcqueen', 'cars movie', 'pixar', 'rust-eze', '95'],
    'lightning mcqueen': ['mcqueen', 'cars movie', 'pixar', 'rust-eze'],

    // Motivation & Fitness
    'goggins': ['david goggins', 'stay hard', 'mentality'],
    'stay hard': ['david goggins', 'goggins'],
    'arnold': ['arnold schwarzenegger', 'bodybuilding', 'mr olympia'],
    'rocky': ['rocky balboa', 'the comeback', 'there is no tomorrow'],

    // Music & Pop Culture
    'lana': ['lana del rey', 'ultraviolence', 'brooklyn baby'],
    'lana del rey': ['lana', 'ultraviolence', 'brooklyn baby'],
    'the weeknd': ['after hours', 'starboy', 'blinding lights'],
    'cigarettes after sex': ['apocalypse']
  };

  function normalizeQuery(q) {
    if (!q || typeof q !== 'string') return '';
    var lower = q.toLowerCase().trim();
    return lower.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
  }

  function getQuerySearchTerms(cleanQ) {
    var terms = new Set();
    if (!cleanQ) return terms;

    terms.add(cleanQ);

    // Exact or partial alias match
    if (ENTITY_ALIASES[cleanQ]) {
      ENTITY_ALIASES[cleanQ].forEach(function (alias) { terms.add(alias); });
    }

    // Check sub-keys or normalized forms (e.g., "spider man" vs "spiderman")
    var unhyphenated = cleanQ.replace(/-/g, ' ');
    var condensed = cleanQ.replace(/[\s-]/g, '');
    terms.add(unhyphenated);
    terms.add(condensed);

    if (ENTITY_ALIASES[unhyphenated]) {
      ENTITY_ALIASES[unhyphenated].forEach(function (alias) { terms.add(alias); });
    }
    if (ENTITY_ALIASES[condensed]) {
      ENTITY_ALIASES[condensed].forEach(function (alias) { terms.add(alias); });
    }

    return terms;
  }

  var PinboardSearch = {
    get products() {
      if (typeof globalScope !== 'undefined' && Array.isArray(globalScope.PINBOARD_PRODUCTS)) {
        return globalScope.PINBOARD_PRODUCTS;
      }
      return (typeof PINBOARD_PRODUCTS !== 'undefined' && Array.isArray(PINBOARD_PRODUCTS)) ? PINBOARD_PRODUCTS : [];
    },

    search: function (query, options) {
      options = options || {};
      var categoryFilter = options.category ? options.category.toLowerCase().trim() : null;
      var collectionFilter = options.collection ? options.collection.toLowerCase().trim() : null;
      var sortMode = options.sort || 'relevance';

      var cleanQ = normalizeQuery(query);

      var allProds = this.getSaleableProducts(this.products);

      // Filtering by category / collection if specified
      var candidates = allProds.filter(function (p) {
        if (categoryFilter && (p.category || '').toLowerCase() !== categoryFilter) return false;
        if (collectionFilter && (p.collection || '').toLowerCase().indexOf(collectionFilter) === -1) return false;
        return true;
      });

      if (!cleanQ) {
        var dedupedEmpty = this.deduplicateProducts(candidates);
        return this.sortResults(dedupedEmpty, sortMode);
      }

      var searchTerms = getQuerySearchTerms(cleanQ);
      var words = cleanQ.split(' ').filter(function (w) { return w.length > 1; });
      var scored = [];

      for (var i = 0; i < candidates.length; i++) {
        var p = candidates[i];
        var score = 0;

        var idStr = String(p.id);
        var title = (p.title || '').toLowerCase();
        var cat = (p.category || '').toLowerCase();
        var col = (p.collection || '').toLowerCase();
        var desc = (p.description || '').toLowerCase();
        var badge = (p.badge || '').toLowerCase();
        var tags = Array.isArray(p.tags) ? p.tags.map(function (t) { return String(t).toLowerCase(); }) : [];
        var tagsStr = tags.join(' ');
        var keywords = (p.keywords || '').toLowerCase();

        // 1. Direct Product ID match (High score)
        if (cleanQ === idStr || cleanQ === 'poster-' + idStr || cleanQ === '#' + idStr) {
          score += 15000;
        }

        // 2. Exact Title Match
        if (title === cleanQ) {
          score += 10000;
        } else if (title.indexOf(cleanQ) === 0) {
          score += 5000;
        } else if (title.indexOf(cleanQ) !== -1) {
          score += 2500;
        }

        // 3. Category / Collection Match
        if (cat === cleanQ || col === cleanQ) {
          score += 3500;
        } else if (cat.indexOf(cleanQ) !== -1 || col.indexOf(cleanQ) !== -1) {
          score += 1500;
        }

        // Category plural/singular fallback (e.g., query "movies" matching category "Movies")
        if (cleanQ === 'movies' && cat === 'movies') score += 4000;
        if (cleanQ === 'cars' && cat === 'cars') score += 4000;
        if (cleanQ === 'sports' && cat === 'sports') score += 4000;
        if (cleanQ === 'gaming' && cat === 'gaming') score += 4000;
        if (cleanQ === 'motivation' && cat === 'motivation') score += 4000;

        // 4. Alias & Entity Expansion Matching
        searchTerms.forEach(function (term) {
          if (!term) return;
          if (title.indexOf(term) !== -1) score += 1800;
          if (col.indexOf(term) !== -1) score += 1200;
          if (cat.indexOf(term) !== -1) score += 1000;
          if (tagsStr.indexOf(term) !== -1) score += 900;
          if (keywords.indexOf(term) !== -1) score += 800;
          if (desc.indexOf(term) !== -1) score += 500;
        });

        // 5. Individual Word Token Matching
        words.forEach(function (w) {
          if (!w || w.length < 2) return;
          if (title.indexOf(w) !== -1) score += 300;
          if (col.indexOf(w) !== -1) score += 150;
          if (cat.indexOf(w) !== -1) score += 150;
          if (tagsStr.indexOf(w) !== -1) score += 120;
          if (keywords.indexOf(w) !== -1) score += 100;
          if (desc.indexOf(w) !== -1) score += 40;
        });

        if (score > 0) {
          scored.push({ product: p, score: score });
        }
      }

      scored.sort(function (a, b) {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.product.id - b.product.id;
      });

      var resultProducts = scored.map(function (item) { return item.product; });
      var deduplicated = this.deduplicateProducts(resultProducts);
      return this.sortResults(deduplicated, sortMode);
    },

    getSaleableProducts: function (productsList) {
      var list = Array.isArray(productsList) ? productsList : this.products;
      if (!Array.isArray(list)) return [];
      return list.filter(function (p) {
        return p && typeof p.id !== 'undefined' && p.type !== 'collection-profile' && p.saleable !== false;
      });
    },

    deduplicateProducts: function (productsList) {
      if (!Array.isArray(productsList)) return [];
      var seenIds = new Set();
      var uniqueList = [];

      for (var i = 0; i < productsList.length; i++) {
        var p = productsList[i];
        if (!p || typeof p.id === 'undefined') continue;
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          uniqueList.push(p);
        }
      }

      return uniqueList;
    },

    sortResults: function (list, sortBy) {
      var copy = list.slice();
      switch (sortBy) {
        case 'price-low':
          return copy.sort(function (a, b) { return (a.salePrice || a.regularPrice || 60) - (b.salePrice || b.regularPrice || 60); });
        case 'price-high':
          return copy.sort(function (a, b) { return (b.salePrice || b.regularPrice || 60) - (a.salePrice || a.regularPrice || 60); });
        case 'rating':
          return copy.sort(function (a, b) { return (b.rating || 4.9) - (a.rating || 4.9); });
        case 'popular':
          return copy.sort(function (a, b) { return (b.reviewCount || 0) - (a.reviewCount || 0); });
        default:
          return copy;
      }
    },

    getByCategory: function (category) {
      if (!category) return this.deduplicateProducts(this.getSaleableProducts());
      var catLower = category.toLowerCase().trim();
      var filtered = this.getSaleableProducts().filter(function (p) {
        return (p.category || '').toLowerCase().trim() === catLower;
      });
      return this.deduplicateProducts(filtered);
    },

    getByCollection: function (collection) {
      if (!collection) return this.deduplicateProducts(this.getSaleableProducts());
      var colLower = collection.toLowerCase().trim();
      var filtered = this.getSaleableProducts().filter(function (p) {
        return (p.collection || '').toLowerCase().trim().indexOf(colLower) !== -1;
      });
      return this.deduplicateProducts(filtered);
    },

    getFeatured: function (limit) {
      limit = limit || 8;
      var featured = this.getSaleableProducts().filter(function (p) {
        return p.badge === 'HOT' || p.badge === 'BESTSELLER' || p.badge === 'NEW' || (p.rating && p.rating >= 4.9);
      });
      return this.deduplicateProducts(featured).slice(0, limit);
    }
  };

  if (typeof globalScope !== 'undefined') {
    globalScope.PinboardSearch = PinboardSearch;
  }
  if (typeof window !== 'undefined') {
    window.PinboardSearch = PinboardSearch;
  }
})();
"""

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace or append search engine
if 'PinboardSearch =' not in content and 'var PinboardSearch' not in content:
    export_idx = content.rfind('if (typeof module !== \'undefined\'')
    if export_idx != -1:
        content = content[:export_idx] + search_engine_code + "\n" + content[export_idx:]
    else:
        content += "\n" + search_engine_code

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected production-grade PinboardSearch into products-data.js!")
