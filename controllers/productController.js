const Product = require('../models/Product');
const Review = require('../models/Review');
const { getIsConnected } = require('../config/database');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(__dirname, '../data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

let diskReviewsCache = null;

function loadDiskReviews() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
      diskReviewsCache = JSON.parse(data);
    } else {
      diskReviewsCache = {};
      fs.writeFileSync(REVIEWS_FILE, JSON.stringify(diskReviewsCache, null, 2), 'utf8');
    }
  } catch (e) {
    if (!diskReviewsCache) diskReviewsCache = {};
  }
  return diskReviewsCache || {};
}

function saveDiskReviews(store) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(store, null, 2), 'utf8');
    diskReviewsCache = store;
  } catch (e) {
    console.error('Failed to save reviews to disk:', e);
  }
}

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
  const seenHashes = new Set();
  const result = [];

  products.forEach(p => {
    if (!p || typeof p.id === 'undefined') return;
    if (p.type === 'collection-profile' || p.saleable === false) return;
    
    const hash = p.imageHash || (p.images && p.images[0]) || p.image;
    if (seenIds.has(p.id) || (hash && seenHashes.has(hash))) return;

    seenIds.add(p.id);
    if (hash) seenHashes.add(hash);
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

    // Fallback search over in-memory products via PinboardSearch engine
    let searchEngine = (typeof globalScope !== 'undefined' && globalScope.PinboardSearch) ? globalScope.PinboardSearch : (typeof PinboardSearch !== 'undefined' ? PinboardSearch : null);
    if (!searchEngine) {
      const sandbox = {};
      const vm = require('vm');
      const dataPath = path.resolve(__dirname, '../js/products-data.js');
      const content = fs.readFileSync(dataPath, 'utf8');
      vm.runInNewContext(content, sandbox);
      searchEngine = sandbox.PinboardSearch;
    }

    const results = searchEngine ? searchEngine.search(q) : [];

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

/**
 * GET /api/products/:id/reviews
 * Fetch reviews for a product
 */
async function getProductReviews(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const strPid = String(req.params.id);
    let reviews = [];

    if (getIsConnected()) {
      try {
        const dbReviews = await Review.find({ productId: strPid }).sort({ createdAt: -1 }).lean();
        if (dbReviews && dbReviews.length > 0) {
          reviews = dbReviews.map(r => ({
            id: r.reviewId || String(r._id),
            reviewId: r.reviewId || String(r._id),
            productId: r.productId,
            userId: r.userId,
            userName: r.userName || 'Verified Buyer',
            userEmail: r.userEmail || '',
            author: r.userName || 'Verified Buyer',
            rating: Number(r.rating) || 5,
            text: r.text || '',
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
          }));
        }
      } catch (dbErr) {
        console.warn('MongoDB review query warning:', dbErr.message);
      }
    }

    if (reviews.length === 0) {
      const store = loadDiskReviews();
      reviews = (store[strPid] || []).slice();
      reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const total = reviews.length;
    let sum = 0;
    reviews.forEach(r => { sum += (Number(r.rating) || 0); });
    const ratingAverage = total > 0 ? Number((sum / total).toFixed(1)) : 0.0;

    return res.status(200).json({
      success: true,
      productId: strPid,
      reviewCount: total,
      ratingAverage: ratingAverage,
      reviews: reviews
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: err.message
    });
  }
}

/**
 * POST /api/products/:id/reviews
 * Submit or update a product review
 */
async function addProductReview(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const strPid = String(req.params.id);
    const { userId, userName, userEmail, rating, text } = req.body || {};

    // 1. Auth check: requires authenticated user identity
    if (!userId || !String(userId).trim()) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to write a review.'
      });
    }

    // 2. Validate product existence in canonical catalog (DO NOT MODIFY CATALOG)
    const localProducts = getLocalProducts();
    const numPid = parseInt(strPid, 10);
    const prodMatch = localProducts.find(p => p.id === numPid || String(p.id) === strPid);
    if (!prodMatch) {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID ${strPid}. Poster does not exist in catalog.`
      });
    }

    // 3. Input Validation
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const cleanText = String(text || '').trim();
    if (!cleanText) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot be empty.'
      });
    }
    if (cleanText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text must not exceed 1000 characters.'
      });
    }

    const cleanUserId = String(userId).trim();
    const cleanUserName = String(userName || 'Verified Buyer').trim();
    const cleanUserEmail = String(userEmail || '').trim();
    const reviewId = `rev_${cleanUserId}_${strPid}`;

    let isUpdate = false;
    let reviewObj = null;

    // Save/Update in Disk File Store
    const store = loadDiskReviews();
    if (!store[strPid]) store[strPid] = [];
    const reviewsList = store[strPid];
    const existingIdx = reviewsList.findIndex(r => String(r.userId) === cleanUserId);

    if (existingIdx !== -1) {
      isUpdate = true;
      reviewObj = {
        id: reviewId,
        reviewId: reviewId,
        productId: strPid,
        userId: cleanUserId,
        userName: cleanUserName,
        userEmail: cleanUserEmail,
        author: cleanUserName,
        rating: numRating,
        text: cleanText,
        createdAt: reviewsList[existingIdx].createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      reviewsList[existingIdx] = reviewObj;
    } else {
      isUpdate = false;
      reviewObj = {
        id: reviewId,
        reviewId: reviewId,
        productId: strPid,
        userId: cleanUserId,
        userName: cleanUserName,
        userEmail: cleanUserEmail,
        author: cleanUserName,
        rating: numRating,
        text: cleanText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      reviewsList.unshift(reviewObj);
    }
    saveDiskReviews(store);

    // Save/Update in MongoDB if connected
    if (getIsConnected()) {
      try {
        await Review.findOneAndUpdate(
          { productId: strPid, userId: cleanUserId },
          {
            reviewId,
            productId: strPid,
            userId: cleanUserId,
            userName: cleanUserName,
            userEmail: cleanUserEmail,
            rating: numRating,
            text: cleanText
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.warn('MongoDB review upsert warning:', dbErr.message);
      }
    }

    // Calculate aggregate stats across all reviews for this product
    const updatedReviews = store[strPid] || [];
    updatedReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    let sum = 0;
    updatedReviews.forEach(r => { sum += Number(r.rating); });
    const ratingAverage = Number((sum / updatedReviews.length).toFixed(1));

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Review updated successfully' : 'Review submitted successfully',
      isUpdate: isUpdate,
      productId: strPid,
      review: reviewObj,
      reviewCount: updatedReviews.length,
      ratingAverage: ratingAverage,
      reviews: updatedReviews
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to save review',
      error: err.message
    });
  }
}

function validateProductCreation(productData) {
  const { id, title, description, category, image, imageHash } = productData || {};
  const validCategories = ['Movies', 'Cars', 'Gaming', 'Sports', 'Motivation'];
  
  if (!id) return { isValid: false, error: 'MISSING PRODUCT ID', message: 'Product ID is required.' };
  if (!title || !String(title).trim()) return { isValid: false, error: 'MISSING TITLE', message: 'Title is required.' };
  if (!description || !String(description).trim()) return { isValid: false, error: 'MISSING DESCRIPTION', message: 'Description is required.' };
  if (!category || !validCategories.includes(category)) return { isValid: false, error: 'INVALID CATEGORY', message: `Category must be one of: ${validCategories.join(', ')}.` };
  if (!image) return { isValid: false, error: 'MISSING IMAGE', message: 'Image path is required.' };

  const existingProducts = getLocalProducts();
  const idMatch = existingProducts.find(p => p.id === Number(id));
  if (idMatch) {
    return { isValid: false, error: 'DUPLICATE PRODUCT ID', message: `Product ID ${id} already exists.` };
  }

  let targetHash = imageHash;
  if (!targetHash) {
    const normPath = String(image).split('?')[0].replace(/\\/g, '/').trim();
    const absPath = path.isAbsolute(normPath) ? normPath : path.resolve(__dirname, '../', normPath);
    if (!fs.existsSync(absPath)) {
      return { isValid: false, error: 'IMAGE FILE NOT FOUND', message: `Image file does not exist at ${normPath}` };
    }
    const buf = fs.readFileSync(absPath);
    const crypto = require('crypto');
    targetHash = crypto.createHash('sha256').update(buf).digest('hex');
  }

  const hashMatch = existingProducts.find(p => p.imageHash === targetHash);
  if (hashMatch) {
    return {
      isValid: false,
      error: 'DUPLICATE POSTER — IMAGE ALREADY EXISTS',
      message: `Image already exists in catalog under Product ${hashMatch.id} ("${hashMatch.title}"). Duplicate creation rejected.`
    };
  }

  return { isValid: true, calculatedHash: targetHash };
}

async function createProduct(req, res) {
  try {
    const validation = validateProductCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        message: validation.message
      });
    }

    const newProduct = {
      ...req.body,
      id: Number(req.body.id),
      imageHash: validation.calculatedHash
    };

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER ERROR',
      message: err.message
    });
  }
}

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getLocalProducts,
  getProductReviews,
  addProductReview,
  validateProductCreation,
  createProduct
};

