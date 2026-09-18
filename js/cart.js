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

  function getDeliveryDateString() {
    var d = new Date();
    d.setDate(d.getDate() + 4);
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
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

  /**
   * Authoritative calculation engine for cart subtotal, 3 Posters for ₹150 combo offer, and final totals
   */
  function calculateCartPricing(cart, discountRate) {
    var rate = Number(discountRate) || 0;
    var cartCount = 0;
    var rawSubtotal = 0;
    var standardPosterQty = 0;
    var customSubtotal = 0;

    (cart || []).forEach(function (item) {
      var prod = getFullProduct(item);
      var qty = Number(item.quantity) || 1;
      cartCount += qty;

      if (item.isCustom) {
        var cPrice = Number(item.price) || 1499;
        customSubtotal += cPrice * qty;
        rawSubtotal += cPrice * qty;
      } else {
        var price = 60;
        standardPosterQty += qty;
        rawSubtotal += price * qty;
      }
    });

    // Combo Offer: 3 Posters for ₹150 (₹30 savings per 3 posters)
    var comboSets = Math.floor(standardPosterQty / 3);
    var comboSavings = comboSets * 30;
    var subtotalAfterCombo = Math.max(0, rawSubtotal - comboSavings);
    var promoDiscountAmount = Math.round(subtotalAfterCombo * rate);
    var finalTotal = Math.max(0, subtotalAfterCombo - promoDiscountAmount);

    return {
      cartCount: cartCount,
      standardPosterQty: standardPosterQty,
      comboSets: comboSets,
      comboSavings: comboSavings,
      rawSubtotal: rawSubtotal,
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
    if (subtotalLabelEl) subtotalLabelEl.textContent = 'Subtotal (' + pricing.cartCount + (pricing.cartCount === 1 ? ' item' : ' items') + ')';

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

    cart.forEach(function (item) {
      var prod = getFullProduct(item);
      var id = item.id || item.productId;
      var title = item.title || (prod ? prod.title : 'Premium Poster #' + id);
      var category = (prod && (prod.category || prod.collection)) ? (prod.category || prod.collection) : 'Curated Poster';
      var price = item.isCustom ? (Number(item.price) || 1499) : 60;
      var regPrice = item.isCustom ? (price + 500) : 99;
      var qty = Number(item.quantity) || 1;
      var lineTotal = price * qty;

      var rawImg = item.image || (prod && prod.images && prod.images[0] ? prod.images[0] : 'New Project 22 [FA6B4A7].png');
      var optThumb = (window.PinboardRouter && typeof window.PinboardRouter.getOptimizedImageUrl === 'function')
        ? window.PinboardRouter.getOptimizedImageUrl(rawImg, true)
        : rawImg;

      itemsHtml +=
        '<div class="cart-item-card" data-product-id="' + escapeHtml(id) + '">' +
          '<div class="cart-thumb-wrap">' +
            '<a href="product.html?id=' + encodeURIComponent(id) + '">' +
              '<img src="' + escapeHtml(optThumb) + '" alt="' + escapeHtml(title) + '" class="cart-poster-img" loading="lazy" decoding="async" width="100" height="140" onerror="this.onerror=null;this.src=\'' + escapeHtml(rawImg) + '\'" />' +
            '</a>' +
          '</div>' +
          '<div class="cart-item-details">' +
            '<span class="cart-item-category mono">' + escapeHtml(category) + '</span>' +
            '<a href="product.html?id=' + encodeURIComponent(id) + '" class="cart-item-title display">' +
              escapeHtml(title) +
            '</a>' +
            '<div class="cart-item-specs mono">' +
              '<span>A3 (29.7 &times; 42 cm)</span>' +
              '<span class="cart-subtitle-dot"></span>' +
              '<span>300 GSM Archival Matte</span>' +
            '</div>' +
            '<div class="cart-item-price-row">' +
              '<span class="cart-item-price">' + formatCurrency(price) + '</span>' +
              (regPrice && regPrice > price ? '<span class="cart-item-original-price">' + formatCurrency(regPrice) + '</span>' : '') +
            '</div>' +
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

    var deliveryEstimate = getDeliveryDateString();

    var summaryHtml =
      '<div class="cart-summary-card">' +
        '<div class="cart-summary-head">' +
          '<span class="cart-summary-tag mono">SUMMARY</span>' +
          '<h3 class="cart-summary-title display">ORDER TOTAL</h3>' +
        '</div>' +
        '<div class="cart-combo-tip" id="cartComboOfferTip" style="' + ((pricing.standardPosterQty > 0) ? 'display:block;margin-bottom:12px;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:12px;color:#dc2626;' : 'display:none;margin-bottom:12px;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:12px;color:#dc2626;') + '">' +
          (pricing.comboSets > 0
            ? '🎉 <strong>Combo Applied:</strong> 3 Posters for ₹150 offer active!'
            : (pricing.standardPosterQty > 0 && pricing.standardPosterQty < 3
                ? '⚡ <strong>Offer:</strong> Add ' + (3 - pricing.standardPosterQty) + ' more poster' + (3 - pricing.standardPosterQty > 1 ? 's' : '') + ' to get 3 Posters for ₹150!'
                : '')) +
        '</div>' +
        '<div class="cart-summary-rows">' +
          '<div class="cart-summary-row">' +
            '<span id="cartSummarySubtotalLabel">Subtotal (' + pricing.cartCount + (pricing.cartCount === 1 ? ' item' : ' items') + ')</span>' +
            '<span class="val" id="cartSummarySubtotalVal">' + formatCurrency(pricing.rawSubtotal) + '</span>' +
          '</div>' +
          '<div class="cart-summary-row" id="cartSummaryComboRow" style="' + (pricing.comboSets > 0 ? 'display:flex;color:#108A44;font-weight:600;' : 'display:none;color:#108A44;font-weight:600;') + '">' +
            '<span class="combo-label">3 Posters for ₹150 Combo</span>' +
            '<span class="val" style="color:#108A44;">&minus;' + formatCurrency(pricing.comboSavings) + '</span>' +
          '</div>' +
          '<div class="cart-summary-row" id="cartSummaryDiscountRow" style="' + (pricing.promoDiscountAmount > 0 ? 'display:flex;color:#108A44;' : 'display:none;color:#108A44;') + '">' +
            '<span class="disc-label">Promo Discount (' + Math.round(appliedDiscount * 100) + '%)</span>' +
            '<span class="val" style="color:#108A44;">&minus;' + formatCurrency(pricing.promoDiscountAmount) + '</span>' +
          '</div>' +
          '<div class="cart-summary-row">' +
            '<span>Express Delivery</span>' +
            '<span class="cart-free-tag mono">FREE</span>' +
          '</div>' +
          '<div class="cart-summary-row">' +
            '<span>Archival Hard-Tube Packaging</span>' +
            '<span class="cart-free-tag mono">FREE</span>' +
          '</div>' +
          '<div class="cart-summary-row">' +
            '<span>Est. Delivery</span>' +
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
        '<div class="cart-coupon-box">' +
          '<input type="text" class="cart-coupon-input" id="cartCouponInput" placeholder="PROMO CODE (e.g. PINBOARD10)" value="' + escapeHtml(appliedCouponCode) + '" />' +
          '<button type="button" class="cart-coupon-btn" id="btnApplyCoupon">' + (appliedDiscount > 0 ? 'APPLIED ✓' : 'APPLY') + '</button>' +
        '</div>' +
        '<div class="cart-coupon-msg ' + (appliedDiscount > 0 ? 'success' : '') + '" id="cartCouponMsg">' +
          (appliedDiscount > 0 ? '✨ Promo code ' + escapeHtml(appliedCouponCode) + ' applied! (' + Math.round(appliedDiscount * 100) + '% Off)' : '') +
        '</div>' +
        '<button type="button" class="cart-checkout-btn" id="btnCartCheckout">' +
          '<span>PROCEED TO CHECKOUT</span>' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="5" y1="12" x2="19" y2="12"></line>' +
            '<polyline points="12 5 19 12 12 19"></polyline>' +
          '</svg>' +
        '</button>' +
        '<div class="cart-trust-badges">' +
          '<div class="cart-trust-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' +
            '<span>Archival 300 GSM Matte Paper with 100-Year Ink</span>' +
          '</div>' +
          '<div class="cart-trust-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>' +
            '<span>Reinforced Crush-Proof Hard Tube Packaging</span>' +
          '</div>' +
          '<div class="cart-trust-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
            '<span>7-Day Replacement Guarantee if Damaged</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    cartContainer.innerHTML =
      '<div class="cart-layout-grid">' +
        '<div class="cart-items-container" id="cartItemsList">' +
          itemsHtml +
        '</div>' +
        '<aside class="cart-summary-column">' +
          summaryHtml +
        '</aside>' +
      '</div>';

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

          // Targeted DOM Update: update only this card's qty and total
          var qtyEl = document.getElementById('cartQtyValue_' + pidPlus);
          var totalEl = document.getElementById('cartItemTotal_' + pidPlus);
          var price = (itemPlus && itemPlus.isCustom) ? (Number(itemPlus.price) || 1499) : 60;

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

          // Targeted DOM Update
          var qtyElMinus = document.getElementById('cartQtyValue_' + pidMinus);
          var totalElMinus = document.getElementById('cartItemTotal_' + pidMinus);
          var priceMinus = (itemMinus && itemMinus.isCustom) ? (Number(itemMinus.price) || 1499) : 60;

          if (qtyElMinus) qtyElMinus.textContent = newQtyMinus;
          if (totalElMinus) totalElMinus.textContent = formatCurrency(priceMinus * newQtyMinus);

          updateSummaryAndHeaderDOM(updatedCartMinus);
        } else if (currentQtyMinus === 1) {
          // Remove item with smooth animation
          var cardMinus = minusBtn.closest('.cart-item-card');
          if (cardMinus) {
            cardMinus.classList.add('is-removing');
            setTimeout(function () {
              var remainingCart = authInstance.removeFromCart(pidMinus);
              if (cardMinus.parentNode) cardMinus.parentNode.removeChild(cardMinus);
              if (!remainingCart || remainingCart.length === 0) {
                renderCartPage();
              } else {
                updateSummaryAndHeaderDOM(remainingCart);
              }
            }, 200);
          } else {
            var remCart = authInstance.removeFromCart(pidMinus);
            if (!remCart || remCart.length === 0) {
              renderCartPage();
            } else {
              updateSummaryAndHeaderDOM(remCart);
            }
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
            if (!rem || rem.length === 0) {
              renderCartPage();
            } else {
              updateSummaryAndHeaderDOM(rem);
            }
          }, 200);
        } else {
          var rem2 = authInstance.removeFromCart(pidRemove);
          if (!rem2 || rem2.length === 0) {
            renderCartPage();
          } else {
            updateSummaryAndHeaderDOM(rem2);
          }
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

      // 5. Checkout Button
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

  // --- CHECKOUT LOGIC & CONFIRMATION MODAL ---
  function handleCheckout(cart, total) {
    var authInstance = window.PinboardAuth || window.Auth;
    var user = authInstance ? authInstance.getUser() : null;

    if (!user || !user.isLoggedIn) {
      if (authInstance && typeof authInstance.setPendingAction === 'function') {
        authInstance.setPendingAction({
          action: 'checkout',
          returnUrl: 'cart.html'
        });
      }
      window.location.href = 'account.html?redirect=cart.html';
      return;
    }

    var lastOrder = null;
    cart.forEach(function (item) {
      if (authInstance && typeof authInstance.createOrder === 'function') {
        lastOrder = authInstance.createOrder(item.id || item.productId, item.quantity || 1);
      }
    });

    if (authInstance && typeof authInstance.clearCart === 'function') {
      authInstance.clearCart();
    }

    // Show Confirmation Modal
    var orderId = lastOrder ? lastOrder.orderId : ('PB-2026-' + Math.floor(1000 + Math.random() * 9000));
    var modalOverlay = document.getElementById('cartModalOverlay');
    var modalOrderId = document.getElementById('cartModalOrderId');

    if (modalOrderId) {
      modalOrderId.textContent = 'ORDER #' + orderId;
    }
    if (modalOverlay) {
      modalOverlay.classList.add('is-active');
    }

    appliedDiscount = 0;
    appliedCouponCode = '';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

