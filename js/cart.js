// =========================================================================
// PINBOARD — High-Performance Dynamic Cart Controller & 3D Interactive Experience
// Targeted Micro-DOM Updates · User-Isolated State · Instant Synchronous UI
// =========================================================================

(function () {
  'use strict';

  var appliedDiscount = 0;
  var appliedCouponCode = '';

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function formatCurrency(num) {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  }

  function getFullProduct(item) {
    var id = parseInt(item.id || item.productId, 10);
    var full = null;
    if (typeof getProductById === 'function') {
      full = getProductById(id);
    }
    if (!full && window.PINBOARD_PRODUCTS && Array.isArray(window.PINBOARD_PRODUCTS)) {
      full = window.PINBOARD_PRODUCTS.find(function (p) {
        return p.id === id || String(p.id) === String(item.id);
      });
    }
    return full;
  }

  // --- 3D MOUSE PARALLAX TILT HANDLER (Delegated & Throttled) ---
  function attachCardParallax(cardEl) {
    if (!cardEl || cardEl.dataset.tiltBound) return;
    cardEl.dataset.tiltBound = 'true';

    var rafId = null;

    cardEl.addEventListener('mousemove', function (e) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () {
        var rect = cardEl.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var rotateX = ((y - centerY) / centerY) * -3.5;
        var rotateY = ((x - centerX) / centerX) * 4.5;

        cardEl.style.transform = 'perspective(1000px) translateY(-3px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateZ(6px)';
      });
    }, { passive: true });

    cardEl.addEventListener('mouseleave', function () {
      if (rafId) cancelAnimationFrame(rafId);
      cardEl.style.transform = '';
    }, { passive: true });
  }

  function isCustomPosterItem(item) {
    if (!item) return false;
    if (item.isCustom === true) return true;
    if (item.type === 'custom-poster' || item.category === 'Custom Posters' || item.category === 'CUSTOM POSTER SET') return true;
    var idStr = String(item.id || item.productId || '').toLowerCase();
    return idStr.indexOf('custom') !== -1;
  }

  /**
   * Authoritative calculation engine for cart subtotal, 3 Posters for ₹150 combo offer, and final totals
   * Excludes Custom Poster prices from checkout subtotal
   */
  function calculateCartPricing(cart, discountRate) {
    var rate = Number(discountRate) || 0;
    var cartCount = 0;
    var normalCount = 0;
    var customCount = 0;
    var rawSubtotal = 0;
    var standardA4Qty = 0;
    var customSubtotal = 0;

    (cart || []).forEach(function (item) {
      var qty = Number(item.quantity) || 1;
      cartCount += qty;

      if (isCustomPosterItem(item)) {
        customCount += qty;
        var cPrice = Number(item.price) || 0;
        customSubtotal += cPrice * qty;
      } else {
        normalCount += qty;
        var itemSize = (item.size || 'A4').toUpperCase();
        var price = (itemSize === 'A6') ? 25 : 60;
        if (itemSize === 'A4') {
          standardA4Qty += qty;
        }
        rawSubtotal += price * qty;
      }
    });

    // Combo Offer for normal A4 posters ONLY: 3 A4 Posters for ₹150 (₹30 savings per 3 A4 posters)
    var comboSets = Math.floor(standardA4Qty / 3);
    var comboSavings = comboSets * 30;
    var subtotalAfterCombo = Math.max(0, rawSubtotal - comboSavings);
    var promoDiscountAmount = Math.round(subtotalAfterCombo * rate);
    var finalTotal = Math.max(0, subtotalAfterCombo - promoDiscountAmount);

    return {
      cartCount: cartCount,
      normalCount: normalCount,
      customCount: customCount,
      standardPosterQty: standardA4Qty,
      comboSets: comboSets,
      comboSavings: comboSavings,
      rawSubtotal: rawSubtotal,
      customSubtotal: customSubtotal,
      subtotalAfterCombo: subtotalAfterCombo,
      promoDiscountAmount: promoDiscountAmount,
      finalTotal: finalTotal
    };
  }

  /**
   * Recalculate and update the Summary Box and Header Badge in the DOM without rebuilding the list
   */
  function updateSummaryAndHeaderDOM(cart) {
    var authInstance = window.PinboardAuth || window.Auth;
    var pricing = calculateCartPricing(cart, appliedDiscount);

    // Update Header Badge
    var headerCountBadge = document.getElementById('cartHeaderCountBadge');
    if (headerCountBadge) {
      headerCountBadge.textContent = pricing.cartCount + (pricing.cartCount === 1 ? ' POSTER' : ' POSTERS');
    }

    // Update Subtotal Row
    var subtotalValEl = document.getElementById('cartSummarySubtotalVal');
    var subtotalLabelEl = document.getElementById('cartSummarySubtotalLabel');
    if (subtotalValEl) subtotalValEl.textContent = formatCurrency(pricing.rawSubtotal);
    if (subtotalLabelEl) {
      var itemLabel = pricing.customCount > 0 ? (pricing.normalCount === 1 ? ' normal item' : ' normal items') : (pricing.normalCount === 1 ? ' item' : ' items');
      subtotalLabelEl.textContent = 'Subtotal (' + pricing.normalCount + itemLabel + ')';
    }

    // Update Combo Offer Row
    var comboRowEl = document.getElementById('cartSummaryComboRow');
    if (comboRowEl) {
      if (pricing.comboSets > 0) {
        comboRowEl.style.display = 'flex';
        var comboValEl = comboRowEl.querySelector('.val');
        if (comboValEl) comboValEl.textContent = '−' + formatCurrency(pricing.comboSavings);
      } else {
        comboRowEl.style.display = 'none';
      }
    }

    // Update Combo Banner/Tip
    var comboTipEl = document.getElementById('cartComboOfferTip');
    if (comboTipEl) {
      if (pricing.comboSets > 0) {
        comboTipEl.innerHTML = '🎉 <strong>Combo Applied:</strong> 3 Posters for ₹150 offer active!';
        comboTipEl.style.display = 'block';
      } else if (pricing.standardPosterQty > 0 && pricing.standardPosterQty < 3) {
        var needed = 3 - pricing.standardPosterQty;
        comboTipEl.innerHTML = '⚡ <strong>Offer:</strong> Add ' + needed + ' more poster' + (needed > 1 ? 's' : '') + ' to get 3 Posters for ₹150!';
        comboTipEl.style.display = 'block';
      } else {
        comboTipEl.style.display = 'none';
      }
    }

    // Update Discount Row
    var discountRowEl = document.getElementById('cartSummaryDiscountRow');
    if (discountRowEl) {
      if (pricing.promoDiscountAmount > 0) {
        discountRowEl.style.display = 'flex';
        var discLabel = discountRowEl.querySelector('.disc-label');
        var discVal = discountRowEl.querySelector('.val');
        if (discLabel) discLabel.textContent = 'Promo Discount (' + Math.round(appliedDiscount * 100) + '%)';
        if (discVal) discVal.textContent = '−' + formatCurrency(pricing.promoDiscountAmount);
      } else {
        discountRowEl.style.display = 'none';
      }
    }

    // Update Final Total
    var totalAmountEl = document.getElementById('cartSummaryTotalAmount');
    if (totalAmountEl) totalAmountEl.textContent = formatCurrency(pricing.finalTotal);

    // Update Navbar Badges across entire DOM
    if (authInstance && typeof authInstance.updateNavbar === 'function') {
      authInstance.updateNavbar();
    }
  }

  // --- RENDER COMPLETE CART PAGE ---
  function renderCartPage() {
    var cartContainer = document.getElementById('cartPageContainer');
    if (!cartContainer) return;

    var authInstance = window.PinboardAuth || window.Auth;
    var user = authInstance ? authInstance.getUser() : null;
    var isLoggedIn = Boolean(user && user.isLoggedIn);
    var cart = authInstance ? authInstance.getCart() : [];
    var pricing = calculateCartPricing(cart, appliedDiscount);

    // Update navbar badge
    if (authInstance && typeof authInstance.updateNavbar === 'function') {
      authInstance.updateNavbar();
    }

    // Header badge
    var headerCountBadge = document.getElementById('cartHeaderCountBadge');
    if (headerCountBadge) {
      headerCountBadge.textContent = pricing.cartCount + (pricing.cartCount === 1 ? ' POSTER' : ' POSTERS');
    }

    // Guest Banner Toggle
    var guestBanner = document.getElementById('cartGuestBanner');
    if (guestBanner) {
      guestBanner.style.display = isLoggedIn ? 'none' : 'flex';
    }

    // Empty Cart State
    if (!cart || cart.length === 0) {
      cartContainer.innerHTML =
        '<div class="cart-empty-state">' +
          '<div class="cart-empty-art" aria-hidden="true">' +
            '<div class="empty-frame-1"></div>' +
            '<div class="empty-frame-2"></div>' +
            '<div class="empty-frame-3"></div>' +
          '</div>' +
          '<span class="cart-empty-tag mono">CURATED GALLERY</span>' +
          '<h2 class="cart-empty-title display">YOUR WALL IS WAITING</h2>' +
          '<p class="cart-empty-text">' +
            'Your shopping cart is currently empty. Explore our hand-picked collection of museum-grade 300 GSM matte posters to transform your living room, studio, or bedroom.' +
          '</p>' +
          '<a href="shop.html" class="cart-explore-btn display">' +
            'EXPLORE POSTERS &rarr;' +
          '</a>' +
          '<div class="cart-empty-categories">' +
            '<span class="cart-empty-cat-label mono">POPULAR CATEGORIES</span>' +
            '<div class="cart-empty-chips">' +
              '<a href="movies.html" class="cart-empty-chip">🎬 Movies &amp; Marvel</a>' +
              '<a href="motivation.html" class="cart-empty-chip">⚡ Motivation &amp; Mindset</a>' +
              '<a href="cars.html" class="cart-empty-chip">🏎️ Supercars &amp; JDM</a>' +
              '<a href="gaming.html" class="cart-empty-chip">🎮 Gaming</a>' +
              '<a href="sports.html" class="cart-empty-chip">⚽ Sports &amp; Athletes</a>' +
              '<a href="custom-posters.html" class="cart-empty-chip">✨ Custom Posters</a>' +
            '</div>' +
          '</div>' +
        '</div>';
      return;
    }

    // Populated Cart Layout: Grid with Items & Summary
    var itemsHtml = '';
    var hasCustomItem = pricing.customCount > 0;
    var hasNormalItem = pricing.normalCount > 0;

    cart.forEach(function (item) {
      var prod = getFullProduct(item);
      var id = item.id || item.productId;
      var isCustom = isCustomPosterItem(item);
      var title = item.title || (prod ? prod.title : 'Premium Poster #' + id);
      var category = isCustom ? 'CUSTOM POSTER SET' : ((prod && (prod.category || prod.collection)) ? (prod.category || prod.collection) : 'Curated Poster');
      var price = isCustom ? (Number(item.price) || 250) : 60;
      var regPrice = isCustom ? (price + 500) : 99;
      var qty = Number(item.quantity) || 1;
      var lineTotal = price * qty;

      var _pc = window.PinboardPosterConfig;
      var _phThumb = _pc ? _pc.getPlaceholder(true) : '';
      var rawImg = '';
      if (item.image && typeof item.image === 'string' && (item.image.indexOf('all_new_poster_no_repeated_poster') === 0 || item.image.indexOf('poster-library') === 0 || item.image.indexOf('data:image') === 0)) {
        rawImg = item.image;
      } else if (prod && _pc && _pc.hasValidPoster(prod)) {
        rawImg = prod.images[0];
      }
      var optThumb = rawImg
        ? ((window.PinboardRouter && typeof window.PinboardRouter.getOptimizedImageUrl === 'function' && rawImg.indexOf('data:image') !== 0)
            ? window.PinboardRouter.getOptimizedImageUrl(rawImg, false)
            : (_pc && typeof _pc.getOptimizedImageUrl === 'function' && rawImg.indexOf('data:image') !== 0 ? _pc.getOptimizedImageUrl(rawImg, false) : rawImg))
        : _phThumb;

      var specsHtml = isCustom
        ? '<span>' + escapeHtml(item.subtitle || item.sizesSummary || ((item.template || 5) + ' Custom Prints')) + '</span><span class="cart-subtitle-dot"></span><span style="color:#b45309;font-weight:600;">ORDERED SEPARATELY</span>'
        : '<span>A3 (29.7 &times; 42 cm)</span><span class="cart-subtitle-dot"></span><span>300 GSM Archival Matte</span>';

      var customNoticeHtml = isCustom
        ? '<div class="cart-item-custom-notice" style="margin-top:8px;padding:8px 10px;background:#fffbeb;border:1px solid #fef3c7;border-radius:6px;font-size:11.5px;color:#b45309;line-height:1.4;">' +
            'ℹ️ Custom posters are ordered through the <a href="custom-posters.html" style="color:#b45309;font-weight:600;text-decoration:underline;">Custom Poster page</a>. They are not included in online checkout.' +
          '</div>'
        : '';

      itemsHtml +=
        '<div class="cart-item-card" data-product-id="' + escapeHtml(id) + '">' +
          '<div class="cart-thumb-wrap">' +
            '<a href="' + (isCustom ? 'custom-posters.html' : ('product.html?id=' + encodeURIComponent(id))) + '">' +
              '<img src="' + escapeHtml(optThumb) + '" alt="' + escapeHtml(title) + '" class="cart-poster-img" loading="lazy" decoding="async" width="100" height="140" onerror="this.onerror=null;this.src=\'' + escapeHtml(_phThumb) + '\'" />' +
            '</a>' +
          '</div>' +
          '<div class="cart-item-details">' +
            '<span class="cart-item-category mono">' + escapeHtml(category) + '</span>' +
            '<a href="' + (isCustom ? 'custom-posters.html' : ('product.html?id=' + encodeURIComponent(id))) + '" class="cart-item-title display">' +
              escapeHtml(title) +
            '</a>' +
            '<div class="cart-item-specs mono">' +
              specsHtml +
            '</div>' +
            '<div class="cart-item-price-row">' +
              '<span class="cart-item-price">' + formatCurrency(price) + '</span>' +
              (regPrice && regPrice > price ? '<span class="cart-item-original-price">' + formatCurrency(regPrice) + '</span>' : '') +
            '</div>' +
            customNoticeHtml +
          '</div>' +
          '<div class="cart-item-actions">' +
            '<div class="cart-item-total" id="cartItemTotal_' + escapeHtml(id) + '">' + formatCurrency(lineTotal) + '</div>' +
            '<div class="cart-qty-stepper">' +
              '<button type="button" class="cart-qty-btn btn-qty-minus" data-id="' + escapeHtml(id) + '" aria-label="Decrease quantity">&minus;</button>' +
              '<span class="cart-qty-value" id="cartQtyValue_' + escapeHtml(id) + '">' + qty + '</span>' +
              '<button type="button" class="cart-qty-btn btn-qty-plus" data-id="' + escapeHtml(id) + '" aria-label="Increase quantity">&plus;</button>' +
            '</div>' +
            '<button type="button" class="cart-remove-btn" data-id="' + escapeHtml(id) + '" aria-label="Remove ' + escapeHtml(title) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="3 6 5 6 21 6"></polyline>' +
                '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
              '</svg>' +
              '<span>Remove</span>' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    var deliveryEstimate = '3–5 days';

    // Customer Details Form HTML
    var customerFormHtml =
      '<div class="cart-customer-form-card" style="margin-top:24px;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.03);">' +
        '<div style="margin-bottom:18px;">' +
          '<span class="mono" style="font-size:11px;letter-spacing:1px;color:#d97706;font-weight:600;">CUSTOMER &amp; DELIVERY DETAILS</span>' +
          '<h3 class="display" style="font-size:18px;margin-top:2px;color:#111827;">ORDER REQUEST DETAILS</h3>' +
        '</div>' +
        '<form id="cartCustomerForm" novalidate>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
            '<div style="grid-column: span 2;">' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">FULL NAME <span style="color:#dc2626;">*</span></label>' +
              '<input type="text" id="cartCustName" placeholder="Enter your full name" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">EMAIL ADDRESS <span style="color:#dc2626;">*</span></label>' +
              '<input type="email" id="cartCustEmail" placeholder="name@gmail.com" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">PHONE NUMBER <span style="color:#dc2626;">*</span></label>' +
              '<input type="tel" id="cartCustPhone" placeholder="10-digit mobile number" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div style="grid-column: span 2;">' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">DELIVERY ADDRESS <span style="color:#dc2626;">*</span></label>' +
              '<input type="text" id="cartCustAddress" placeholder="Flat / House No., Street, Landmark" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">CITY <span style="color:#dc2626;">*</span></label>' +
              '<input type="text" id="cartCustCity" placeholder="City" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">STATE <span style="color:#dc2626;">*</span></label>' +
              '<input type="text" id="cartCustState" placeholder="State" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div style="grid-column: span 2;">' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">PIN CODE <span style="color:#dc2626;">*</span></label>' +
              '<input type="text" id="cartCustPincode" placeholder="6-digit PIN code" maxlength="6" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;" required />' +
            '</div>' +
            '<div style="grid-column: span 2;">' +
              '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">ORDER NOTES (OPTIONAL)</label>' +
              '<textarea id="cartCustNotes" rows="2" placeholder="Special delivery instructions or order notes..." style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>' +
            '</div>' +
          '</div>' +
          '<div id="cartFormError" style="display:none;margin-top:14px;padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#dc2626;font-size:12.5px;"></div>' +
        '</form>' +
      '</div>';

    // Summary Notices depending on cart composition
    var summaryNoticeHtml = '';
    if (!hasNormalItem && hasCustomItem) {
      summaryNoticeHtml =
        '<div class="cart-custom-summary-notice" style="margin-bottom:14px;padding:10px 12px;background:#fffbeb;border:1px solid #fef3c7;border-radius:6px;font-size:12px;color:#b45309;line-height:1.4;">' +
          'ℹ️ Custom posters are ordered through the Custom Poster page and are not processed through online checkout.' +
        '</div>';
    } else if (hasNormalItem && hasCustomItem) {
      summaryNoticeHtml =
        '<div class="cart-mixed-summary-notice" style="margin-bottom:14px;padding:10px 12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#4b5563;line-height:1.4;">' +
          'ℹ️ <strong>Note:</strong> Custom Poster Set is ordered through the Custom Poster page and is excluded from online checkout.' +
        '</div>';
    }

    var checkoutButtonHtml = '';
    if (!hasNormalItem && hasCustomItem) {
      checkoutButtonHtml =
        '<a href="custom-posters.html" class="cart-checkout-btn display" id="btnCartCustomRedirect" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#2563eb;color:#ffffff;text-decoration:none;cursor:pointer;">' +
          '<span>CUSTOM POSTER ORDER &rarr;</span>' +
        '</a>' +
        '<p class="cart-custom-only-note mono" style="font-size:11px;color:#6b7280;margin-top:8px;text-align:center;">' +
          'Please use the Custom Poster page to submit your order request.' +
        '</p>';
    } else {
      checkoutButtonHtml =
        '<button type="button" class="cart-checkout-btn display" id="btnCartCheckout">' +
          '<span>PROCEED ORDER REQUEST &rarr;</span>' +
        '</button>';
    }

    var subtotalLabel = hasCustomItem ? ('Subtotal (' + pricing.normalCount + (pricing.normalCount === 1 ? ' normal item' : ' normal items') + ')') : ('Subtotal (' + pricing.cartCount + (pricing.cartCount === 1 ? ' item' : ' items') + ')');

    var summaryHtml =
      '<div class="cart-summary-card">' +
        '<div class="cart-summary-head">' +
          '<span class="cart-summary-tag mono">SUMMARY</span>' +
          '<h3 class="cart-summary-title display">ORDER TOTAL</h3>' +
        '</div>' +
        summaryNoticeHtml +
        '<div class="cart-summary-rows">' +
          '<div class="cart-summary-row">' +
            '<span id="cartSummarySubtotalLabel">' + subtotalLabel + '</span>' +
            '<span class="val" id="cartSummarySubtotalVal">' + formatCurrency(pricing.rawSubtotal) + '</span>' +
          '</div>' +
          '<div class="cart-summary-row">' +
            '<span>Packaging Fees</span>' +
            '<span class="cart-free-tag mono">FREE</span>' +
          '</div>' +
          '<div class="cart-summary-row">' +
            '<span>Estimated Delivery</span>' +
            '<span class="val mono" style="font-size:12px;">' + deliveryEstimate + '</span>' +
          '</div>' +
          '<div class="cart-summary-divider"></div>' +
          '<div class="cart-summary-total-row">' +
            '<span class="cart-total-label">Total Amount</span>' +
            '<div class="cart-total-value-wrap">' +
              '<div class="cart-total-amount display" id="cartSummaryTotalAmount">' + formatCurrency(pricing.finalTotal) + '</div>' +
              '<span class="cart-tax-note">Inclusive of all taxes &amp; GST</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="cart-no-promo-box" style="margin-top:14px;margin-bottom:14px;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#6b7280;text-align:center;">' +
          '<span>No promo code available</span>' +
        '</div>' +
        checkoutButtonHtml +
      '</div>';

    cartContainer.innerHTML =
      '<div class="cart-layout-grid">' +
        '<div class="cart-items-container" id="cartItemsList">' +
          itemsHtml +
          (hasNormalItem ? customerFormHtml : '') +
        '</div>' +
        '<aside class="cart-summary-column">' +
          summaryHtml +
        '</aside>' +
      '</div>';

    // Prefill customer details if user logged in
    if (user) {
      if (user.name && document.getElementById('cartCustName')) document.getElementById('cartCustName').value = user.name;
      if (user.email && document.getElementById('cartCustEmail')) document.getElementById('cartCustEmail').value = user.email;
    }

    // Attach 3D parallax hover to cards
    var cards = cartContainer.querySelectorAll('.cart-item-card');
    cards.forEach(function (card) {
      attachCardParallax(card);
    });
  }

  // --- FAST EVENT DELEGATION SYSTEM ---
  function setupCartEventDelegation() {
    var cartContainer = document.getElementById('cartPageContainer');
    if (!cartContainer || cartContainer.dataset.delegationBound) return;
    cartContainer.dataset.delegationBound = 'true';

    cartContainer.addEventListener('click', function (e) {
      var authInstance = window.PinboardAuth || window.Auth;
      if (!authInstance) return;

      // 1. Quantity Plus Button
      var plusBtn = e.target.closest('.btn-qty-plus');
      if (plusBtn) {
        e.preventDefault();
        var pidPlus = plusBtn.getAttribute('data-id');
        var cartPlus = authInstance.getCart();
        var itemPlus = cartPlus.find(function (it) { return String(it.id || it.productId) === String(pidPlus); });
        var currentQtyPlus = itemPlus ? (Number(itemPlus.quantity) || 1) : 1;

        if (currentQtyPlus < 99) {
          var newQtyPlus = currentQtyPlus + 1;
          var updatedCartPlus = authInstance.updateCartQuantity(pidPlus, newQtyPlus);

          var qtyEl = document.getElementById('cartQtyValue_' + pidPlus);
          var totalEl = document.getElementById('cartItemTotal_' + pidPlus);
          var price = (itemPlus && isCustomPosterItem(itemPlus)) ? (Number(itemPlus.price) || 250) : 60;

          if (qtyEl) qtyEl.textContent = newQtyPlus;
          if (totalEl) totalEl.textContent = formatCurrency(price * newQtyPlus);

          updateSummaryAndHeaderDOM(updatedCartPlus);
        }
        return;
      }

      // 2. Quantity Minus Button
      var minusBtn = e.target.closest('.btn-qty-minus');
      if (minusBtn) {
        e.preventDefault();
        var pidMinus = minusBtn.getAttribute('data-id');
        var cartMinus = authInstance.getCart();
        var itemMinus = cartMinus.find(function (it) { return String(it.id || it.productId) === String(pidMinus); });
        var currentQtyMinus = itemMinus ? (Number(itemMinus.quantity) || 1) : 1;

        if (currentQtyMinus > 1) {
          var newQtyMinus = currentQtyMinus - 1;
          var updatedCartMinus = authInstance.updateCartQuantity(pidMinus, newQtyMinus);

          var qtyElMinus = document.getElementById('cartQtyValue_' + pidMinus);
          var totalElMinus = document.getElementById('cartItemTotal_' + pidMinus);
          var priceMinus = (itemMinus && isCustomPosterItem(itemMinus)) ? (Number(itemMinus.price) || 250) : 60;

          if (qtyElMinus) qtyElMinus.textContent = newQtyMinus;
          if (totalElMinus) totalElMinus.textContent = formatCurrency(priceMinus * newQtyMinus);

          updateSummaryAndHeaderDOM(updatedCartMinus);
        } else if (currentQtyMinus === 1) {
          var cardMinus = minusBtn.closest('.cart-item-card');
          if (cardMinus) {
            cardMinus.classList.add('is-removing');
            setTimeout(function () {
              var remainingCart = authInstance.removeFromCart(pidMinus);
              if (cardMinus.parentNode) cardMinus.parentNode.removeChild(cardMinus);
              if (!remainingCart || remainingCart.length === 0) {
                renderCartPage();
              } else {
                renderCartPage();
              }
            }, 200);
          } else {
            var remCart = authInstance.removeFromCart(pidMinus);
            renderCartPage();
          }
        }
        return;
      }

      // 3. Remove Button
      var removeBtn = e.target.closest('.cart-remove-btn');
      if (removeBtn) {
        e.preventDefault();
        var pidRemove = removeBtn.getAttribute('data-id');
        var cardRemove = removeBtn.closest('.cart-item-card');
        if (cardRemove) {
          cardRemove.classList.add('is-removing');
          setTimeout(function () {
            var rem = authInstance.removeFromCart(pidRemove);
            if (cardRemove.parentNode) cardRemove.parentNode.removeChild(cardRemove);
            renderCartPage();
          }, 200);
        } else {
          authInstance.removeFromCart(pidRemove);
          renderCartPage();
        }
        return;
      }

      // 4. Coupon Apply Button
      var couponBtn = e.target.closest('#btnApplyCoupon');
      if (couponBtn) {
        e.preventDefault();
        var couponInput = document.getElementById('cartCouponInput');
        var couponMsg = document.getElementById('cartCouponMsg');
        var code = (couponInput ? couponInput.value : '').trim().toUpperCase();

        if (!code) {
          appliedDiscount = 0;
          appliedCouponCode = '';
          if (couponMsg) {
            couponMsg.className = 'cart-coupon-msg';
            couponMsg.textContent = '';
          }
          if (couponBtn) couponBtn.textContent = 'APPLY';
          updateSummaryAndHeaderDOM(authInstance.getCart());
          return;
        }

        if (code === 'PINBOARD10' || code === 'SAVE10') {
          appliedDiscount = 0.10;
          appliedCouponCode = code;
          if (couponMsg) {
            couponMsg.className = 'cart-coupon-msg success';
            couponMsg.textContent = '✨ Promo code ' + escapeHtml(code) + ' applied! (10% Off)';
          }
          if (couponBtn) couponBtn.textContent = 'APPLIED ✓';
        } else if (code === 'STUDIO15' || code === 'ART15') {
          appliedDiscount = 0.15;
          appliedCouponCode = code;
          if (couponMsg) {
            couponMsg.className = 'cart-coupon-msg success';
            couponMsg.textContent = '✨ Promo code ' + escapeHtml(code) + ' applied! (15% Off)';
          }
          if (couponBtn) couponBtn.textContent = 'APPLIED ✓';
        } else if (code === 'WELCOME50' || code === 'FIRST50') {
          appliedDiscount = 0.20;
          appliedCouponCode = code;
          if (couponMsg) {
            couponMsg.className = 'cart-coupon-msg success';
            couponMsg.textContent = '✨ Promo code ' + escapeHtml(code) + ' applied! (20% Off)';
          }
          if (couponBtn) couponBtn.textContent = 'APPLIED ✓';
        } else {
          appliedDiscount = 0;
          appliedCouponCode = '';
          if (couponMsg) {
            couponMsg.className = 'cart-coupon-msg error';
            couponMsg.textContent = '❌ Invalid or expired coupon code. Try "PINBOARD10".';
          }
          if (couponBtn) couponBtn.textContent = 'APPLY';
        }
        updateSummaryAndHeaderDOM(authInstance.getCart());
        return;
      }

      // 5. Checkout Button for Normal Posters
      var checkoutBtn = e.target.closest('#btnCartCheckout');
      if (checkoutBtn) {
        e.preventDefault();
        var currentCart = authInstance.getCart();
        var pricing = calculateCartPricing(currentCart, appliedDiscount);
        handleCheckout(currentCart, pricing.finalTotal);
        return;
      }
    });
  }

  // --- CHECKOUT LOGIC FOR NORMAL POSTERS ONLY ---
  function handleCheckout(cart, total) {
    if (!cart || cart.length === 0) return;

    var normalItems = (cart || []).filter(function (item) {
      return !isCustomPosterItem(item);
    });

    if (normalItems.length === 0) {
      window.location.href = 'custom-posters.html';
      return;
    }

    // 1. Get Customer Details Form inputs
    var nameEl = document.getElementById('cartCustName');
    var emailEl = document.getElementById('cartCustEmail');
    var phoneEl = document.getElementById('cartCustPhone');
    var addressEl = document.getElementById('cartCustAddress');
    var cityEl = document.getElementById('cartCustCity');
    var stateEl = document.getElementById('cartCustState');
    var pincodeEl = document.getElementById('cartCustPincode');
    var notesEl = document.getElementById('cartCustNotes');

    var name = (nameEl ? nameEl.value : '').trim();
    var email = (emailEl ? emailEl.value : '').trim();
    var phone = (phoneEl ? phoneEl.value : '').trim();
    var address = (addressEl ? addressEl.value : '').trim();
    var city = (cityEl ? cityEl.value : '').trim();
    var state = (stateEl ? stateEl.value : '').trim();
    var pincode = (pincodeEl ? pincodeEl.value : '').trim();
    var notes = (notesEl ? notesEl.value : '').trim();

    // 2. Validate required fields
    var fields = [
      { el: nameEl, val: name, label: 'Full Name' },
      { el: emailEl, val: email, label: 'Email Address' },
      { el: phoneEl, val: phone, label: 'Phone Number' },
      { el: addressEl, val: address, label: 'Delivery Address' },
      { el: cityEl, val: city, label: 'City' },
      { el: stateEl, val: state, label: 'State' },
      { el: pincodeEl, val: pincode, label: 'PIN Code' }
    ];

    var invalidFields = [];
    fields.forEach(function (f) {
      if (f.el) {
        if (!f.val) {
          invalidFields.push(f.label);
          f.el.style.borderColor = '#dc2626';
          f.el.style.backgroundColor = '#fef2f2';
        } else {
          f.el.style.borderColor = '#d1d5db';
          f.el.style.backgroundColor = '#ffffff';
        }
      }
    });

    var errorBox = document.getElementById('cartFormError');
    if (invalidFields.length > 0) {
      if (errorBox) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = '<strong>Validation Error:</strong> Please fill in all required fields: ' + invalidFields.join(', ') + '.';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    } else {
      if (errorBox) {
        errorBox.style.display = 'none';
      }
    }

    // 3. Build WhatsApp Message
    var pricing = calculateCartPricing(normalItems, appliedDiscount);
    var subtotalAmount = pricing.subtotalAfterCombo;
    var packagingFeesAmount = 0;
    var totalAmount = pricing.finalTotal;

    var msgLines = [
      'Hello PINBOARD,',
      '',
      'I would like to place an order request.',
      '',
      'CUSTOMER DETAILS',
      'Name: ' + name,
      'Email: ' + email,
      'Phone: ' + phone,
      '',
      'DELIVERY DETAILS',
      'Address: ' + address,
      'City: ' + city,
      'State: ' + state,
      'PIN Code: ' + pincode,
      '',
      'ORDER DETAILS'
    ];

    normalItems.forEach(function (item, idx) {
      var prod = getFullProduct(item);
      var itemTitle = item.title || (prod ? prod.title : ('Poster #' + (item.id || item.productId)));
      var itemId = item.id || item.productId;
      var qty = Math.max(1, Number(item.quantity) || 1);
      var itemSize = (item.size || 'A4').toUpperCase();
      var unitPrice = (itemSize === 'A6' ? 25 : (Number(item.price) || 60));
      var lineTotal = unitPrice * qty;

      if (idx > 0) {
        msgLines.push('');
      }
      msgLines.push('Product: ' + itemTitle);
      msgLines.push('Product ID: ' + itemId);
      msgLines.push('Quantity: ' + qty);
      msgLines.push('Price: ₹' + lineTotal);
    });

    msgLines.push('');
    msgLines.push('Subtotal: ₹' + subtotalAmount);
    msgLines.push('Packaging Fees: ₹0');
    msgLines.push('Total Amount: ₹' + totalAmount);
    msgLines.push('');
    msgLines.push('Order Notes:');
    msgLines.push(notes ? notes : '');
    msgLines.push('');
    msgLines.push('Please confirm my order request.');

    var fullMessage = msgLines.join('\n');

    var targetPhone = "919342302872";
    if (window.PinboardWhatsApp && window.PinboardWhatsApp.WHATSAPP_ORDER_NUMBER) {
      targetPhone = window.PinboardWhatsApp.WHATSAPP_ORDER_NUMBER;
    }

    var waUrl = "https://wa.me/" + targetPhone + "?text=" + encodeURIComponent(fullMessage);

    try {
      var win = window.open(waUrl, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = waUrl;
      }
    } catch (e) {
      window.location.href = waUrl;
    }

    var authInstance = window.PinboardAuth || window.Auth;
    if (authInstance && typeof authInstance.removeFromCart === 'function') {
      normalItems.forEach(function (item) {
        authInstance.removeFromCart(item.id || item.productId);
      });
    }

    appliedDiscount = 0;
    appliedCouponCode = '';

    renderCartPage();
  }

  // --- FAST SYNCHRONOUS INITIALIZATION ---
  function init() {
    var authInstance = window.PinboardAuth || window.Auth;

    setupCartEventDelegation();

    // 1. INSTANT: Render cart immediately from synchronous local storage state (< 5ms)
    renderCartPage();

    // 2. BACKGROUND: When Firebase auth resolves asynchronously, seamlessly update guest banner
    if (authInstance && typeof authInstance.waitForAuth === 'function') {
      authInstance.waitForAuth().then(function (user) {
        var guestBanner = document.getElementById('cartGuestBanner');
        if (guestBanner) {
          guestBanner.style.display = (user && user.isLoggedIn) ? 'none' : 'flex';
        }
      });
    }

    // 3. REACTIVE: Listen for auth state changes (login / logout)
    window.addEventListener('auth:statechange', function () {
      renderCartPage();
    });

    // 4. CROSS-TAB & GLOBAL: Listen for cart updates from other tabs
    window.addEventListener('auth:cartchange', function (e) {
      // If triggered from outside, re-render
      if (e && e.detail && e.detail.cart) {
        var currentDomCards = document.querySelectorAll('.cart-item-card');
        if (currentDomCards.length !== e.detail.cart.length) {
          renderCartPage();
        } else {
          updateSummaryAndHeaderDOM(e.detail.cart);
        }
      } else {
        renderCartPage();
      }
    });

    // Modal Close buttons
    var modalOverlay = document.getElementById('cartModalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
          modalOverlay.classList.remove('is-active');
          renderCartPage();
        }
      });
    }
  }

  if (typeof window !== 'undefined') {
    window.calculateCartPricing = calculateCartPricing;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

