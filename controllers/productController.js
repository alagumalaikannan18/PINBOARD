const Product = require('../models/Product');
const { getIsConnected } = require('../config/database');
const path = require('path');
const fs = require('fs');

// In-memory fallback product dataset loaded from products-data.js
let cachedLocalProducts = null;
let lastMtime = 0;

function getCanonicalArtworkKey(p) {
  if (!p) return '';
  const id = p.id;
  const idArtworkMap = {
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

  if (id && idArtworkMap[id]) return idArtworkMap[id];

  const img = (p.images && p.images[0]) ? String(p.images[0]) : '';
  if (!img) return 'art-prod-' + p.id;

  let base = img.split('?')[0].split('#')[0].replace(/^.*[\\\/]/, '').toLowerCase().trim();
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

function deduplicateProductArray(products) {
  if (!Array.isArray(products)) return [];
  const seenIds = new Set();
  const seenArtworkKeys = new Set();
  const seenTitles = new Set();
  const result = [];

  products.forEach(p => {
    if (!p || typeof p.id === 'undefined') return;
    if (p.type === 'collection-profile' || p.saleable === false) return;
    if (seenIds.has(p.id)) return;

    const artKey = getCanonicalArtworkKey(p);
    if (artKey && artKey.startsWith('cat-profile-')) return;
    if (artKey && seenArtworkKeys.has(artKey)) return;

    const normTitle = (p.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (normTitle && seenTitles.has(normTitle)) return;

    seenIds.add(p.id);
    if (artKey) seenArtworkKeys.add(artKey);
    if (normTitle) seenTitles.add(normTitle);
    result.push(p);
  });

  return result;
}

function getLocalProducts() {
  try {
    const dataPath = path.resolve(__dirname, '../js/products-data.js');
    const stat = fs.statSync(dataPath);
    if (cachedLocalProducts && stat.mtimeMs === lastMtime) {
      return deduplicateProductArray(cachedLocalProducts);
    }
    const content = fs.readFileSync(dataPath, 'utf8');
    const sandbox = {};
    const vm = require('vm');
    vm.runInNewContext(content, sandbox);
    cachedLocalProducts = deduplicateProductArray(sandbox.PINBOARD_PRODUCTS || []);
    lastMtime = stat.mtimeMs;
    return cachedLocalProducts;
  } catch (e) {
    return deduplicateProductArray(cachedLocalProducts || []);
  }
}

/**
 * GET /api/products
 * Fetch all active products (supports category / collection filters)
 */
async function getAllProducts(req, res) {
  try {
    const { category, collection, limit, page } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = new RegExp(`^${category}$`, 'i');
    }
    if (collection) {
      query.collectionName = new RegExp(collection, 'i');
    }

    // Set cache headers for high traffic scalability
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');

    const parsedLimit = limit ? parseInt(limit, 10) : 0;
    const parsedPage = page ? Math.max(1, parseInt(page, 10)) : 1;

    if (getIsConnected()) {
      let q = Product.find(query).sort({ id: 1 }).lean();
      let products = await q;
      if (products && products.length > 0) {
        products = deduplicateProductArray(products);
        if (parsedLimit > 0) {
          const start = (parsedPage - 1) * parsedLimit;
          products = products.slice(start, start + parsedLimit);
        }
        return res.json({
          success: true,
          count: products.length,
          data: products
        });
      }
    }

    // Fallback to local products
    let fallback = deduplicateProductArray(getLocalProducts());
    if (category) {
      fallback = fallback.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }
    if (collection) {
      fallback = fallback.filter(p => (p.collection || '').toLowerCase().includes(collection.toLowerCase()));
    }

    if (parsedLimit > 0) {
      const start = (parsedPage - 1) * parsedLimit;
      fallback = fallback.slice(start, start + parsedLimit);
    }

    return res.json({
      success: true,
      count: fallback.length,
      data: fallback
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: err.message
    });
  }
}

/**
 * GET /api/products/search?q=query
 * Search products by title, category, collection, tags, keywords, description, artist, subject
 */
async function searchProducts(req, res) {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    if (!q) {
      return res.json({
        success: true,
        query: '',
        count: 0,
        data: []
      });
    }

    if (getIsConnected()) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const dbResults = await Product.find({
        isActive: true,
        $or: [
          { title: regex },
          { subtitle: regex },
          { category: regex },
          { collectionName: regex },
          { tags: regex },
          { keywords: regex },
          { artist: regex },
          { subject: regex },
          { description: regex }
        ]
      }).sort({ id: 1 }).limit(20).lean();

      let cleanDbResults = deduplicateProductArray(dbResults);
      if (cleanDbResults && cleanDbResults.length > 0) {
        return res.json({
          success: true,
          query: q,
          count: cleanDbResults.length,
          data: cleanDbResults
        });
      }
    }

    // Fallback search over in-memory products
    const term = q.toLowerCase();
    const local = getLocalProducts();
    const results = deduplicateProductArray(local.filter(p => {
      const title = (p.title || '').toLowerCase();
      const sub = (p.subtitle || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const col = (p.collection || '').toLowerCase();
      const artist = (p.artist || '').toLowerCase();
      const subject = (p.subject || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const kw = (p.keywords || '').toLowerCase();
      const tags = (p.tags || []).map(t => t.toLowerCase());

      if (title.includes(term) || sub.includes(term) || cat.includes(term) || col.includes(term)) return true;
      if (artist.includes(term) || subject.includes(term) || desc.includes(term) || kw.includes(term)) return true;
      if (tags.some(t => t.includes(term) || term.includes(t))) return true;
      return false;
    })).slice(0, 20);

    return res.json({
      success: true,
      query: q,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error('Error searching products:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: err.message
    });
  }
}

/**
 * GET /api/products/:id
 * Get single product by numeric ID, slug, or MongoDB ObjectId
 */
async function getProductById(req, res) {
  try {
    const rawId = req.params.id;
    const numId = parseInt(rawId, 10);
    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');

    const slugAliasMap = {
      'rebirth-spiderman': 'peter-parker-no-way-home-nyc',
      'peter-parker': 'peter-parker-no-way-home-nyc',
      'riso-retro': 'peter-parker-no-way-home-nyc'
    };
    const effectiveRawId = slugAliasMap[String(rawId).toLowerCase()] || rawId;

    if (getIsConnected()) {
      let product = null;
      if (!isNaN(numId)) {
        product = await Product.findOne({ id: numId, isActive: true }).lean();
      }
      if (!product) {
        product = await Product.findOne({ slug: effectiveRawId, isActive: true }).lean();
      }
      if (!product) {
        const regex = new RegExp(effectiveRawId.replace(/[^a-zA-Z0-9]/g, '.*'), 'i');
        product = await Product.findOne({ $or: [{ slug: regex }, { title: regex }], isActive: true }).lean();
      }
      if (!product && effectiveRawId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(effectiveRawId).lean();
      }

      if (product) {
        return res.json({
          success: true,
          data: product
        });
      }
    }

    // Fallback to local products
    const dataPath = path.resolve(__dirname, '../js/products-data.js');
    let allLocal = [];
    try {
      const content = fs.readFileSync(dataPath, 'utf8');
      const sandbox = {};
      const vm = require('vm');
      vm.runInNewContext(content, sandbox);
      allLocal = sandbox.PINBOARD_PRODUCTS || [];
    } catch (e) {
      allLocal = getLocalProducts();
    }

    let p = null;
    if (!isNaN(numId)) {
      p = allLocal.find(item => item.id === numId);
    }
    if (!p) {
      const normRaw = String(effectiveRawId).toLowerCase().replace(/[^a-z0-9]/g, '');
      p = allLocal.find(item => {
        const itemSlug = String(item.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemTitle = String(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return itemSlug === normRaw || (normRaw.length > 3 && (itemSlug.includes(normRaw) || normRaw.includes(itemSlug) || itemTitle.includes(normRaw)));
      });
    }

    if (p && (p.saleable === false || p.isDuplicateMockup)) {
      const targetImg = (p.images && p.images[0]) ? String(p.images[0]).replace(/^.*[\\/]/, '').toLowerCase() : '';
      const saleableMatch = allLocal.find(item => {
        if (item.saleable !== false && !item.isDuplicateMockup && item.type !== 'collection-profile') {
          if (targetImg && item.images && item.images[0]) {
            const candImg = String(item.images[0]).replace(/^.*[\\/]/, '').toLowerCase();
            return candImg === targetImg;
          }
        }
        return false;
      });
      if (saleableMatch) p = saleableMatch;
    }

    if (!p) {
      return res.status(404).json({
        success: false,
        message: `Product not found with identifier: ${rawId}`
      });
    }

    return res.json({
      success: true,
      data: p
    });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: err.message
    });
  }
}

// Persistent shared review store per product for API fallback
const productReviewsStore = new Map();

/**
 * GET /api/products/:id/reviews
 * Fetch reviews for a product
 */
async function getProductReviews(req, res) {
  try {
    const strPid = String(req.params.id);
    const reviews = productReviewsStore.get(strPid) || [];

    const total = reviews.length;
    let sum = 0;
    reviews.forEach(r => { sum += (Number(r.rating) || 0); });
    const ratingAverage = total > 0 ? Number((sum / total).toFixed(1)) : 0.0;

    return res.json({
      success: true,
      productId: strPid,
      reviewCount: total,
      ratingAverage: ratingAverage,
      reviews: reviews
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: err.message });
  }
}

/**
 * POST /api/products/:id/reviews
 * Submit a product review
 */
async function addProductReview(req, res) {
  try {
    const strPid = String(req.params.id);
    const { userId, userName, userEmail, rating, text } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login to write a review.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
    }

    const cleanText = String(text || '').trim();
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Review text cannot be empty.' });
    }

    let reviews = productReviewsStore.get(strPid) || [];
    const existingIndex = reviews.findIndex(r => String(r.userId) === String(userId));
    const isUpdate = existingIndex !== -1;

    const reviewObj = {
      id: `rev_${userId}_${strPid}`,
      reviewId: `rev_${userId}_${strPid}`,
      productId: strPid,
      userId: String(userId),
      userName: String(userName || 'Verified Buyer').trim(),
      userEmail: String(userEmail || '').trim(),
      author: String(userName || 'Verified Buyer').trim(),
      rating: numRating,
      text: cleanText,
      createdAt: isUpdate ? reviews[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isUpdate) {
      reviews[existingIndex] = reviewObj;
    } else {
      reviews.unshift(reviewObj);
    }

    productReviewsStore.set(strPid, reviews);

    let sum = 0;
    reviews.forEach(r => { sum += Number(r.rating); });
    const ratingAverage = Number((sum / reviews.length).toFixed(1));

    return res.json({
      success: true,
      productId: strPid,
      isUpdate,
      reviewCount: reviews.length,
      ratingAverage: ratingAverage,
      reviews: reviews
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit review', error: err.message });
  }
}

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getLocalProducts,
  getProductReviews,
  addProductReview
};
