/**
 * PINBOARD — Centralized SEO & Keyword Optimization Engine
 * Handles keyword normalization, intent grouping, page-specific metadata,
 * dynamic product/collection keywords, JSON-LD structured data, and search relevance ranking.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PinboardSEO = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // 1. Centralized SEO Keyword Configuration
  var SEO_KEYWORDS = {
    primary: [
      "wall posters",
      "posters online",
      "buy posters online",
      "wall art",
      "poster shop"
    ],

    secondary: [
      "a4 posters",
      "a6 posters",
      "movie posters",
      "football posters",
      "gaming posters",
      "car posters",
      "motivational posters",
      "minimal posters",
      "aesthetic wall posters",
      "room wall decor"
    ],

    longTail: [
      "buy wall posters online",
      "best posters for room decoration",
      "a4 wall posters online",
      "a6 posters online",
      "movie posters for wall",
      "football posters for room",
      "gaming posters for room",
      "car posters for wall",
      "motivational posters for students"
    ],

    intents: {
      transactional: [
        "buy posters online",
        "buy wall posters",
        "order posters online",
        "wall posters online",
        "buy a4 posters",
        "buy a6 posters"
      ],
      commercial: [
        "best wall posters",
        "aesthetic wall posters",
        "room decoration posters",
        "affordable wall art",
        "high quality wall posters"
      ],
      informational: [
        "wall poster ideas",
        "room poster ideas",
        "wall decoration ideas",
        "poster size guide",
        "300gsm poster quality"
      ]
    },

    categories: {
      "Movies": {
        primary: "movie posters",
        secondary: ["cinema wall art", "movie room decor", "superhero posters", "film wall decor"],
        longTail: ["movie posters for room", "cinematic wall posters online"]
      },
      "Cars": {
        primary: "car posters",
        secondary: ["car wall art", "automotive posters", "supercar posters", "car room decor"],
        longTail: ["car posters for room", "automotive wall posters"]
      },
      "Motivation": {
        primary: "motivational posters",
        secondary: ["mindset wall art", "gym posters", "discipline posters", "quote wall posters"],
        longTail: ["motivational posters for room", "gym motivation wall art"]
      },
      "Gaming": {
        primary: "gaming posters",
        secondary: ["gamer wall art", "video game posters", "setup room decor", "gaming wall art"],
        longTail: ["gaming posters for room", "cool gaming room posters"]
      },
      "Sports": {
        primary: "football posters",
        secondary: ["sports wall art", "messi posters", "ronaldo posters", "cr7 wall decor", "athlete posters"],
        longTail: ["football posters for room", "cr7 manchester united wall poster", "messi inter miami poster"]
      }
    },

    // Search query alias expansion map
    queryAliases: {
      "spiderman": ["spider-man", "peter parker", "tom holland", "marvel"],
      "spider man": ["spider-man", "peter parker"],
      "ronaldo": ["cr7", "cristiano ronaldo", "manchester united"],
      "cr7": ["cristiano ronaldo", "ronaldo"],
      "messi": ["lionel messi", "leo messi", "inter miami", "goat"],
      "car": ["cars", "automotive", "porsche", "bmw", "mustang"],
      "cars": ["car", "automotive", "porsche", "bmw"],
      "motivation": ["motivational", "discipline", "mindset", "gym"],
      "gaming": ["gamer", "game", "gta"],
      "wick": ["john wick", "baba yaga"],
      "superman": ["clark kent", "dc", "symbol of hope"]
    }
  };

  // 2. Keyword Normalization
  function normalizeKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') return '';
    return keyword
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');
  }

  function deduplicateKeywords(arr) {
    if (!Array.isArray(arr)) return [];
    var seen = new Set();
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      var norm = normalizeKeyword(arr[i]);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        result.push(arr[i].trim());
      }
    }
    return result;
  }

  // 3. Dynamic Keyword Generation for Entities
  function generateProductKeywords(product) {
    if (!product) return SEO_KEYWORDS.primary;

    var kw = [];
    if (product.title) kw.push(product.title + " poster");
    if (product.subject) kw.push(product.subject);
    if (product.category) {
      kw.push(product.category.toLowerCase() + " poster");
      kw.push(product.category.toLowerCase() + " wall art");
    }
    if (product.collection) kw.push(product.collection.toLowerCase() + " poster");
    if (Array.isArray(product.tags)) kw = kw.concat(product.tags);
    if (product.keywords) kw = kw.concat(product.keywords.split(' '));

    kw.push("A4 wall poster");
    kw.push("A6 wall poster");
    kw.push("300GSM matte poster");

    return deduplicateKeywords(kw).slice(0, 15);
  }

  function generateCategoryKeywords(categoryName) {
    if (!categoryName) return SEO_KEYWORDS.primary;
    var cat = SEO_KEYWORDS.categories[categoryName] || {};
    var list = [];
    if (cat.primary) list.push(cat.primary);
    if (cat.secondary) list = list.concat(cat.secondary);
    if (cat.longTail) list = list.concat(cat.longTail);
    list = list.concat(SEO_KEYWORDS.primary);
    return deduplicateKeywords(list);
  }

  function generateCollectionKeywords(collectionName) {
    if (!collectionName) return SEO_KEYWORDS.primary;
    var list = [
      collectionName + " posters",
      collectionName + " wall art",
      collectionName + " collection",
      "aesthetic " + collectionName + " decor"
    ].concat(SEO_KEYWORDS.primary);
    return deduplicateKeywords(list);
  }

  // 4. Page Metadata Generator
  function getPageSEO(pageType, entityData) {
    var title = "PINBOARD | Wall Posters & Aesthetic Wall Art";
    var description = "Shop aesthetic wall posters, movie posters, sports posters, gaming art, car posters, and motivational prints at PINBOARD. Printed on 300GSM museum matte stock.";
    var keywords = SEO_KEYWORDS.primary.concat(SEO_KEYWORDS.secondary);
    var canonicalUrl = "http://localhost:3000/";
    var ogType = "website";
    var ogImage = "";
    var structuredData = null;

    entityData = entityData || {};

    switch (pageType) {
      case 'home':
        title = "PINBOARD | Wall Posters & Aesthetic Wall Art";
        description = "Shop aesthetic wall posters, movie posters, sports posters, gaming art and more at PINBOARD. Explore poster collections for every wall.";
        canonicalUrl = "http://localhost:3000/";
        structuredData = [
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "PINBOARD",
            "url": "http://localhost:3000/",
            "logo": "",
            "description": "Curated wall posters printed on 300GSM premium matte paper."
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "PINBOARD",
            "url": "http://localhost:3000/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "http://localhost:3000/shop.html?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        ];
        break;

      case 'shop':
        title = "Shop Wall Posters | PINBOARD";
        description = "Browse our full catalog of 150+ high-quality A4 & A6 wall posters across Movies, Sports, Cars, Motivation, and Gaming.";
        canonicalUrl = "http://localhost:3000/shop.html";
        break;

      case 'collections':
        title = "Poster Collections | PINBOARD";
        description = "Explore curated poster collections grouped by mood—from Minimal Line and Peter Parker to Football Legends and Cult Cinema.";
        canonicalUrl = "http://localhost:3000/#collections";
        break;

      case 'category':
        var catName = entityData.categoryName || "Catalog";
        title = catName + " Posters | PINBOARD";
        description = "Discover high-definition " + catName + " wall posters printed on premium 300GSM matte paper. Order online with flat shipping.";
        canonicalUrl = "http://localhost:3000/" + (catName.toLowerCase()) + ".html";
        keywords = generateCategoryKeywords(catName);
        break;

      case 'product':
        if (entityData.product) {
          var p = entityData.product;
          title = (p.title || 'Product') + " Poster | PINBOARD";
          description = (p.description || ("Buy " + p.title + " wall poster online.")) + " Printed on 300GSM museum-grade matte art paper.";
          canonicalUrl = "http://localhost:3000/product.html?id=" + p.id;
          ogType = "product";
          if (p.images && p.images[0]) {
            ogImage = "http://localhost:3000/" + p.images[0];
          }
          keywords = generateProductKeywords(p);

          var productSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": p.title,
            "image": ogImage,
            "description": description,
            "sku": "PB-" + p.id,
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": p.salePrice || p.regularPrice || 60,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "url": canonicalUrl
            }
          };

          // Only add aggregateRating if authentic reviews exist
          if (p.reviewCount && p.reviewCount > 0 && p.rating && p.rating > 0) {
            productSchema.aggregateRating = {
              "@type": "AggregateRating",
              "ratingValue": p.rating,
              "reviewCount": p.reviewCount
            };
          }

          var breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "http://localhost:3000/" },
              { "@type": "ListItem", "position": 2, "name": p.category || "Shop", "item": "http://localhost:3000/shop.html" },
              { "@type": "ListItem", "position": 3, "name": p.title, "item": canonicalUrl }
            ]
          };

          structuredData = [productSchema, breadcrumbSchema];
        }
        break;

      case 'custom':
        title = "Create Your Wall — Custom Poster Studio | PINBOARD";
        description = "Design your own custom wall poster sets with AI & personal photo uploads. Printed on 300GSM thick matte stock.";
        canonicalUrl = "http://localhost:3000/custom-posters.html";
        break;

      case 'about':
        title = "About PINBOARD | Premium Wall Art & Print Studio";
        description = "Learn about PINBOARD's mission: museum-grade 300GSM prints, flat-packed packaging, and curated aesthetic wall art.";
        canonicalUrl = "http://localhost:3000/#about";
        break;
    }

    return {
      title: title,
      description: description,
      keywords: deduplicateKeywords(keywords).join(", "),
      canonicalUrl: canonicalUrl,
      ogType: ogType,
      ogImage: ogImage,
      structuredData: structuredData
    };
  }

  // 5. Dynamic DOM Injector
  function injectPageSEO(pageType, entityData) {
    if (typeof document === 'undefined') return;

    var seo = getPageSEO(pageType, entityData);

    // Title
    document.title = seo.title;

    // Meta Description
    var metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = seo.description;

    // Meta Keywords
    var metaKw = document.querySelector('meta[name="keywords"]');
    if (!metaKw) {
      metaKw = document.createElement('meta');
      metaKw.name = 'keywords';
      document.head.appendChild(metaKw);
    }
    metaKw.content = seo.keywords;

    // Canonical Link
    var canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = seo.canonicalUrl;

    // Open Graph Metadata
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = seo.title;

    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = seo.description;

    var ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.content = seo.ogImage;

    // JSON-LD Structured Data
    if (seo.structuredData && Array.isArray(seo.structuredData)) {
      var existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(function(s) { s.remove(); });

      seo.structuredData.forEach(function(data) {
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
  }

  // 6. Search Relevance Calculator with Alias Expansion
  function calculateSearchRelevance(query, product) {
    if (!query || !product) return 0;

    var normQuery = normalizeKeyword(query);
    if (!normQuery) return 0;

    var terms = normQuery.split(' ');
    var score = 0;

    var titleNorm = normalizeKeyword(product.title || '');
    var subNorm = normalizeKeyword(product.subtitle || '');
    var catNorm = normalizeKeyword(product.category || '');
    var colNorm = normalizeKeyword(product.collection || '');
    var subjectNorm = normalizeKeyword(product.subject || '');
    var kwNorm = normalizeKeyword(product.keywords || '');
    var tagsNorm = normalizeKeyword((product.tags || []).join(' '));

    // 1. Exact title match
    if (titleNorm === normQuery) score += 500;
    // 2. Title starts with query
    else if (titleNorm.indexOf(normQuery) === 0) score += 300;
    // 3. Title contains full query
    else if (titleNorm.indexOf(normQuery) !== -1) score += 200;

    // Check alias expansions
    var aliases = SEO_KEYWORDS.queryAliases[normQuery] || [];
    for (var a = 0; a < aliases.length; a++) {
      var alias = aliases[a];
      if (titleNorm.indexOf(alias) !== -1) score += 150;
      if (catNorm.indexOf(alias) !== -1 || colNorm.indexOf(alias) !== -1) score += 100;
    }

    // Term-by-term scoring
    for (var t = 0; t < terms.length; t++) {
      var term = terms[t];
      if (!term) continue;

      if (titleNorm.indexOf(term) !== -1) score += 60;
      if (catNorm === term || catNorm.indexOf(term) !== -1) score += 40;
      if (colNorm.indexOf(term) !== -1) score += 35;
      if (subjectNorm.indexOf(term) !== -1) score += 30;
      if (kwNorm.indexOf(term) !== -1) score += 25;
      if (tagsNorm.indexOf(term) !== -1) score += 20;
      if (subNorm.indexOf(term) !== -1) score += 15;
    }

    return score;
  }

  return {
    SEO_KEYWORDS: SEO_KEYWORDS,
    normalizeKeyword: normalizeKeyword,
    deduplicateKeywords: deduplicateKeywords,
    generateProductKeywords: generateProductKeywords,
    generateCategoryKeywords: generateCategoryKeywords,
    generateCollectionKeywords: generateCollectionKeywords,
    getPageSEO: getPageSEO,
    injectPageSEO: injectPageSEO,
    calculateSearchRelevance: calculateSearchRelevance
  };
}));
