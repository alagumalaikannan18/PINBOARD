// ==========================================================================
// PINBOARD — 3D Category Exhibition Gallery Engine
// Standalone Category Logic, 3D Tilt Interaction, Subcategory Filter & Search
// ==========================================================================

(function () {
  'use strict';

  var currentCategory = 'movies';
  var activeSubcategory = 'all';
  var searchQuery = '';
  var activeSort = 'featured';

  // Category Configuration & Tag Mapping
  var CATEGORY_CONFIG = {
    movies: {
      name: 'Movies',
      subcategories: ['ALL', 'MARVEL', 'DC', 'TAMIL', 'HOLLYWOOD', 'BOLLYWOOD', 'ANIMATION', 'ACTION', 'SCI-FI'],
      matcher: function (p) {
        return (p.category || '').toLowerCase() === 'movies';
      }
    },
    cars: {
      name: 'Cars',
      subcategories: ['ALL', 'LAMBORGHINI', 'FERRARI', 'PORSCHE', 'BMW', 'MERCEDES', 'JDM', 'SUPERCARS', 'HYPERCARS'],
      matcher: function (p) {
        return (p.category || '').toLowerCase() === 'cars';
      }
    },
    motivation: {
      name: 'Motivation',
      subcategories: ['ALL', 'DISCIPLINE', 'GYM & FITNESS', 'HUSTLE', 'MINDFULNESS', 'LEADERSHIP', 'LEGENDS', 'SUCCESS'],
      matcher: function (p) {
        return (p.category || '').toLowerCase() === 'motivation';
      }
    },
    anime: {
      name: 'Motivation',
      subcategories: ['ALL', 'DISCIPLINE', 'GYM & FITNESS', 'HUSTLE', 'MINDFULNESS', 'LEADERSHIP', 'LEGENDS', 'SUCCESS'],
      matcher: function (p) {
        return (p.category || '').toLowerCase() === 'motivation';
      }
    },
    gaming: {
      name: 'Gaming',
      subcategories: ['ALL', 'GTA', 'MINECRAFT', 'CALL OF DUTY', 'FORTNITE', 'CYBERPUNK', 'VALORANT', 'PUBG', 'PLAYSTATION', 'XBOX'],
      matcher: function (p) {
        return (p.category || '').toLowerCase() === 'gaming';
      }
    },
    sports: {
      name: 'Sports',
      subcategories: ['ALL', 'FOOTBALL', 'CRICKET', 'BASKETBALL', 'F1', 'TENNIS', 'NBA', 'CHAMPIONS LEAGUE', 'PREMIER LEAGUE'],
      matcher: function (p) {
        return (p.category || '').toLowerCase() === 'sports';
      }
    }
  };

  function getProductSearchString(p) {
    if (!p) return '';
    var parts = [
      p.title || '',
      p.subtitle || '',
      p.category || '',
      p.collection || '',
      p.artist || '',
      p.subject || '',
      p.keywords || '',
      p.description || '',
      Array.isArray(p.tags) ? p.tags.join(' ') : '',
      Array.isArray(p.perfectFor) ? p.perfectFor.join(' ') : ''
    ];
    return parts.join(' ').toLowerCase();
  }

  function getAllProducts() {
    var raw = [];
    if (window.PINBOARD_PRODUCTS && Array.isArray(window.PINBOARD_PRODUCTS) && window.PINBOARD_PRODUCTS.length > 0) {
      raw = window.PINBOARD_PRODUCTS;
    } else if (window.PinboardRouter && Array.isArray(window.PinboardRouter.products) && window.PinboardRouter.products.length > 0) {
      raw = window.PinboardRouter.products;
    }
    if (window.PinboardSearch && typeof window.PinboardSearch.getSaleableProducts === 'function') {
      return window.PinboardSearch.getSaleableProducts(raw);
    }
    return raw.filter(function (p) {
      if (!p) return false;
      if (p.type === 'collection-profile' || p.saleable === false) return false;
      var img = (p.images && p.images[0]) ? String(p.images[0]).toLowerCase() : '';
      return !img.includes('cat_');
    });
  }

  function detectCurrentCategory() {
    var bodyCat = document.body.getAttribute('data-category');
    if (bodyCat) {
      var bLow = bodyCat.toLowerCase();
      if (bLow === 'anime') return 'motivation';
      if (CATEGORY_CONFIG[bLow]) return bLow;
    }

    var path = window.location.pathname.toLowerCase();
    if (path.includes('movies')) return 'movies';
    if (path.includes('cars')) return 'cars';
    if (path.includes('motivation')) return 'motivation';
    if (path.includes('anime')) return 'motivation';
    if (path.includes('gaming')) return 'gaming';
    if (path.includes('sports')) return 'sports';

    var params = new URLSearchParams(window.location.search);
    var catParam = params.get('category');
    if (catParam) {
      var cLow = catParam.toLowerCase();
      if (cLow === 'anime') return 'motivation';
      if (CATEGORY_CONFIG[cLow]) return cLow;
    }

    return 'movies';
  }

  /**
   * Filter and sort posters for the current active category
   */
  function getFilteredCategoryProducts() {
    var raw = getAllProducts();
    var config = CATEGORY_CONFIG[currentCategory];
    if (!config) return raw;

    // 1. Filter by primary category
    var categoryItems = raw.filter(config.matcher);

    // 2. Filter by subcategory pill if not 'all'
    if (activeSubcategory && activeSubcategory.toLowerCase() !== 'all') {
      var sub = activeSubcategory.toLowerCase().trim();
      categoryItems = categoryItems.filter(function (p) {
        var str = getProductSearchString(p);
        var tags = Array.isArray(p.tags) ? p.tags.map(function(t){ return String(t).toLowerCase(); }) : [];
        return str.includes(sub) || tags.indexOf(sub) !== -1;
      });
    }

    // 3. Filter by search query if present
    if (searchQuery && searchQuery.trim() !== '') {
      var q = searchQuery.toLowerCase().trim();
      categoryItems = categoryItems.filter(function (p) {
        var str = getProductSearchString(p);
        return str.includes(q);
      });
    }

    // 4. Apply Sorting
    var result = categoryItems.slice(0);
    if (activeSort === 'price-low') {
      result.sort(function (a, b) {
        var priceA = a.salePrice || a.regularPrice || 0;
        var priceB = b.salePrice || b.regularPrice || 0;
        return priceA - priceB;
      });
    } else if (activeSort === 'price-high') {
      result.sort(function (a, b) {
        var priceA = a.salePrice || a.regularPrice || 0;
        var priceB = b.salePrice || b.regularPrice || 0;
        return priceB - priceA;
      });
    } else if (activeSort === 'newest') {
      result.sort(function (a, b) {
        var isNewA = (a.badge && a.badge.toLowerCase().includes('new')) ? 1 : 0;
        var isNewB = (b.badge && b.badge.toLowerCase().includes('new')) ? 1 : 0;
        if (isNewA !== isNewB) return isNewB - isNewA;
        return (b.id || 0) - (a.id || 0);
      });
    }

    var deduplicated = (window.PinboardSearch && typeof window.PinboardSearch.deduplicateProducts === 'function')
      ? window.PinboardSearch.deduplicateProducts(result)
      : result;

    return deduplicated;
  }

  /**
   * Render the 3D Poster Gallery Grid
   */
  function renderCategoryGrid() {
    var gridEl = document.getElementById('categoryPosterGrid');
    var countEl = document.getElementById('categoryCountDisplay');
    if (!gridEl) return;

    var posters = getFilteredCategoryProducts();

    // Update Counter
    if (countEl) {
      countEl.textContent = posters.length + (posters.length === 1 ? ' POSTER' : ' POSTERS');
    }

    if (posters.length === 0) {
      gridEl.innerHTML =
        '<div class="category-empty-state">' +
          '<div class="empty-state-icon">🖼️</div>' +
          '<h3 class="empty-state-title">No Posters Matching Selection</h3>' +
          '<p class="empty-state-text">No existing ' + CATEGORY_CONFIG[currentCategory].name + ' posters currently match the "' + activeSubcategory.toUpperCase() + '" filter.</p>' +
          '<button type="button" class="cat-filter-pill active" id="resetSubcategoryBtn" style="display:inline-block">View All ' + CATEGORY_CONFIG[currentCategory].name + ' Posters</button>' +
        '</div>';

      var resetBtn = document.getElementById('resetSubcategoryBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          activeSubcategory = 'all';
          searchQuery = '';
          var searchInput = document.getElementById('catSearchInput');
          if (searchInput) searchInput.value = '';
          updateFilterPillsUI();
          renderCategoryGrid();
        });
      }
      return;
    }

    var html = '';
    posters.forEach(function (p, idx) {
      var sizeKey = ((p.size || (p.specs && p.specs.size) || 'A4').toUpperCase().includes('A6')) ? 'A6' : 'A4';
      var SIZE_SPECS = {
        A6: { salePrice: 25, regularPrice: 49 },
        A4: { salePrice: 60, regularPrice: 99 }
      };
      var spec = SIZE_SPECS[sizeKey] || SIZE_SPECS.A4;
      var price = spec.salePrice;
      var regularPrice = spec.regularPrice;
      var hasSale = regularPrice > price;
      var _pc = window.PinboardPosterConfig;
      var rawImg = (_pc && _pc.hasValidPoster(p)) ? p.images[0] : '';
      var optImg = rawImg
        ? ((window.PinboardRouter && typeof window.PinboardRouter.getOptimizedImageUrl === 'function')
            ? window.PinboardRouter.getOptimizedImageUrl(rawImg, false)
            : (_pc && typeof _pc.getOptimizedImageUrl === 'function' ? _pc.getOptimizedImageUrl(rawImg, false) : rawImg))
        : (_pc ? _pc.getPlaceholder(false) : '');

      var isAboveFold = idx < 8;
      var loadingAttr = isAboveFold ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';

      var badgeHtml = '';
      if (p.badge) {
        var badgeClass = 'cat-poster-badge';
        if (p.badge.toLowerCase().includes('sale')) badgeClass += ' sale';
        if (p.badge.toLowerCase().includes('trend')) badgeClass += ' trending';
        badgeHtml = '<span class="' + badgeClass + '">' + p.badge + '</span>';
      } else if (hasSale) {
        badgeHtml = '<span class="cat-poster-badge sale">SALE</span>';
      }

      var regularPriceHtml = hasSale ? '<span class="cat-placard-regular-price">₹' + regularPrice.toLocaleString() + '</span>' : '';

      var srcsetAttr = (_pc && typeof _pc.getResponsiveSrcset === 'function') ? _pc.getResponsiveSrcset(optImg) : '';
      var sizesAttr = (_pc && typeof _pc.getResponsiveSizes === 'function') ? _pc.getResponsiveSizes('card') : '';
      var responsiveImgAttr = srcsetAttr ? 'srcset="' + srcsetAttr + '" sizes="' + sizesAttr + '" ' : '';

      html +=
        '<div class="cat-poster-wrap" data-product-id="' + p.id + '" tabindex="0" role="link" aria-label="' + p.title + '">' +
          '<div class="cat-poster-card">' +
            '<div class="product-tape"></div>' +
            badgeHtml +
            '<div class="cat-poster-mat">' +
              '<div class="cat-poster-artwork">' +
                '<img src="' + optImg + '" ' + responsiveImgAttr + 'alt="' + p.title + '" ' + loadingAttr + ' width="280" height="380" onerror="this.onerror=null;this.src=\'' + (_pc ? _pc.getPlaceholder(false) : '') + '\'" />' +
                '<div class="cat-poster-shadow"></div>' +
              '</div>' +
            '</div>' +
            '<div class="cat-poster-placard">' +
              '<div class="cat-placard-info-left">' +
                '<h3 class="cat-placard-title" title="' + p.title + '">' + p.title + '</h3>' +
                '<div class="cat-placard-sub">' + (p.category || CATEGORY_CONFIG[currentCategory].name) + ' · ' + (p.size || 'A4') + '</div>' +
              '</div>' +
              '<div class="cat-placard-prices">' +
                '<span class="cat-placard-active-price">₹' + price.toLocaleString() + '</span>' +
                regularPriceHtml +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    gridEl.innerHTML = html;
    attach3DCardHandlers(gridEl);
  }

  /**
   * Lightweight 3D Mouse Perspective Interaction
   */
  function attach3DCardHandlers(container) {
    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    container.querySelectorAll('.cat-poster-wrap').forEach(function (wrap) {
      var card = wrap.querySelector('.cat-poster-card');
      var pid = wrap.getAttribute('data-product-id');

      function handleCardClick() {
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(pid);
        } else {
          try {
            sessionStorage.setItem('pinboard_selected_product_id', pid);
            localStorage.setItem('pinboard_selected_product_id', pid);
          } catch (e) {}
          window.location.href = 'product.html?id=' + encodeURIComponent(pid);
        }
      }

      wrap.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        handleCardClick();
      });

      wrap.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
          e.preventDefault();
          handleCardClick();
        }
      });

      // Desktop 3D Mouse Tilt Tracking
      if (!isTouchDevice && card) {
        var isHovered = false;
        var rafId = null;

        wrap.addEventListener('mouseenter', function () {
          isHovered = true;
          card.style.transition = 'transform 0.1s ease-out, box-shadow 0.25s ease';
        });

        wrap.addEventListener('mousemove', function (e) {
          if (!isHovered) return;
          if (rafId) cancelAnimationFrame(rafId);

          rafId = requestAnimationFrame(function () {
            var rect = wrap.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
            var y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

            var rotateY = (x * 14).toFixed(2);
            var rotateX = (-y * 14).toFixed(2);

            card.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(10px)';
          });
        });

        wrap.addEventListener('mouseleave', function () {
          isHovered = false;
          if (rafId) cancelAnimationFrame(rafId);
          card.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease';
          card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
      }
    });
  }

  /**
   * 3D Hero Chamber Interactive Tilt
   */
  function init3DHeroTilt() {
    var heroStage = document.getElementById('categoryHeroStage');
    var heroCard = document.getElementById('categoryHeroCard');
    if (!heroStage || !heroCard) return;

    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) return;

    var isHovered = false;

    heroStage.addEventListener('mouseenter', function () {
      isHovered = true;
      heroCard.style.transition = 'transform 0.12s ease-out, box-shadow 0.3s ease';
    });

    heroStage.addEventListener('mousemove', function (e) {
      if (!isHovered) return;
      var rect = heroStage.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      var rotY = (x * 16 - 4).toFixed(2);
      var rotX = (-y * 14 + 3).toFixed(2);

      heroCard.style.transform = 'translateZ(36px) rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg)';
    });

    heroStage.addEventListener('mouseleave', function () {
      isHovered = false;
      heroCard.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease';
      heroCard.style.transform = 'translateZ(30px) rotateY(-4deg) rotateX(3deg)';
    });
  }

  /**
   * Filter Bar Pill Handler
   */
  function setupFilterPills() {
    var filterTrack = document.getElementById('categoryFilterTrack');
    if (!filterTrack) return;

    filterTrack.addEventListener('click', function (e) {
      var pill = e.target.closest('.cat-filter-pill');
      if (!pill) return;

      var sub = pill.getAttribute('data-sub') || 'all';
      activeSubcategory = sub;

      updateFilterPillsUI();
      renderCategoryGrid();
    });
  }

  function updateFilterPillsUI() {
    var filterTrack = document.getElementById('categoryFilterTrack');
    if (!filterTrack) return;

    filterTrack.querySelectorAll('.cat-filter-pill').forEach(function (btn) {
      var sub = btn.getAttribute('data-sub') || 'all';
      if (sub.toLowerCase() === activeSubcategory.toLowerCase()) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Search & Sort Toolbar Setup
   */
  function setupSearchAndSort() {
    var searchInput = document.getElementById('catSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = (e.target.value || '').trim();
        renderCategoryGrid();
      });
    }

    var sortSelect = document.getElementById('catSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', function (e) {
        activeSort = e.target.value || 'featured';
        renderCategoryGrid();
      });
    }
  }

  /**
   * Ensure Collection Hero Collage displays strictly relevant category posters
   */
  function updateHeroCollageVisuals() {
    var heroStage = document.getElementById('categoryHeroStage');
    if (!heroStage) return;
    var collage = heroStage.querySelector('.hero-3d-collage');
    if (!collage) return;

    var items = collage.querySelectorAll('.collage-item img');
    if (!items || items.length < 3) return;

    var mainSrc = items[0].getAttribute('src') || '';
    var mainClean = mainSrc.replace(/-(sm|md|lg|xl|thumb)\.webp$/i, '').replace(/\.[^.]+$/, '');

    var allProds = getAllProducts();
    if (!allProds || allProds.length === 0) return;

    // Filter products strictly matching current category
    var matchingPosters = allProds.filter(function (p) {
      if (!p) return false;
      var cat = (p.category || '').toLowerCase();
      var tags = Array.isArray(p.tags) ? p.tags.map(function (t) { return String(t).toLowerCase(); }) : [];

      if (currentCategory === 'cars') {
        return cat === 'cars' || tags.indexOf('cars') !== -1 || tags.indexOf('supercars') !== -1 || tags.indexOf('automotive') !== -1;
      }
      if (currentCategory === 'movies') {
        return cat === 'movies' || tags.indexOf('movies') !== -1 || tags.indexOf('marvel') !== -1 || tags.indexOf('cinema') !== -1;
      }
      if (currentCategory === 'motivation') {
        return cat === 'motivation' || tags.indexOf('motivation') !== -1 || tags.indexOf('discipline') !== -1;
      }
      if (currentCategory === 'gaming') {
        return cat === 'gaming' || tags.indexOf('gaming') !== -1 || tags.indexOf('esports') !== -1;
      }
      if (currentCategory === 'sports') {
        return cat === 'sports' || tags.indexOf('sports') !== -1 || tags.indexOf('football') !== -1 || tags.indexOf('soccer') !== -1;
      }
      return cat === currentCategory;
    });

    // Filter out main poster to guarantee 3 unique, non-repeating posters in hero
    var distinctCandidates = matchingPosters.filter(function (p) {
      if (!p) return false;
      var pImg = p.image || (p.images && p.images[0]) || '';
      var pClean = pImg.replace(/-(sm|md|lg|xl|thumb)\.webp$/i, '').replace(/\.[^.]+$/, '');
      return pClean !== mainClean;
    });

    var _hpc = window.PinboardPosterConfig;
    var _hph = _hpc ? _hpc.getPlaceholder(false) : '';
    if (distinctCandidates.length >= 2) {
      var p2Img = (_hpc && _hpc.hasValidPoster(distinctCandidates[0])) ? distinctCandidates[0].images[0] : (distinctCandidates[0].image || '');
      var p3Img = (_hpc && _hpc.hasValidPoster(distinctCandidates[1])) ? distinctCandidates[1].images[0] : (distinctCandidates[1].image || '');

      if (items[1] && p2Img) {
        var opt2 = (_hpc && typeof _hpc.getOptimizedImageUrl === 'function') ? _hpc.getOptimizedImageUrl(p2Img, false) : p2Img;
        items[1].src = opt2;
        items[1].onerror = function() { this.onerror=null; this.src=p2Img; };
      }
      if (items[2] && p3Img) {
        var opt3 = (_hpc && typeof _hpc.getOptimizedImageUrl === 'function') ? _hpc.getOptimizedImageUrl(p3Img, false) : p3Img;
        items[2].src = opt3;
        items[2].onerror = function() { this.onerror=null; this.src=p3Img; };
      }
    }
  }

  /**
   * Initialize Category Exhibition Page
   */
  function initCategoryPage() {
    currentCategory = detectCurrentCategory();
    document.body.classList.add('theme-' + currentCategory);

    setupFilterPills();
    setupSearchAndSort();
    init3DHeroTilt();
    renderCategoryGrid();
    updateHeroCollageVisuals();

    // Ensure Filter & Controls Bar scrolls naturally with document flow
    var controlArea = document.querySelector('.category-control-area');
    if (controlArea) {
      controlArea.style.setProperty('position', 'relative', 'important');
      controlArea.style.setProperty('top', 'auto', 'important');
    }

    // Auto sync from backend API if available
    if (window.PinboardRouter && typeof window.PinboardRouter.syncFromAPI === 'function') {
      window.PinboardRouter.syncFromAPI().then(function () {
        renderCategoryGrid();
        updateHeroCollageVisuals();
      });
    }

    // React to dynamic product loading
    window.addEventListener('pinboard:productsloaded', function () {
      renderCategoryGrid();
      updateHeroCollageVisuals();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoryPage);
  } else {
    initCategoryPage();
  }
})();
