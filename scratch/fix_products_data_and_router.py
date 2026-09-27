import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure globalScope resolution works in sandbox (Node vm context where window, global, self are not set)
old_global = "var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : self);"
new_global = "var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : (typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this)));"

if old_global in content:
    content = content.replace(old_global, new_global)

# Add getProductById and PinboardRouter helper functions at the end of products-data.js before module.exports
helper_code = """
// ---------- GLOBAL PRODUCT LOOKUP & ROUTER ENGINE ----------
function getProductById(id) {
  if (id === null || id === undefined || id === '') return null;

  var products = (typeof globalScope !== 'undefined' && Array.isArray(globalScope.PINBOARD_PRODUCTS))
    ? globalScope.PINBOARD_PRODUCTS
    : ((typeof PINBOARD_PRODUCTS !== 'undefined' && Array.isArray(PINBOARD_PRODUCTS)) ? PINBOARD_PRODUCTS : []);

  if (!products || products.length === 0) return null;

  var strId = String(id).trim();
  var numId = parseInt(strId, 10);

  // 1. Direct Numeric ID match (e.g. 1 or "1")
  if (!isNaN(numId)) {
    var exactNumMatch = products.find(function (p) { return p.id === numId; });
    if (exactNumMatch) return exactNumMatch;
  }

  // 2. Loose ID equality
  var looseMatch = products.find(function (p) { return String(p.id) === strId; });
  if (looseMatch) return looseMatch;

  // 3. Poster code match (e.g. "poster-001" or "poster-1")
  if (strId.toLowerCase().indexOf('poster-') === 0) {
    var extractedNum = parseInt(strId.replace(/poster-/i, ''), 10);
    if (!isNaN(extractedNum)) {
      var posterCodeMatch = products.find(function (p) { return p.id === extractedNum; });
      if (posterCodeMatch) return posterCodeMatch;
    }
  }

  // 4. Filename / Image Path match
  var cleanSearchFilename = strId.toLowerCase().replace(/^.*[\\\\/]/, '').split('?')[0].split('#')[0];
  var imgMatch = products.find(function (p) {
    if (!p.images || !Array.isArray(p.images)) return false;
    return p.images.some(function (img) {
      var cleanImgFilename = String(img).toLowerCase().replace(/^.*[\\\\/]/, '').split('?')[0].split('#')[0];
      return cleanImgFilename === cleanSearchFilename;
    });
  });
  if (imgMatch) return imgMatch;

  // 5. Title / Slug match fallback
  var normSearchTitle = strId.toLowerCase().replace(/[^a-z0-9]/g, '');
  var titleMatch = products.find(function (p) {
    var normTitle = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return normTitle === normSearchTitle;
  });
  if (titleMatch) return titleMatch;

  // Defensive logging for failure
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[PINBOARD Router] Product lookup failed for query:', id, '| Total catalog items:', products.length);
  }

  return null;
}

var PinboardRouter = {
  products: (typeof PINBOARD_PRODUCTS !== 'undefined' ? PINBOARD_PRODUCTS : []),
  getProduct: getProductById,
  getAllProducts: function () {
    var prods = (typeof globalScope !== 'undefined' && Array.isArray(globalScope.PINBOARD_PRODUCTS))
      ? globalScope.PINBOARD_PRODUCTS
      : ((typeof PINBOARD_PRODUCTS !== 'undefined' && Array.isArray(PINBOARD_PRODUCTS)) ? PINBOARD_PRODUCTS : []);
    return prods;
  },
  getProductUrl: function (p) {
    var targetId = (p && typeof p === 'object') ? p.id : p;
    return 'product.html?id=' + encodeURIComponent(targetId || 1);
  },
  navigateToProduct: function (p) {
    var targetId = (p && typeof p === 'object') ? p.id : p;
    if (!targetId) return;
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('pinboard_selected_product_id', targetId);
      if (typeof localStorage !== 'undefined') localStorage.setItem('pinboard_selected_product_id', targetId);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.location.href = this.getProductUrl(targetId);
    }
  },
  parseProductIdFromLocation: function (loc) {
    var searchStr = loc ? (loc.search || '') : (typeof window !== 'undefined' ? window.location.search : '');
    var params = new URLSearchParams(searchStr);
    var rawId = params.get('id') || params.get('posterId') || params.get('productId') || params.get('p');
    
    if (!rawId && typeof sessionStorage !== 'undefined') {
      rawId = sessionStorage.getItem('pinboard_selected_product_id');
    }
    if (!rawId && typeof localStorage !== 'undefined') {
      rawId = localStorage.getItem('pinboard_selected_product_id');
    }

    return {
      identifier: rawId || 1,
      isExplicit: Boolean(params.get('id') || params.get('posterId') || params.get('productId') || params.get('p'))
    };
  },
  getOptimizedImageUrl: function (src, isThumb) {
    if (!src || typeof src !== 'string') return '';
    if (typeof window !== 'undefined' && window.PinboardPosterConfig && typeof window.PinboardPosterConfig.getOptimizedImageUrl === 'function') {
      return window.PinboardPosterConfig.getOptimizedImageUrl(src, isThumb);
    }
    return src;
  }
};

globalScope.getProductById = getProductById;
globalScope.PinboardRouter = PinboardRouter;
"""

if 'function getProductById' not in content:
    export_idx = content.rfind('if (typeof module !== \'undefined\'')
    if export_idx != -1:
        content = content[:export_idx] + helper_code + "\n" + content[export_idx:]
    else:
        content += "\n" + helper_code

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully injected getProductById and PinboardRouter into products-data.js")
