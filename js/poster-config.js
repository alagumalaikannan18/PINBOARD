// =============================================
// PINBOARD — Central Poster Configuration & Base Path Engine
// Single source of truth for all poster image paths.
// All poster loading across the website flows through this module.
// =============================================

var PinboardPosterConfig = (function () {
  'use strict';

  // --- APPROVED POSTER ROOT ---
  var POSTER_ROOT = 'all_new_poster_no_repeated_poster';

  // --- CATEGORY DIRECTORY MAPPING ---
  var CATEGORY_DIRS = {
    movies:     POSTER_ROOT,
    cars:       POSTER_ROOT,
    gaming:     POSTER_ROOT,
    sports:     POSTER_ROOT,
    motivation: POSTER_ROOT,
    community:  POSTER_ROOT,
    products:   POSTER_ROOT
  };

  // --- PLACEHOLDER SYSTEM ---
  var PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='380' viewBox='0 0 280 380'%3E%3Crect width='280' height='380' fill='%23f5f4f0'/%3E%3Crect x='20' y='20' width='240' height='340' rx='4' fill='%23eae8e3' stroke='%23d5d2cb' stroke-width='1.5' stroke-dasharray='8 4'/%3E%3Ctext x='140' y='170' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%23c5c1b8'%3E%F0%9F%96%BC%EF%B8%8F%3C/text%3E%3Ctext x='140' y='210' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='600' letter-spacing='2' fill='%23a09c94'%3EPOSTER%3C/text%3E%3Ctext x='140' y='230' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23b5b1a9'%3EComing Soon%3C/text%3E%3C/svg%3E";
  var PLACEHOLDER_THUMB_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='140' viewBox='0 0 100 140'%3E%3Crect width='100' height='140' fill='%23f5f4f0'/%3E%3Crect x='8' y='8' width='84' height='124' rx='3' fill='%23eae8e3' stroke='%23d5d2cb' stroke-width='1' stroke-dasharray='6 3'/%3E%3Ctext x='50' y='62' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23c5c1b8'%3E%F0%9F%96%BC%EF%B8%8F%3C/text%3E%3Ctext x='50' y='82' text-anchor='middle' font-family='sans-serif' font-size='8' font-weight='600' letter-spacing='1' fill='%23a09c94'%3EPOSTER%3C/text%3E%3C/svg%3E";

  /**
   * Programmatically detect deployment base path ('/' for localhost, '/PINBOARD/' for GitHub Pages).
   * @returns {string}
   */
  function getBasePath() {
    if (typeof window === 'undefined') return '/';
    if (window.PINBOARD_BASE_PATH) {
      var b = window.PINBOARD_BASE_PATH;
      return b.endsWith('/') ? b : b + '/';
    }
    var hostname = (window.location.hostname || '').toLowerCase();
    var pathname = window.location.pathname || '';
    if (hostname.indexOf('github.io') !== -1 || pathname.toLowerCase().indexOf('/pinboard') === 0) {
      return '/PINBOARD/';
    }
    return '/';
  }

  /**
   * Environment-agnostic Asset Path Resolver
   * Adjusts local relative paths for localhost or GitHub Pages subpath deployments (/PINBOARD/).
   * Leaves external URLs, Firebase URLs, data URIs, and absolute HTTPS URLs untouched.
   * @param {string} url
   * @returns {string}
   */
  function getAssetPath(url) {
    if (!url || typeof url !== 'string') return url || '';
    if (
      url.indexOf('http://') === 0 ||
      url.indexOf('https://') === 0 ||
      url.indexOf('data:') === 0 ||
      url.indexOf('blob:') === 0 ||
      url.indexOf('//') === 0
    ) {
      return url;
    }
    var basePath = getBasePath();
    var cleanUrl = url;
    if (cleanUrl.indexOf('/') === 0) {
      cleanUrl = cleanUrl.substring(1);
    }
    if (cleanUrl.indexOf('PINBOARD/') === 0 || cleanUrl.indexOf('pinboard/') === 0) {
      cleanUrl = cleanUrl.substring(9);
    }
    if (basePath === '/') {
      return cleanUrl;
    }
    return basePath + cleanUrl;
  }

  /**
   * Get the poster image source for a product.
   * @param {Object} product - Product object with images array
   * @param {boolean} [isThumb] - If true, returns thumbnail-sized placeholder if missing
   * @returns {string} Image URL or placeholder data URI
   */
  function getProductImage(product, isThumb) {
    if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
      var img = product.images[0];
      if (typeof img === 'string' && img.length > 0 && img.indexOf(POSTER_ROOT) === 0) {
        return getAssetPath(img);
      }
    }
    return isThumb ? PLACEHOLDER_THUMB_SVG : PLACEHOLDER_SVG;
  }

  /**
   * Get the raw image path from a product.
   * @param {Object} product
   * @returns {string}
   */
  function getRawImagePath(product) {
    if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
      var img = product.images[0];
      if (typeof img === 'string' && img.length > 0 && img.indexOf(POSTER_ROOT) === 0) {
        return getAssetPath(img);
      }
    }
    return '';
  }

  /**
   * Check if a product has a valid poster from the approved 156-poster library.
   * @param {Object} product
   * @returns {boolean}
   */
  function hasValidPoster(product) {
    if (!product || !product.images || !Array.isArray(product.images) || product.images.length === 0) {
      return false;
    }
    var img = product.images[0];
    return typeof img === 'string' && img.length > 0 && img.indexOf(POSTER_ROOT) === 0;
  }

  function getPlaceholder(isThumb) {
    return isThumb ? PLACEHOLDER_THUMB_SVG : PLACEHOLDER_SVG;
  }

  function getCategoryDir(category) {
    return POSTER_ROOT;
  }

  function getOnerrorHandler(isThumb) {
    var ph = isThumb ? PLACEHOLDER_THUMB_SVG : PLACEHOLDER_SVG;
    return "this.onerror=null;this.src='" + ph + "'";
  }

  /**
   * Get optimized responsive WebP image URL for a given poster path.
   * Uses WebP variant (-md.webp / -thumb.webp) to reduce bandwidth by 99%+.
   * @param {string} src
   * @param {boolean} [isThumb]
   * @returns {string}
   */
  function getOptimizedImageUrl(src, isThumb) {
    if (!src || typeof src !== 'string') return PLACEHOLDER_SVG;
    if (src.indexOf('data:') === 0 || src.indexOf('http') === 0) return src;
    var variant = isThumb ? 'thumb' : 'md';
    return getVariantUrl(src, variant);
  }

  /**
   * Get responsive variant URL for a poster path.
   * @param {string} src - Base image path
   * @param {string} [variant='md'] - 'sm' (400w), 'md' (800w), 'lg' (1200w), 'xl' (2000w), 'thumb'
   * @returns {string}
   */
  function getVariantUrl(src, variant) {
    if (!src || typeof src !== 'string') return PLACEHOLDER_SVG;
    if (src.indexOf('data:') === 0 || src.indexOf('http') === 0) return src;
    var cleanSrc = src.replace(/-(sm|md|lg|xl|thumb)\.webp$/i, '');
    var baseNoExt = cleanSrc.replace(/\.[^.]+$/, '');
    var targetVariant = variant || 'md';
    return getAssetPath(baseNoExt + '-' + targetVariant + '.webp');
  }

  /**
   * Get responsive srcset attribute string for a poster.
   * @param {string} src - Base image path
   * @returns {string}
   */
  function getResponsiveSrcset(src) {
    if (!src || typeof src !== 'string' || src.indexOf('data:') === 0) return '';
    var cleanSrc = src.replace(/-(sm|md|lg|xl|thumb)\.webp$/i, '');
    var baseNoExt = cleanSrc.replace(/\.[^.]+$/, '');
    return getAssetPath(baseNoExt + '-sm.webp') + ' 400w, ' +
           getAssetPath(baseNoExt + '-md.webp') + ' 800w, ' +
           getAssetPath(baseNoExt + '-lg.webp') + ' 1200w, ' +
           getAssetPath(baseNoExt + '-xl.webp') + ' 2000w';
  }

  /**
   * Get responsive sizes attribute string.
   * @param {string} [context='card'] - 'card', 'pdp', 'hero', 'cart'
   * @returns {string}
   */
  function getResponsiveSizes(context) {
    if (context === 'pdp' || context === 'zoom') {
      return '(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 600px';
    }
    if (context === 'hero') {
      return '(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 400px';
    }
    if (context === 'cart') {
      return '100px';
    }
    return '(max-width: 480px) 45vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 280px';
  }

  /**
   * Auto-resolve all static HTML <img> and <source> tag asset paths for GitHub Pages
   */
  function autoResolveStaticAssets() {
    if (typeof document === 'undefined') return;
    var basePath = getBasePath();
    if (basePath === '/') return;

    var elements = document.querySelectorAll('img[src], source[srcset]');
    elements.forEach(function (el) {
      if (el.tagName.toLowerCase() === 'img') {
        var src = el.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:') && !src.startsWith('/PINBOARD/')) {
          el.setAttribute('src', getAssetPath(src));
        }
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoResolveStaticAssets);
    } else {
      autoResolveStaticAssets();
    }
  }

  return {
    POSTER_ROOT: POSTER_ROOT,
    CATEGORY_DIRS: CATEGORY_DIRS,
    PLACEHOLDER: PLACEHOLDER_SVG,
    PLACEHOLDER_THUMB: PLACEHOLDER_THUMB_SVG,
    getBasePath: getBasePath,
    getAssetPath: getAssetPath,
    getProductImage: getProductImage,
    getRawImagePath: getRawImagePath,
    hasValidPoster: hasValidPoster,
    getPlaceholder: getPlaceholder,
    getCategoryDir: getCategoryDir,
    getOnerrorHandler: getOnerrorHandler,
    getOptimizedImageUrl: getOptimizedImageUrl,
    getVariantUrl: getVariantUrl,
    getResponsiveSrcset: getResponsiveSrcset,
    getResponsiveSizes: getResponsiveSizes
  };
})();

if (typeof window !== 'undefined') {
  window.PinboardPosterConfig = PinboardPosterConfig;
  window.getAssetPath = PinboardPosterConfig.getAssetPath;
  window.getBasePath = PinboardPosterConfig.getBasePath;
}
