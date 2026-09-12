// =========================================================================
// PINBOARD — Classic Product Details Controller
// 1. Strict Product Isolation (Displays ONLY the selected product)
// 2. Interactive Size Engine (A6, A5, A4, A3 with dynamic pricing)
// 3. Studio Wall 3D Perspective Tilt Interaction
// 4. Smooth Cart & Order Execution
// =========================================================================

(function () {
  'use strict';

  var SIZE_SPECS = {
    A6: { code: 'A6', name: 'Small', dim: '105 × 148 mm', mult: 0.67 },
    A5: { code: 'A5', name: 'Medium', dim: '148 × 210 mm', mult: 0.80 },
    A4: { code: 'A4', name: 'Standard', dim: '210 × 297 mm', mult: 1.00 },
    A3: { code: 'A3', name: 'Gallery', dim: '297 × 420 mm', mult: 1.20 }
  };

  function getDynamicDeliveryDate() {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
  }

  function initProductPage() {
    var router = window.PinboardRouter || (typeof PinboardRouter !== 'undefined' ? PinboardRouter : null);
    var lookupFn = typeof getProductById === 'function' ? getProductById : (router ? router.getProduct.bind(router) : null);

    // 1. Extract product ID strictly from URL
    var searchParams = new URLSearchParams(window.location.search);
    var rawId = searchParams.get('id');
    var productInfo = router && typeof router.parseProductIdFromLocation === 'function'
      ? router.parseProductIdFromLocation(window.location)
      : { identifier: rawId || 1, isExplicit: Boolean(rawId) };

    var product = lookupFn ? lookupFn(productInfo.identifier) : null;

    // Fallback only if no explicit ID was provided in URL
    if (!product && !productInfo.isExplicit) {
      product = lookupFn ? (lookupFn(2) || lookupFn(1)) : null;
    }

    if (!product) {
      showNotFound();
      return;
    }

    // Cache active selected ID
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('pinboard_selected_product_id', product.id);
      if (typeof localStorage !== 'undefined') localStorage.setItem('pinboard_selected_product_id', product.id);
    } catch (e) {}

    var productId = product.id;

    // --- State ---
    var selectedSize = 'A4';
    var currentQty = 1;
    var baseSalePrice = product.salePrice || product.regularPrice || 749;
    var baseRegularPrice = product.regularPrice || (baseSalePrice + 250);

    function computeSizePrice(sizeKey, base) {
      if (sizeKey === 'A4') return base;
      if (sizeKey === 'A6') return Math.max(199, Math.round((base * 0.67) / 10) * 10 - 1);
      if (sizeKey === 'A5') return Math.max(299, Math.round((base * 0.80) / 10) * 10 - 1);
      if (sizeKey === 'A3') return Math.round((base * 1.20) / 10) * 10 - 1;
      return base;
    }

    // --- Page Title & Metadata ---
    document.title = product.title + ' — PINBOARD';

    // 1. Breadcrumb
    var breadCat = document.getElementById('pdpBreadcrumbCat');
    if (breadCat) {
      var catName = (product.category || 'POSTERS').toUpperCase();
      breadCat.textContent = catName;
      var catSlug = (product.category || 'shop').toLowerCase().replace(/\s+/g, '-');
      if (['movies', 'cars', 'motivation', 'gaming', 'sports'].indexOf(catSlug) !== -1) {
        breadCat.href = catSlug + '.html';
      } else {
        breadCat.href = 'shop.html';
      }
    }

    var breadTitle = document.getElementById('pdpBreadcrumbTitle');
    if (breadTitle) {
      breadTitle.textContent = product.title.toUpperCase();
    }

    // 2. Title & Subtitle
    var titleEl = document.getElementById('pdpTitle');
    if (titleEl) titleEl.textContent = product.title;

    var subEl = document.getElementById('pdpSubtitle');
    if (subEl) subEl.textContent = product.subtitle || (product.category + ' · Premium Poster');

    // 3. Badges Row
    var piecesBadge = document.getElementById('pdpPiecesBadge');
    if (piecesBadge) {
      var piecesCount = product.pieces || 1;
      piecesBadge.textContent = piecesCount + (piecesCount === 1 ? ' PIECE' : ' PIECES');
    }

    // 4. Rating Row
    var ratingScoreEl = document.getElementById('pdpRatingScore');
    if (ratingScoreEl) ratingScoreEl.textContent = (product.rating || 4.9).toFixed(1);

    var reviewCountEl = document.getElementById('pdpReviewCount');
    if (reviewCountEl) {
      var reviews = product.reviewCount || 840;
      reviewCountEl.textContent = reviews + '+ verified buyers';
    }

    // 5. Delivery Date Pill
    var deliveryDateEl = document.getElementById('pdpDeliveryDate');
    if (deliveryDateEl) {
      deliveryDateEl.textContent = getDynamicDeliveryDate();
    }

    // --- Gallery & Imagery (STRICT ISOLATION) ---
    var mainImg = document.getElementById('pdpMainImg');
    var thumbsContainer = document.getElementById('pdpThumbs');
    var images = (product.images && Array.isArray(product.images) && product.images.length > 0)
      ? product.images
      : ['New Project 22 [FA6B4A7].png'];

    var getOptImg = (router && typeof router.getOptimizedImageUrl === 'function')
      ? router.getOptimizedImageUrl.bind(router)
      : function (s) { return s; };

    if (mainImg) {
      var fullWebP = getOptImg(images[0], false);
      mainImg.src = fullWebP;
      mainImg.onerror = function () {
        this.onerror = null;
        this.src = images[0];
      };
      mainImg.alt = product.title;
    }

    // Only render thumbnails if THIS product genuinely has multiple authentic images
    if (thumbsContainer) {
      if (images.length > 1) {
        var thumbsHTML = '';
        images.forEach(function (src, idx) {
          var thumbWebP = getOptImg(src, true);
          thumbsHTML += '<div class="pdp-thumb' + (idx === 0 ? ' active' : '') + '" data-index="' + idx + '">';
          thumbsHTML += '<img src="' + thumbWebP + '" alt="' + product.title + ' view ' + (idx + 1) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + src + '\'" />';
          thumbsHTML += '</div>';
        });
        thumbsContainer.innerHTML = thumbsHTML;
        thumbsContainer.style.display = 'flex';

        if (!thumbsContainer.dataset.bound) {
          thumbsContainer.dataset.bound = 'true';
          thumbsContainer.addEventListener('click', function (e) {
            var thumb = e.target.closest('.pdp-thumb');
            if (!thumb) return;
            var idx = parseInt(thumb.getAttribute('data-index'), 10);
            if (mainImg && images[idx]) {
              mainImg.classList.add('fade-out');
              setTimeout(function () {
                var selectedFull = getOptImg(images[idx], false);
                mainImg.src = selectedFull;
                mainImg.onerror = function () {
                  this.onerror = null;
                  this.src = images[idx];
                };
                mainImg.classList.remove('fade-out');
              }, 150);
            }
            thumbsContainer.querySelectorAll('.pdp-thumb').forEach(function (t) { t.classList.remove('active'); });
            thumb.classList.add('active');
          });
        }
      } else {
        thumbsContainer.innerHTML = '';
        thumbsContainer.style.display = 'none';
      }
    }

    // --- 3D PERSPECTIVE HOVER TILT ON STUDIO WALL ---
    var perspectiveStage = document.getElementById('pdpStagePerspective');
    var posterWrapper = document.getElementById('pdpPosterWrapper');
    if (perspectiveStage && posterWrapper) {
      var isHovered = false;
      var glare = posterWrapper.querySelector('.pdp-poster-glare');

      perspectiveStage.addEventListener('mouseenter', function () {
        isHovered = true;
        posterWrapper.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
      });

      perspectiveStage.addEventListener('mousemove', function (e) {
        if (!isHovered) return;
        var rect = perspectiveStage.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;

        var rotY = (x * 12).toFixed(2);
        var rotX = (-y * 10).toFixed(2);

        posterWrapper.style.transform = 'rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg) translateZ(8px)';
        if (glare) {
          var glareOpacity = Math.min(0.38, Math.abs(x) + Math.abs(y) + 0.15);
          glare.style.opacity = glareOpacity.toString();
        }
      });

      perspectiveStage.addEventListener('mouseleave', function () {
        isHovered = false;
        posterWrapper.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease';
        posterWrapper.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0px)';
        if (glare) glare.style.opacity = '0.25';
      });
    }

    // --- PRICING & SIZE UPDATE LOGIC ---
    var priceEl = document.getElementById('pdpCurrentPrice');
    var mrpEl = document.getElementById('pdpOriginalMrp');
    var perPosterEl = document.getElementById('pdpPerPoster');
    var sizeReadoutEl = document.getElementById('pdpSelectedSizeReadout');

    function updatePriceDisplay() {
      var activeSale = computeSizePrice(selectedSize, baseSalePrice);
      var activeRegular = computeSizePrice(selectedSize, baseRegularPrice);

      if (priceEl) priceEl.textContent = 'Rs. ' + activeSale.toFixed(2);
      if (mrpEl) mrpEl.textContent = 'Rs. ' + activeRegular.toFixed(2);

      if (perPosterEl) {
        var pCount = product.pieces || 1;
        var unitRate = Math.round(activeSale / pCount);
        perPosterEl.textContent = 'Rs. ' + unitRate + ' per poster · ' + pCount + (pCount === 1 ? ' piece included' : ' pieces included');
      }

      var spec = SIZE_SPECS[selectedSize] || SIZE_SPECS.A4;
      if (sizeReadoutEl) {
        sizeReadoutEl.textContent = spec.code + ' (' + spec.dim + ')';
      }
    }

    // Initialize Size Pills
    var sizePills = document.querySelectorAll('.pdp-size-pill');
    sizePills.forEach(function (pill) {
      var sKey = pill.getAttribute('data-size') || 'A4';
      pill.addEventListener('click', function () {
        sizePills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        selectedSize = sKey;
        updatePriceDisplay();
      });
    });

    updatePriceDisplay();

    // --- QUANTITY STEPPER ---
    var qtyValueEl = document.getElementById('pdpQtyValue');
    var qtyMinusBtn = document.getElementById('pdpQtyMinus');
    var qtyPlusBtn = document.getElementById('pdpQtyPlus');

    if (qtyMinusBtn && !qtyMinusBtn.dataset.bound) {
      qtyMinusBtn.dataset.bound = 'true';
      qtyMinusBtn.addEventListener('click', function () {
        if (currentQty > 1) {
          currentQty--;
          if (qtyValueEl) qtyValueEl.textContent = currentQty;
        }
      });
    }

    if (qtyPlusBtn && !qtyPlusBtn.dataset.bound) {
      qtyPlusBtn.dataset.bound = 'true';
      qtyPlusBtn.addEventListener('click', function () {
        if (currentQty < 99) {
          currentQty++;
          if (qtyValueEl) qtyValueEl.textContent = currentQty;
        }
      });
    }

    // --- AUTH NOTIFICATION HELPER ---
    var authPromptEl = document.getElementById('pdpAuthPrompt');
    function showAuthPrompt(actionName) {
      if (window.Auth && typeof window.Auth.setPendingAction === 'function') {
        window.Auth.setPendingAction({
          action: actionName,
          type: actionName,
          productId: productId,
          quantity: currentQty,
          size: selectedSize
        });
      }
      var returnPath = 'product.html?id=' + encodeURIComponent(productId) + '&auto=' + actionName;
      var target = 'account.html?redirect=' + encodeURIComponent(returnPath);

      if (!authPromptEl && typeof document.createElement === 'function') {
        authPromptEl = document.createElement('div');
        authPromptEl.className = 'pdp-auth-message';
        authPromptEl.id = 'pdpAuthPrompt';
        var actionsEl = typeof document.querySelector === 'function' ? document.querySelector('.pdp-actions') : null;
        if (actionsEl && actionsEl.parentNode && typeof actionsEl.parentNode.insertBefore === 'function') {
          actionsEl.parentNode.insertBefore(authPromptEl, actionsEl);
        } else {
          var infoEl = typeof document.querySelector === 'function' ? document.querySelector('.pdp-info') : null;
          if (infoEl && typeof infoEl.appendChild === 'function') infoEl.appendChild(authPromptEl);
        }
      }

      if (authPromptEl) {
        authPromptEl.innerHTML =
          '<span><strong>Account required:</strong> ' + (actionName === 'cart' ? 'Please log in to add items to your cart.' : 'Please log in to continue with your purchase.') + '</span>' +
          '<a href="' + target + '" style="color:var(--pdp-ink);font-weight:700;text-decoration:underline;margin-left:12px;">Sign In &rarr;</a>';
        authPromptEl.style.display = 'flex';
      }

      setTimeout(function () {
        window.location.href = target;
      }, 1500);
    }

    // --- ADD TO CART ---
    var cartBtn = document.getElementById('pdpAddCart');
    var buyBtn = document.getElementById('pdpBuyNow');

    function checkAuthAndProceed(action, callback) {
      if (window.Auth && typeof window.Auth.waitForAuth === 'function') {
        window.Auth.waitForAuth().then(function (user) {
          if (user && user.isLoggedIn) {
            callback();
          } else {
            showAuthPrompt(action);
          }
        });
      } else if (window.Auth && typeof window.Auth.isLoggedIn === 'function') {
        if (window.Auth.isLoggedIn()) {
          callback();
        } else {
          showAuthPrompt(action);
        }
      } else {
        callback();
      }
    }

    function updateCartButtonState() {
      if (!cartBtn) return;
      var inCart = Boolean(window.Auth && typeof window.Auth.isInCart === 'function' && window.Auth.isInCart(productId));
      if (inCart) {
        cartBtn.textContent = 'Now Available in Cart';
        cartBtn.disabled = true;
        cartBtn.classList.add('in-cart');
        cartBtn.classList.add('is-added');
      } else {
        cartBtn.textContent = 'Add to cart';
        cartBtn.disabled = false;
        cartBtn.classList.remove('in-cart');
        cartBtn.classList.remove('is-added');
      }
    }

    updateCartButtonState();

    // Listen for cart state changes to keep button synchronized
    window.addEventListener('auth:cartchange', updateCartButtonState);
    window.addEventListener('auth:statechange', updateCartButtonState);

    cartBtn.dataset.productId = productId;
    if (buyBtn) buyBtn.dataset.productId = productId;

    var handleCartClick = function (e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (cartBtn.disabled) return;
      var activePid = cartBtn.dataset.productId || productId;
      checkAuthAndProceed('cart', function () {
        var unitPrice = computeSizePrice(selectedSize, baseSalePrice);
        if (window.Auth && typeof window.Auth.addToCart === 'function') {
          window.Auth.addToCart(activePid, currentQty, {
            size: selectedSize,
            price: unitPrice
          });
        }

        cartBtn.classList.add('in-cart');
        cartBtn.classList.add('is-added');
        cartBtn.textContent = 'Now Available in Cart';
        cartBtn.disabled = true;
      });
    };

    if (cartBtn) {
      if (!cartBtn.dataset.bound) {
        cartBtn.dataset.bound = 'true';
        cartBtn.addEventListener('click', function (e) {
          if (typeof cartBtn._clickHandler === 'function') {
            cartBtn._clickHandler(e);
          }
        });
      }
      cartBtn._clickHandler = handleCartClick;
    }

    // --- BUY NOW ---
    var handleBuyClick = function (e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      var activePid = (buyBtn && buyBtn.dataset.productId) || productId;
      checkAuthAndProceed('buy', function () {
        var unitPrice = computeSizePrice(selectedSize, baseSalePrice);
        if (window.Auth && typeof window.Auth.createOrder === 'function') {
          window.Auth.createOrder(activePid, currentQty);
        }
        if (window.Auth && typeof window.Auth.addToCart === 'function') {
          window.Auth.addToCart(activePid, currentQty, {
            size: selectedSize,
            price: unitPrice
          });
        }
        window.location.href = 'cart.html';
      });
    };

    if (buyBtn) {
      if (!buyBtn.dataset.bound) {
        buyBtn.dataset.bound = 'true';
        buyBtn.addEventListener('click', function (e) {
          if (typeof buyBtn._clickHandler === 'function') {
            buyBtn._clickHandler(e);
          }
        });
      }
      buyBtn._clickHandler = handleBuyClick;
    }

    // --- CONTENT: STORY & SPECIFICATIONS ---
    var descEl = document.getElementById('pdpDesc');
    if (descEl) descEl.textContent = product.description || 'Premium archival art print created for high-definition visual impact.';

    var featEl = document.getElementById('pdpFeatures');
    if (featEl && product.features) {
      var fhtml = '';
      product.features.forEach(function (f) {
        fhtml += '<div class="pdp-feature-row"><span class="pdp-feature-dot"></span><span>' + f + '</span></div>';
      });
      featEl.innerHTML = fhtml;
    }

    var specsEl = document.getElementById('pdpSpecs');
    if (specsEl) {
      var shtml = '';
      var defaultSpecs = product.specifications || {
        'Stock': '300 GSM Heavyweight Matte',
        'Print Type': 'Archival Giclée Pigment',
        'Finish': 'Anti-Glare Smooth Matte',
        'Packaging': 'Rigid Industrial Tube'
      };
      for (var k in defaultSpecs) {
        shtml += '<tr><td>' + k + '</td><td>' + defaultSpecs[k] + '</td></tr>';
      }
      specsEl.innerHTML = shtml;
    }

    // --- RELATED POSTERS SECTION ---
    var relatedGrid = document.getElementById('pdpRelatedGrid');
    if (relatedGrid) {
      var relatedIds = product.relatedIds || [1, 2, 3, 4];
      var rhtml = '';
      relatedIds.forEach(function (rid) {
        if (rid === productId) return;
        var rp = lookupFn(rid);
        if (!rp) return;
        var rPrice = rp.salePrice || rp.regularPrice || 749;
        var rImg = (rp.images && rp.images[0]) ? rp.images[0] : 'New Project 22 [FA6B4A7].png';
        var rThumb = getOptImg(rImg, true);
        rhtml += '<a class="pdp-related-card" href="product.html?id=' + rp.id + '">';
        rhtml += '<div class="pdp-related-card-img"><img src="' + rThumb + '" alt="' + rp.title + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + rImg + '\'" /></div>';
        rhtml += '<div class="pdp-related-card-name">' + rp.title + '</div>';
        rhtml += '<div class="pdp-related-card-price">Rs. ' + rPrice.toLocaleString() + '.00</div>';
        rhtml += '</a>';
      });
      relatedGrid.innerHTML = rhtml;
    }
  }

  function showNotFound() {
    var main = document.querySelector('.pdp-main');
    if (main) {
      main.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;">' +
          '<h1 style="font-family:\'Anton\',sans-serif;font-size:36px;margin-bottom:12px;">POSTER NOT FOUND</h1>' +
          '<p style="color:rgba(17,17,17,0.6);margin-bottom:24px;">The poster you are looking for does not exist or has been archived.</p>' +
          '<a href="shop.html" style="display:inline-block;background:#111;color:#fff;padding:12px 28px;text-decoration:none;font-weight:700;border-radius:4px;">Back to Shop All</a>' +
        '</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPage);
  } else {
    initProductPage();
  }
})();
