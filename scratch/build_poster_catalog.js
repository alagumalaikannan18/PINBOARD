const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Read existing products-data.js
const productsDataContent = fs.readFileSync('d:/PINBOARD-GIT/js/products-data.js', 'utf8');
const fn = new Function('window', productsDataContent + '; return window.PINBOARD_PRODUCTS || PINBOARD_PRODUCTS;');
const products = fn({});

// 2. Read all 156 files
const posterDir = 'd:/PINBOARD-GIT/all_new_poster_no_repeated_poster';
const files = fs.readdirSync(posterDir);

if (files.length !== 156) {
  console.error(`CRITICAL ERROR: Expected 156 posters, found ${files.length}`);
  process.exit(1);
}

function getImageDimensions(filepath) {
  const buf = fs.readFileSync(filepath);
  let width = 1200, height = 1600; // standard defaults if unparseable

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  } else if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2;
    while (i < buf.length) {
      const marker = buf.readUInt16BE(i);
      i += 2;
      if (marker === 0xFFC0 || marker === 0xFFC1 || marker === 0xFFC2) {
        height = buf.readUInt16BE(i + 3);
        width = buf.readUInt16BE(i + 5);
        break;
      } else {
        const len = buf.readUInt16BE(i);
        i += len;
      }
    }
  }
  return { width, height };
}

function getFileHash(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const catalog = [];
const seenHashes = new Set();
const duplicateFiles = [];

files.forEach((file, idx) => {
  const fullPath = path.join(posterDir, file);
  const stat = fs.statSync(fullPath);
  const dims = getImageDimensions(fullPath);
  const hash = getFileHash(fullPath);

  if (seenHashes.has(hash)) {
    duplicateFiles.push(file);
  } else {
    seenHashes.add(hash);
  }

  const p = products[idx] || products[0];
  const aspectRatio = dims.width && dims.height ? parseFloat((dims.width / dims.height).toFixed(3)) : 0.737;

  catalog.push({
    id: `poster-${String(idx + 1).padStart(3, '0')}`,
    productId: idx + 1,
    title: p.title || `PINBOARD Poster ${idx + 1}`,
    image: `all_new_poster_no_repeated_poster/${file}`,
    category: p.category || 'Movies',
    width: dims.width,
    height: dims.height,
    aspectRatio: aspectRatio,
    fileSize: stat.size,
    fileHash: hash,
    price: p.price || 499,
    salePrice: p.salePrice || p.price || 499,
    description: p.description || '',
    rating: p.rating || 5.0,
    stock: p.stock !== undefined ? p.stock : 50,
    specs: p.specs || { size: 'A3 (12x18 in)', finish: 'Matte 300 GSM' }
  });
});

if (duplicateFiles.length > 0) {
  console.error("Duplicate files detected:", duplicateFiles);
  process.exit(1);
}

// Generate js/poster-catalog.js content
const catalogJsContent = `// =============================================
// PINBOARD — Centralized Poster Catalog
// Single Source of Truth for all 156 Unique Posters
// =============================================

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PINBOARD_POSTER_CATALOG = factory();
    root.PinboardPosterCatalog = root.PINBOARD_POSTER_CATALOG;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var catalog = ${JSON.stringify(catalog, null, 2)};

  // Validate Catalog Integrity on Load
  if (catalog.length !== 156) {
    console.error("[PINBOARD Catalog Error] Catalog count mismatch! Expected 156, found " + catalog.length);
  }

  var idMap = {};
  var productIdMap = {};
  var categoryMap = {};

  catalog.forEach(function (item) {
    idMap[item.id] = item;
    productIdMap[item.productId] = item;
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = [];
    }
    categoryMap[item.category].push(item);
  });

  return {
    getAll: function () {
      return catalog;
    },
    getById: function (id) {
      return idMap[id] || null;
    },
    getByProductId: function (productId) {
      return productIdMap[productId] || null;
    },
    getByCategory: function (category) {
      if (!category) return catalog;
      var catLower = category.toLowerCase();
      return catalog.filter(function (item) {
        return item.category.toLowerCase() === catLower;
      });
    },
    getCategoryDistribution: function () {
      var dist = {};
      catalog.forEach(function (item) {
        dist[item.category] = (dist[item.category] || 0) + 1;
      });
      return dist;
    },
    count: function () {
      return catalog.length;
    }
  };
}));
`;

fs.writeFileSync('d:/PINBOARD-GIT/js/poster-catalog.js', catalogJsContent);
console.log("Successfully generated js/poster-catalog.js with 156 catalog items!");

// Now update products-data.js so that every product's images array points to "all_new_poster_no_repeated_poster/<filename>"
// Read products-data.js, replace images arrays for products 1..156
let updatedProducts = products.map((p, idx) => {
  if (idx < catalog.length) {
    return {
      ...p,
      images: [catalog[idx].image]
    };
  }
  return p;
});

// Trim products array to exactly 156 products if it had 158
if (updatedProducts.length > 156) {
  updatedProducts = updatedProducts.slice(0, 156);
}

const productsDataJsContent = `// PINBOARD — Central Product Catalog (156 Unique Products)
// Connected to Centralized Poster Catalog
window.PINBOARD_PRODUCTS = ${JSON.stringify(updatedProducts, null, 2)};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.PINBOARD_PRODUCTS;
}
`;

fs.writeFileSync('d:/PINBOARD-GIT/js/products-data.js', productsDataJsContent);
console.log("Successfully updated js/products-data.js with 156 clean product image paths!");
