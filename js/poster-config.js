// =============================================
// PINBOARD — Central Poster Configuration
// Single source of truth for all poster image paths.
// All poster loading across the website flows through this module.
// =============================================

var PinboardPosterConfig = (function () {
  'use strict';

  // --- APPROVED POSTER ROOT ---
  // The authoritative single source directory for all 156 unique posters.
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
   * Get the poster image source for a product.
   * @param {Object} product - Product object with images array
   * @param {boolean} [isThumb] - If true, returns thumbnail-sized placeholder if missing
   * @returns {string} Image URL or placeholder data URI
   */
  function getProductImage(product, isThumb) {
    if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
      var img = product.images[0];
      if (typeof img === 'string' && img.length > 0 && img.indexOf(POSTER_ROOT) === 0) {
        return img;
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
        return img;
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
   * Get highest-quality image URL for a given poster path.
   * Ensures original high-resolution file is used everywhere without compression or thumb degradation.
   * @param {string} src
   * @param {boolean} [isThumb]
   * @returns {string}
   */
  function getOptimizedImageUrl(src, isThumb) {
    if (!src || typeof src !== 'string') return PLACEHOLDER_SVG;
    return src.replace(/-thumb/g, '');
  }

  return {
    POSTER_ROOT: POSTER_ROOT,
    CATEGORY_DIRS: CATEGORY_DIRS,
    PLACEHOLDER: PLACEHOLDER_SVG,
    PLACEHOLDER_THUMB: PLACEHOLDER_THUMB_SVG,
    getProductImage: getProductImage,
    getRawImagePath: getRawImagePath,
    hasValidPoster: hasValidPoster,
    getPlaceholder: getPlaceholder,
    getCategoryDir: getCategoryDir,
    getOnerrorHandler: getOnerrorHandler,
    getOptimizedImageUrl: getOptimizedImageUrl
  };
})();

if (typeof window !== 'undefined') {
  window.PinboardPosterConfig = PinboardPosterConfig;
}
