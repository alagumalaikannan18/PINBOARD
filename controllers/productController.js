const Product = require('../models/Product');
const { getIsConnected } = require('../config/database');
const path = require('path');
const fs = require('fs');

// In-memory fallback product dataset loaded from products-data.js
let cachedLocalProducts = null;
function getLocalProducts() {
  if (cachedLocalProducts) return cachedLocalProducts;
  try {
    const dataPath = path.resolve(__dirname, '../js/products-data.js');
    const content = fs.readFileSync(dataPath, 'utf8');
    const sandbox = {};
    const vm = require('vm');
    vm.runInNewContext(content, sandbox);
    cachedLocalProducts = sandbox.PINBOARD_PRODUCTS || [];
    return cachedLocalProducts;
  } catch (e) {
    return [];
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
      if (parsedLimit > 0) {
        q = q.skip((parsedPage - 1) * parsedLimit).limit(parsedLimit);
      }
      const products = await q;
      if (products && products.length > 0) {
        return res.json({
          success: true,
          count: products.length,
          data: products
        });
      }
    }

    // Fallback to local products
    let fallback = getLocalProducts();
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

      if (dbResults && dbResults.length > 0) {
        return res.json({
          success: true,
          query: q,
          count: dbResults.length,
          data: dbResults
        });
      }
    }

    // Fallback search over in-memory products
    const term = q.toLowerCase();
    const local = getLocalProducts();
    const results = local.filter(p => {
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
    }).slice(0, 20);

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

    if (getIsConnected()) {
      let product = null;
      if (!isNaN(numId)) {
        product = await Product.findOne({ id: numId, isActive: true }).lean();
      }
      if (!product) {
        product = await Product.findOne({ slug: rawId, isActive: true }).lean();
      }
      if (!product && rawId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(rawId).lean();
      }

      if (product) {
        return res.json({
          success: true,
          data: product
        });
      }
    }

    // Fallback to local products
    const local = getLocalProducts();
    let p = null;
    if (!isNaN(numId)) {
      p = local.find(item => item.id === numId);
    }
    if (!p) {
      p = local.find(item => item.slug === rawId || String(item.id) === String(rawId));
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

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getLocalProducts
};
