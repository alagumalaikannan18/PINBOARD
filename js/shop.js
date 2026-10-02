// =============================================
// PINBOARD — 3D Poster Gallery & Showroom Logic
// Dynamic 3D tilt interaction, non-destructive shuffle, and routing
// =============================================

(function () {
  'use strict';

  var activeCategory = 'all';

  /**
   * Fisher-Yates non-destructive shuffle algorithm
   * @param {Array} array
   * @returns {Array} Shuffled copy of array
   */
  function shuffleArray(array) {
    if (!Array.isArray(array)) return [];
    var copy = array.slice(0);
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function getProductsList() {
    if (window.PINBOARD_PRODUCTS && Array.isArray(window.PINBOARD_PRODUCTS) && window.PINBOARD_PRODUCTS.length > 0) {
      return window.PINBOARD_PRODUCTS;
    }
    if (window.PinboardRouter && typeof window.PinboardRouter.getAllProducts === 'function') {
      return window.PinboardRouter.getAllProducts();
    }
    return [];
  }

  function renderShopGrid() {
    var gridEl = document.getElementById('shopGrid');
    var countBadge = document.getElementById('shopCountBadge');
    if (!gridEl) return;

    var rawProducts = getProductsList();
    if (!rawProducts || rawProducts.length === 0) {
      gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: rgba(21,20,15,0.6); font-family: \'IBM Plex Mono\', monospace;">Loading posters from catalog...</div>';
      return;
    }

    var uniqueProducts = (window.PinboardSearch && typeof window.PinboardSearch.deduplicateProducts === 'function')
      ? window.PinboardSearch.deduplicateProducts(rawProducts)
      : rawProducts;

    // Filter by active category if not 'all'
    var filtered = uniqueProducts;
    if (activeCategory && activeCategory !== 'all') {
      var targetCat = activeCategory.toLowerCase();
      filtered = uniqueProducts.filter(function (p) {
        var cat = (p.category || '').toLowerCase();
        var col = (p.collection || '').toLowerCase();
        var tags = Array.isArray(p.tags) ? p.tags.map(function (t) { return t.toLowerCase(); }) : [];
        return cat.includes(targetCat) || col.includes(targetCat) || tags.indexOf(targetCat) !== -1;
      });
    }

    filtered = (window.PinboardSearch && typeof window.PinboardSearch.deduplicateProducts === 'function')
      ? window.PinboardSearch.deduplicateProducts(filtered)
      : filtered;

    // Apply Fisher-Yates random ordering
    var randomized = shuffleArray(filtered);

    // Update count badge
    if (countBadge) {
      countBadge.textContent = randomized.length + (randomized.length === 1 ? ' PRINT IN ROTATION' : ' PRINTS IN ROTATION');
    }

    if (randomized.length === 0) {
      gridEl.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">' +
          '<div style="font-size: 36px; margin-bottom: 12px;">🎨</div>' +
          '<h3 style="font-family: \'Anton\', sans-serif; font-size: 24px; text-transform: uppercase; margin: 0 0 8px;">No Posters Found</h3>' +
          '<p style="color: rgba(21,20,15,0.6); font-size: 14px; margin-bottom: 20px;">No prints currently matching category "' + activeCategory + '".</p>' +
          '<button class="gallery-pill active" data-category="all" style="display:inline-block">View All Posters</button>' +
        '</div>';
      return;
    }

    var html = '';
    randomized.forEach(function (p, idx) {
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
      var rawImg = p.image || (p.images && p.images[0]) || '';
      var optImg = rawImg
        ? ((window.PinboardRouter && typeof window.PinboardRouter.getOptimizedImageUrl === 'function')
            ? window.PinboardRouter.getOptimizedImageUrl(rawImg, false)
            : (_pc && typeof _pc.getOptimizedImageUrl === 'function' ? _pc.getOptimizedImageUrl(rawImg, false) : rawImg))
        : (_pc ? _pc.getPlaceholder(false) : '');

      var isAboveFold = idx < 8;
      var loadingAttr = isAboveFold ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';
      
      var badgeHtml = '';
      if (p.badge) {
        badgeHtml = '<span class="gallery-badge ' + (p.badge.toLowerCase() === 'sale' ? 'sale' : '') + '">' + p.badge + '</span>';
      } else if (hasSale) {
        badgeHtml = '<span class="gallery-badge sale">SALE</span>';
      }

      var regularPriceHtml = hasSale ? '<span class="placard-price-regular">₹' + regularPrice.toLocaleString() + '</span>' : '';

      var srcsetAttr = (_pc && typeof _pc.getResponsiveSrcset === 'function') ? _pc.getResponsiveSrcset(optImg) : '';
      var sizesAttr = (_pc && typeof _pc.getResponsiveSizes === 'function') ? _pc.getResponsiveSizes('card') : '';
      var responsiveImgAttr = srcsetAttr ? 'srcset="' + srcsetAttr + '" sizes="' + sizesAttr + '" ' : '';

      html +=
        '<div class="poster-3d-wrap" data-product-id="' + p.id + '" tabindex="0" role="link" aria-label="' + p.title + '">' +
          '<div class="poster-3d-card">' +
            '<div class="product-tape"></div>' +
            badgeHtml +
            '<div class="poster-mat-frame">' +
              '<div class="poster-artwork-float">' +
                '<img src="' + optImg + '" ' + responsiveImgAttr + 'alt="' + p.title + '" ' + loadingAttr + ' width="280" height="380" onerror="this.onerror=null;this.src=\'' + (rawImg || (_pc ? _pc.getPlaceholder(false) : '')) + '\'" />' +
                '<div class="poster-art-shadow"></div>' +
              '</div>' +
            '</div>' +
            '<div class="gallery-placard">' +
              '<div class="placard-info-left">' +
                '<h3 class="placard-title">' + p.title + '</h3>' +
                '<div class="placard-sub">' + (p.category || 'Curated') + ' · ' + (p.size || 'A4') + '</div>' +
              '</div>' +
              '<div class="placard-price-wrap">' +
                '<span class="placard-price-active">₹' + price.toLocaleString() + '</span>' +
                regularPriceHtml +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    gridEl.innerHTML = html;

    // Attach 3D Tilt Interaction and Navigation Handlers
    attach3DCardHandlers(gridEl);
  }

  /**
   * Lightweight cursor-based 3D tilt interaction
   */
  function attach3DCardHandlers(container) {
    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    container.querySelectorAll('.poster-3d-wrap').forEach(function (wrap) {
      var card = wrap.querySelector('.poster-3d-card');
      var pid = wrap.getAttribute('data-product-id');

      function handleCardNav() {
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(pid);
        } else {
          window.location.href = 'product.html?id=' + encodeURIComponent(pid);
        }
      }

      wrap.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        handleCardNav();
      });

      wrap.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
          e.preventDefault();
          handleCardNav();
        }
      });

      // Desktop 3D Mouse Tracking
      if (!isTouchDevice && card) {
        var isHovered = false;

        wrap.addEventListener('mouseenter', function () {
          isHovered = true;
          card.style.transition = 'transform 0.1s ease-out, box-shadow 0.25s ease';
        });

        wrap.addEventListener('mousemove', function (e) {
          if (!isHovered) return;
          var rect = wrap.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
          var y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

          var rotateY = x * 14; // max 7 deg tilt
          var rotateX = -y * 14;

          card.style.transform =
            'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateZ(8px)';
        });

        wrap.addEventListener('mouseleave', function () {
          isHovered = false;
          card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease';
          card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
      }
    });
  }

  function setupFilterBar() {
    var filterBar = document.getElementById('shopFilterBar');
    if (!filterBar) return;

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.gallery-pill');
      if (!btn) return;
      var cat = btn.getAttribute('data-category') || 'all';
      activeCategory = cat;

      filterBar.querySelectorAll('.gallery-pill').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      renderShopGrid();
    });
  }

  function checkUrlParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      var cat = params.get('category');
      if (cat) {
        activeCategory = cat.toLowerCase();
        var filterBar = document.getElementById('shopFilterBar');
        if (filterBar) {
          filterBar.querySelectorAll('.gallery-pill').forEach(function (b) {
            if ((b.getAttribute('data-category') || '').toLowerCase() === activeCategory) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
        }
      }
    } catch (e) {}
  }

  function initShopPage() {
    checkUrlParams();
    setupFilterBar();
    renderShopGrid();

    // Auto-sync products from backend API if available
    if (window.PinboardRouter && typeof window.PinboardRouter.syncFromAPI === 'function') {
      window.PinboardRouter.syncFromAPI().then(function () {
        renderShopGrid();
      });
    }

    // Re-render when backend products are loaded
    window.addEventListener('pinboard:productsloaded', function () {
      renderShopGrid();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShopPage);
  } else {
    initShopPage();
  }
})();
