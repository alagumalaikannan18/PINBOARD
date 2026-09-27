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
    A6: { code: 'A6', name: 'Small', dim: '105 × 148 mm', salePrice: 25, regularPrice: 49 },
    A4: { code: 'A4', name: 'Standard', dim: '210 × 297 mm', salePrice: 60, regularPrice: 99 }
  };

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

    if (typeof PinboardSEO !== 'undefined' && typeof PinboardSEO.injectPageSEO === 'function') {
      try {
        PinboardSEO.injectPageSEO('product', { product: product });
      } catch (e) {}
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

    function computeSizePrice(sizeKey) {
      var spec = SIZE_SPECS[sizeKey] || SIZE_SPECS.A4;
      return spec.salePrice;
    }

    function computeSizeRegularPrice(sizeKey) {
      var spec = SIZE_SPECS[sizeKey] || SIZE_SPECS.A4;
      return spec.regularPrice;
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

    // 4. Rating Row (Managed dynamically from real user reviews)


    // --- Gallery & Imagery (STRICT ISOLATION & DEDUPLICATION) ---
    var mainImg = document.getElementById('pdpMainImg');
    var thumbsContainer = document.getElementById('pdpThumbs');
    
    var _pc = window.PinboardPosterConfig;
    var _ph = _pc ? _pc.getPlaceholder(false) : '';
    var _phThumb = _pc ? _pc.getPlaceholder(true) : '';
    var rawImages = (product.images && Array.isArray(product.images) && product.images.length > 0)
      ? product.images.filter(function(img) {
          return _pc ? (_pc.POSTER_ROOT && typeof img === 'string' && img.indexOf(_pc.POSTER_ROOT) === 0) : false;
        })
      : [];

    // Strict deduplication by base filename to prevent duplicate previews/thumbnails
    var seenKeys = new Set();
    var images = [];
    rawImages.forEach(function (imgSrc) {
      if (!imgSrc || typeof imgSrc !== 'string') return;
      var baseKey = imgSrc.replace(/^.*[\\\/]/, '').replace(/\.[^.]+$/, '').toLowerCase();
      if (!seenKeys.has(baseKey)) {
        seenKeys.add(baseKey);
        images.push(imgSrc);
      }
    });
    // No fallback to old posters — leave empty for placeholder

    var getOptImg = (router && typeof router.getOptimizedImageUrl === 'function')
      ? router.getOptimizedImageUrl.bind(router)
      : function (s) { return s; };

    if (mainImg) {
      var fullWebP = images.length > 0 ? getOptImg(images[0], false) : _ph;
      mainImg.src = fullWebP;
      mainImg.onerror = function () {
        this.onerror = null;
        this.src = _ph;
      };
      mainImg.alt = product.title;
    }

    // Only render thumbnails if THIS product genuinely has multiple authentic unique images
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
    var comboBannerEl = document.getElementById('pdpComboBanner');

    function updatePrintSpecifications() {
      var specsEl = document.getElementById('pdpSpecs');
      if (!specsEl) return;

      var spec = SIZE_SPECS[selectedSize] || SIZE_SPECS.A4;
      var activeSizeStr = spec.code + ' (' + spec.dim + ')';
      var prodSpecs = product.specifications || {};

      var specsData = {
        'Size': activeSizeStr,
        'Material': prodSpecs['Material'] || prodSpecs['Stock'] || '300 GSM Museum-Grade Fine Art Sheet',
        'Finish': prodSpecs['Finish'] || 'Smooth Matte Archival Finish',
        'Pieces': (product.pieces || 1).toString(),
        'Frame': prodSpecs['Frame'] || 'Not Included',
        'Packaging': prodSpecs['Packaging'] || 'Rigid tube, flat-packed'
      };

      var shtml = '';
      var keys = ['Size', 'Material', 'Finish', 'Pieces', 'Frame', 'Packaging'];
      keys.forEach(function (k) {
        shtml += '<tr><td>' + k + '</td><td>' + specsData[k] + '</td></tr>';
      });

      specsEl.innerHTML = shtml;
    }

    function updateArtworkFeatures() {
      var featEl = document.getElementById('pdpFeatures');
      if (!featEl) return;

      var baseFeatures = (product.features && Array.isArray(product.features) && product.features.length > 0)
        ? product.features.slice()
        : [
            "Archival-grade giclée print with deep blacks and rich tones",
            "Heavyweight 300 GSM premium matte art paper",
            "Anti-glare surface ideal for all indoor lighting conditions",
            "Packed flat in reinforced protective packaging with moisture barrier"
          ];

      var filteredFeatures = baseFeatures.filter(function (f) {
        if (typeof f !== 'string') return false;
        var lower = f.toLowerCase();
        return !lower.includes('ready to pin') &&
               !lower.includes('magnetic-hang') &&
               !lower.includes('poster format depends on');
      });

      var isComboOrSplit = Boolean(
        (product.pieces && product.pieces > 1) ||
        (product.title && /combo|split|set|pack/i.test(product.title)) ||
        (product.subtitle && /combo|split|set|pack/i.test(product.subtitle)) ||
        (product.category && /combo|split/i.test(product.category))
      );

      var dynamicBullet = '';
      if (isComboOrSplit) {
        dynamicBullet = 'Split/combo posters are printed without a white border.';
      } else if (selectedSize === 'A6') {
        dynamicBullet = 'A6 posters are printed without a white border.';
      } else if (selectedSize === 'A4') {
        dynamicBullet = 'A4 posters include a clean white border.';
      } else {
        dynamicBullet = 'Poster format depends on the selected size: A4 posters include a clean white border, split/combo posters are printed without a border, and A6 posters are printed without a border.';
      }

      filteredFeatures.push(dynamicBullet);

      var fhtml = '';
      filteredFeatures.forEach(function (f) {
        fhtml += '<div class="pdp-feature-row"><span class="pdp-feature-dot"></span><span>' + f + '</span></div>';
      });
      featEl.innerHTML = fhtml;
    }

    function updatePriceDisplay() {
      var activeSale = computeSizePrice(selectedSize);
      var activeRegular = computeSizeRegularPrice(selectedSize);

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

      if (comboBannerEl) {
        if (selectedSize === 'A6') {
          comboBannerEl.style.display = 'none';
        } else {
          comboBannerEl.style.display = 'inline-flex';
        }
      }

      updatePrintSpecifications();
      updateArtworkFeatures();
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
        var unitPrice = computeSizePrice(selectedSize);
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

    // --- BUY NOW & ORDER REQUEST MODAL ---
    var orderModal = document.getElementById('orderRequestModal');
    var orderSuccessModal = document.getElementById('orderSuccessModal');
    var closeOrderBtn = document.getElementById('closeOrderModal');
    var orderForm = document.getElementById('orderRequestForm');
    var submitOrderBtn = document.getElementById('submitOrderBtn');
    var orderFormError = document.getElementById('orderFormError');

    function hideOrderModals() {
      if (orderModal) orderModal.style.display = 'none';
      if (orderSuccessModal) orderSuccessModal.style.display = 'none';
    }

    if (closeOrderBtn) {
      closeOrderBtn.addEventListener('click', hideOrderModals);
    }

    if (orderModal) {
      orderModal.addEventListener('click', function (e) {
        if (e.target === orderModal) hideOrderModals();
      });
    }

    if (orderSuccessModal) {
      orderSuccessModal.addEventListener('click', function (e) {
        if (e.target === orderSuccessModal) hideOrderModals();
      });
    }

    function openOrderModal(activePid) {
      if (!orderModal) return;
      var unitPrice = computeSizePrice(selectedSize);
      var totalAmount = 0;
      if (selectedSize === 'A6') {
        totalAmount = 25 * currentQty;
      } else {
        totalAmount = (Math.floor(currentQty / 3) * 150) + ((currentQty % 3) * 60);
      }

      var imgEl = document.getElementById('orderModalItemImg');
      if (imgEl) imgEl.src = (_pc && _pc.hasValidPoster(product)) ? product.images[0] : _ph;

      var titleEl = document.getElementById('orderModalItemTitle');
      if (titleEl) titleEl.textContent = product.title || 'Premium Art Poster';

      var sizeEl = document.getElementById('orderModalItemSize');
      if (sizeEl) sizeEl.textContent = 'Size: ' + selectedSize;

      var qtyEl = document.getElementById('orderModalItemQty');
      if (qtyEl) qtyEl.textContent = 'Qty: ' + currentQty;

      var priceEl = document.getElementById('orderModalItemPrice');
      if (priceEl) priceEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');

      var subtotalEl = document.getElementById('orderModalSubtotal');
      if (subtotalEl) subtotalEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');

      var finalTotalEl = document.getElementById('orderModalFinalTotal');
      if (finalTotalEl) finalTotalEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');

      // Autofill logged-in user info if available
      if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
        var user = window.Auth.getCurrentUser();
        if (user) {
          var nameInput = document.getElementById('orderCustName');
          if (nameInput && !nameInput.value && user.name) nameInput.value = user.name;
          var emailInput = document.getElementById('orderCustEmail');
          if (emailInput && !emailInput.value && user.email) emailInput.value = user.email;
        }
      }

      if (orderFormError) orderFormError.style.display = 'none';
      orderModal.style.display = 'flex';
    }

    var handleBuyClick = function (e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      var activePid = (buyBtn && buyBtn.dataset.productId) || productId;

      checkAuthAndProceed('buy', function () {
        openOrderModal(activePid);
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

    // Auto-open modal if returning from login redirect with auto=buy
    if (window.location.search.indexOf('auto=buy') !== -1) {
      checkAuthAndProceed('buy', function () {
        openOrderModal(productId);
      });
    }

    // --- FORM SUBMISSION ---
    if (orderForm) {
      orderForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var nameVal = (document.getElementById('orderCustName').value || '').trim();
        var emailVal = (document.getElementById('orderCustEmail').value || '').trim();
        var phoneVal = (document.getElementById('orderCustPhone').value || '').trim();
        var addressVal = (document.getElementById('orderCustAddress').value || '').trim();
        var cityVal = (document.getElementById('orderCustCity').value || '').trim();
        var stateVal = (document.getElementById('orderCustState').value || '').trim();
        var pincodeVal = (document.getElementById('orderCustPincode').value || '').trim();
        var notesVal = (document.getElementById('orderCustNotes').value || '').trim();

        // Form Validation
        if (!nameVal || !emailVal || !phoneVal || !addressVal || !cityVal || !stateVal || !pincodeVal) {
          if (orderFormError) {
            orderFormError.textContent = 'Please fill in all required fields marked with *';
            orderFormError.style.display = 'block';
          }
          return;
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          if (orderFormError) {
            orderFormError.textContent = 'Please enter a valid email address (e.g. name@gmail.com)';
            orderFormError.style.display = 'block';
          }
          return;
        }

        var phoneClean = phoneVal.replace(/[^0-9+]/g, '');
        if (phoneClean.length < 8) {
          if (orderFormError) {
            orderFormError.textContent = 'Please enter a valid phone number';
            orderFormError.style.display = 'block';
          }
          return;
        }

        if (orderFormError) orderFormError.style.display = 'none';
        if (submitOrderBtn) {
          submitOrderBtn.disabled = true;
          submitOrderBtn.innerHTML = '<span>Submitting Order Request...</span>';
        }

        var activePid = (buyBtn && buyBtn.dataset.productId) || productId;
        var unitPrice = computeSizePrice(selectedSize);
        var totalAmount = (selectedSize === 'A6')
          ? (25 * currentQty)
          : ((Math.floor(currentQty / 3) * 150) + ((currentQty % 3) * 60));

        var currentProductTitle = (product && product.title) ? product.title : 'Premium Art Poster';

        var orderData = {
          items: [{
            id: activePid,
            title: currentProductTitle,
            size: selectedSize,
            quantity: currentQty,
            unitPrice: unitPrice,
            total: totalAmount
          }],
          customer: {
            name: nameVal,
            email: emailVal,
            phone: phoneVal,
            address: addressVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
            notes: notesVal
          },
          grandTotal: totalAmount
        };

        if (window.Auth && typeof window.Auth.createOrder === 'function') {
          window.Auth.createOrder(activePid, currentQty);
        }

        // Open WhatsApp ONLY AFTER SUCCESSFUL FORM SUBMISSION
        if (typeof window.openWhatsAppOrderForAllRecipients === 'function') {
          window.openWhatsAppOrderForAllRecipients(orderData);
        }

        var payload = {
          productId: activePid,
          size: selectedSize,
          quantity: currentQty,
          unitPrice: unitPrice,
          customerName: nameVal,
          customerEmail: emailVal,
          customerPhone: phoneVal,
          shippingAddress: {
            street: addressVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal
          },
          orderNotes: notesVal,
          isRequest: true
        };

        fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (submitOrderBtn) {
              submitOrderBtn.disabled = false;
              submitOrderBtn.innerHTML = '<span>Submit Order Request &rarr;</span>';
            }
            if (data.success && data.data) {
              if (orderModal) orderModal.style.display = 'none';
              var successIdEl = document.getElementById('successOrderIdDisplay');
              if (successIdEl) successIdEl.textContent = '#' + (data.data.orderId || 'PB-2026-REQUEST');
              if (orderSuccessModal) orderSuccessModal.style.display = 'flex';
            } else {
              if (orderModal) orderModal.style.display = 'none';
              if (orderSuccessModal) orderSuccessModal.style.display = 'flex';
            }
          })
          .catch(function (err) {
            if (submitOrderBtn) {
              submitOrderBtn.disabled = false;
              submitOrderBtn.innerHTML = '<span>Submit Order Request &rarr;</span>';
            }
            if (orderModal) orderModal.style.display = 'none';
            if (orderSuccessModal) orderSuccessModal.style.display = 'flex';
          });
      });
    }

    // --- CONTENT: STORY & SPECIFICATIONS ---
    var descEl = document.getElementById('pdpDesc');
    if (descEl) descEl.textContent = product.description || 'Premium archival art print created for high-definition visual impact.';

    var featEl = document.getElementById('pdpFeatures');
    if (featEl) {
      updateArtworkFeatures();
    }

    var specsEl = document.getElementById('pdpSpecs');
    if (specsEl) {
      updatePrintSpecifications();
    }

    // --- RELATED POSTERS SECTION ---
    var relatedGrid = document.getElementById('pdpRelatedGrid');
    if (relatedGrid) {
      var items = [];
      var rawIds = product.relatedIds || [1, 2, 3, 4, 5, 6, 7, 8];

      // 1. Gather explicitly assigned related items
      rawIds.forEach(function (rid) {
        if (rid === productId) return;
        var rp = lookupFn(rid);
        if (rp && !items.some(function (it) { return it.id === rp.id; })) {
          items.push(rp);
        }
      });

      // 2. Supplement from global product catalog if needed to reach up to 6 or 8 products
      var allProds = (window.PINBOARD_PRODUCTS && Array.isArray(window.PINBOARD_PRODUCTS)) ? window.PINBOARD_PRODUCTS : [];
      if (items.length < 6 && allProds.length > 0) {
        var pCat = (product.category || '').toLowerCase();
        // Category matching first
        allProds.forEach(function (rp) {
          if (items.length >= 8) return;
          if (rp.id === productId) return;
          if (pCat && (rp.category || '').toLowerCase() === pCat) {
            if (!items.some(function (it) { return it.id === rp.id; })) {
              items.push(rp);
            }
          }
        });
        // Catalog fallback
        allProds.forEach(function (rp) {
          if (items.length >= 8) return;
          if (rp.id === productId) return;
          if (!items.some(function (it) { return it.id === rp.id; })) {
            items.push(rp);
          }
        });
      }

      // Deduplicate items globally before sizing & rendering
      if (window.PinboardSearch && typeof window.PinboardSearch.deduplicateProducts === 'function') {
        items = window.PinboardSearch.deduplicateProducts(items).filter(function (it) { return it.id !== productId; });
      }

      // 3. Ensure even count (e.g., 4, 6, or 8) so 2-column mobile grid has no empty trailing slot
      if (items.length > 4 && items.length % 2 !== 0) {
        items.pop();
      } else if (items.length === 3 && allProds.length > 0) {
        var extra = allProds.find(function (rp) {
          return rp.id !== productId && !items.some(function (it) { return it.id === rp.id; });
        });
        if (extra) items.push(extra);
      }

      var rhtml = '';
      items.forEach(function (rp) {
        var rPrice = rp.salePrice || rp.regularPrice || 60;
        var rImg = (_pc && _pc.hasValidPoster(rp)) ? rp.images[0] : '';
        var rThumb = rImg ? getOptImg(rImg, true) : _phThumb;
        rhtml += '<a class="pdp-related-card" href="product.html?id=' + rp.id + '">';
        rhtml += '<div class="pdp-related-card-img"><img src="' + rThumb + '" alt="' + rp.title + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + (_phThumb) + '\'" /></div>';
        rhtml += '<div class="pdp-related-card-name">' + rp.title + '</div>';
        rhtml += '<div class="pdp-related-card-price">Rs. ' + rPrice.toLocaleString() + '.00</div>';
        rhtml += '</a>';
      });
      relatedGrid.innerHTML = rhtml;
    }

    // --- REAL DATABASE PRODUCT REVIEW SYSTEM ---
    function initProductReviewSystem() {
      var currentUserReview = null;

      function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (m) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
      }

      function updateReviewSummaryUI(userReviews) {
        var totalReviewsCount = Array.isArray(userReviews) ? userReviews.length : 0;

        var avgRatingStr = '0.0';
        var fullStars = '';
        var emptyStars = '☆☆☆☆☆';
        var countText = 'No reviews yet';

        if (totalReviewsCount > 0) {
          var sumRatings = 0;
          userReviews.forEach(function (r) {
            sumRatings += (Number(r.rating) || 0);
          });
          var calcAvg = sumRatings / totalReviewsCount;
          avgRatingStr = calcAvg.toFixed(1);

          var rounded = Math.round(calcAvg);
          fullStars = '★'.repeat(Math.min(5, Math.max(1, rounded)));
          emptyStars = '☆'.repeat(5 - Math.min(5, Math.max(1, rounded)));
          countText = totalReviewsCount === 1 ? '1 review' : totalReviewsCount + ' reviews';
        }

        // 1. Update Header Rating Row
        var headerScoreEl = document.getElementById('pdpRatingScore');
        if (headerScoreEl) headerScoreEl.textContent = avgRatingStr;

        var headerStarsEl = document.getElementById('pdpRatingStarsHeader');
        if (headerStarsEl) headerStarsEl.textContent = fullStars + emptyStars;

        var headerCountEl = document.getElementById('pdpReviewCount');
        if (headerCountEl) headerCountEl.textContent = countText;

        // 2. Update Section Below BUY NOW
        var scoreEl = document.getElementById('pdpReviewScore');
        if (scoreEl) scoreEl.textContent = avgRatingStr;

        var countBadgeEl = document.getElementById('pdpReviewCountBadge');
        if (countBadgeEl) countBadgeEl.textContent = countText;

        var starsEl = document.getElementById('pdpReviewStars');
        if (starsEl) starsEl.textContent = fullStars + emptyStars;

        // 3. Check if active user already reviewed this product
        currentUserReview = null;
        var currentUser = window.Auth && typeof window.Auth.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null;
        if (currentUser && currentUser.isLoggedIn && Array.isArray(userReviews)) {
          var activeUid = String(currentUser.uid || currentUser.id || '').trim();
          if (activeUid) {
            currentUserReview = userReviews.find(function (r) {
              return String(r.userId || '').trim() === activeUid;
            }) || null;
          }
        }

        // Update Review Action Button Text based on existing review
        var openBtn = document.getElementById('pdpOpenReviewModalBtn');
        if (openBtn) {
          openBtn.textContent = currentUserReview ? 'Edit Your Review' : 'Write a Review';
        }

        var submitBtnSpan = (typeof document !== 'undefined' && typeof document.querySelector === 'function') ? document.querySelector('#submitReviewBtn span') : document.getElementById('submitReviewBtn');
        if (submitBtnSpan) {
          submitBtnSpan.textContent = currentUserReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW';
        }

        // 4. Render preview list of database reviews
        var previewListEl = document.getElementById('pdpReviewsPreviewList');
        if (previewListEl) {
          if (totalReviewsCount === 0) {
            previewListEl.innerHTML = '<p style="color:rgba(17,17,17,0.5);font-size:13px;padding:12px 0;">No reviews yet. Be the first to review this poster.</p>';
          } else {
            var html = '';
            userReviews.forEach(function (r) {
              var rRating = Math.min(5, Math.max(1, Number(r.rating) || 5));
              var rStars = '★'.repeat(rRating) + '☆'.repeat(5 - rRating);
              var authorName = escapeHtml(r.userName || r.author || 'Verified Buyer');
              var reviewContent = escapeHtml(r.text || r.reviewText || '');

              html += '<div class="pdp-review-card-item">';
              html += '  <div class="pdp-review-card-header">';
              html += '    <span class="pdp-review-card-author">' + authorName + '</span>';
              html += '    <span class="pdp-review-card-stars">' + rStars + '</span>';
              html += '  </div>';
              html += '  <p class="pdp-review-card-text">' + reviewContent + '</p>';
              html += '  <div class="pdp-review-card-date">Verified Buyer</div>';
              html += '</div>';
            });
            previewListEl.innerHTML = html;
          }
        }
      }

      function fetchAndRenderReviews() {
        var service = window.PinboardReviews;
        if (service && typeof service.getReviewsForProduct === 'function') {
          service.getReviewsForProduct(productId).then(function (revs) {
            updateReviewSummaryUI(revs);
          }).catch(function () {
            fallbackFetch();
          });
        } else {
          fallbackFetch();
        }
      }

      function fallbackFetch() {
        if (typeof fetch === 'function') {
          fetch('/api/products/' + String(productId) + '/reviews')
            .then(function (res) {
              if (!res.ok) throw new Error('HTTP ' + res.status);
              return res.json();
            })
            .then(function (data) {
              if (data && data.success && Array.isArray(data.reviews)) {
                updateReviewSummaryUI(data.reviews);
              } else {
                updateReviewSummaryUI([]);
              }
            })
            .catch(function () {
              updateReviewSummaryUI([]);
            });
        } else {
          updateReviewSummaryUI([]);
        }
      }

      fetchAndRenderReviews();

      // Listen for auth state changes to refresh review ownership state
      window.addEventListener('auth:statechange', function () {
        fetchAndRenderReviews();
      });

      // --- MODAL & AUTH CONTROLS ---
      var reviewModal = document.getElementById('reviewModal');
      var openModalBtn = document.getElementById('pdpOpenReviewModalBtn');
      var closeModalBtn = document.getElementById('closeReviewModal');
      var reviewForm = document.getElementById('pdpReviewForm');
      var starBtns = document.querySelectorAll('#reviewStarRating .star-btn');
      var ratingHiddenInput = document.getElementById('reviewRatingVal');
      var formError = document.getElementById('reviewFormError');
      var formSuccess = document.getElementById('reviewFormSuccess');
      var submitBtn = document.getElementById('submitReviewBtn');

      var selectedStarRating = 0;

      function setStarRating(val) {
        selectedStarRating = val;
        if (ratingHiddenInput) ratingHiddenInput.value = val;
        starBtns.forEach(function (btn) {
          var btnVal = Number(btn.getAttribute('data-value'));
          if (btnVal <= val) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }

      starBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = Number(btn.getAttribute('data-value'));
          setStarRating(val);
        });

        btn.addEventListener('mouseenter', function () {
          var hoverVal = Number(btn.getAttribute('data-value'));
          starBtns.forEach(function (b) {
            var bVal = Number(b.getAttribute('data-value'));
            if (bVal <= hoverVal) {
              b.classList.add('hover');
            } else {
              b.classList.remove('hover');
            }
          });
        });
      });

      var starContainer = document.getElementById('reviewStarRating');
      if (starContainer) {
        starContainer.addEventListener('mouseleave', function () {
          starBtns.forEach(function (b) { b.classList.remove('hover'); });
        });
      }

      function showAuthPromptForReview() {
        var promptEl = document.getElementById('pdpAuthPrompt');
        if (promptEl) {
          promptEl.innerHTML =
            '<div style="background:#fff3cd;border:1px solid #ffeeba;color:#856404;padding:12px 16px;border-radius:6px;margin-top:16px;display:flex;justify-content:space-between;align-items:center;">' +
              '<span>Please log in to write a review.</span>' +
              '<a href="account.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search) + '" style="background:#111;color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12.5px;font-weight:700;">Login Now</a>' +
            '</div>';
          promptEl.style.display = 'block';
          promptEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert('Please log in to write a review.');
          window.location.href = 'account.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }
      }

      function openReviewModal(user) {
        if (!reviewModal) return;

        var modalTitleEl = document.getElementById('reviewModalProductTitle');

        function getSubmitBtnSpan() {
          if (typeof document === 'undefined') return null;
          if (typeof document.querySelector === 'function') {
            return document.querySelector('#submitReviewBtn span');
          }
          return document.getElementById('submitReviewBtn');
        }

        if (currentUserReview) {
          if (modalTitleEl) modalTitleEl.textContent = 'Update your review for ' + (product.title || 'this poster');
          var btnSpanUpdate = getSubmitBtnSpan();
          if (btnSpanUpdate) btnSpanUpdate.textContent = 'UPDATE REVIEW';

          setStarRating(Number(currentUserReview.rating) || 5);
          var textInput = document.getElementById('reviewText');
          if (textInput) textInput.value = currentUserReview.text || currentUserReview.reviewText || '';
          var nameInput = document.getElementById('reviewAuthorName');
          if (nameInput) nameInput.value = currentUserReview.userName || (user ? user.name : '');
        } else {
          if (modalTitleEl) modalTitleEl.textContent = 'Share your feedback for ' + (product.title || 'this poster');
          var btnSpanSubmit = getSubmitBtnSpan();
          if (btnSpanSubmit) btnSpanSubmit.textContent = 'SUBMIT REVIEW';

          setStarRating(5);
          var textInputClean = document.getElementById('reviewText');
          if (textInputClean) textInputClean.value = '';
          var nameInputClean = document.getElementById('reviewAuthorName');
          if (nameInputClean && user && user.name) nameInputClean.value = user.name;
        }

        if (formError) formError.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;

        reviewModal.style.display = 'flex';
      }

      function closeReviewModal() {
        if (reviewModal) reviewModal.style.display = 'none';
      }

      if (openModalBtn) {
        openModalBtn.addEventListener('click', function () {
          var checkAuth = function (user) {
            if (user && user.isLoggedIn) {
              openReviewModal(user);
            } else {
              showAuthPromptForReview();
            }
          };

          if (window.Auth && typeof window.Auth.waitForAuth === 'function') {
            window.Auth.waitForAuth().then(checkAuth);
          } else if (window.Auth && typeof window.Auth.isLoggedIn === 'function') {
            checkAuth(window.Auth.isLoggedIn() ? window.Auth.getCurrentUser() : null);
          } else {
            showAuthPromptForReview();
          }
        });
      }

      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeReviewModal);
      }

      if (reviewModal) {
        reviewModal.addEventListener('click', function (e) {
          if (e.target === reviewModal) closeReviewModal();
        });
      }

      if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
          e.preventDefault();

          var processSubmission = function (user) {
            if (!user || !user.isLoggedIn) {
              if (formError) {
                formError.textContent = 'Please log in to write a review.';
                formError.style.display = 'block';
              }
              closeReviewModal();
              showAuthPromptForReview();
              return;
            }

            var rVal = Number(ratingHiddenInput ? ratingHiddenInput.value : 0);
            var authorVal = (document.getElementById('reviewAuthorName').value || '').trim();
            var textVal = (document.getElementById('reviewText').value || '').trim();

            if (!rVal || rVal < 1 || rVal > 5) {
              if (formError) {
                formError.textContent = 'Please select a star rating (1 to 5 stars).';
                formError.style.display = 'block';
              }
              return;
            }

            if (!authorVal) {
              if (formError) {
                formError.textContent = 'Please enter your name.';
                formError.style.display = 'block';
              }
              return;
            }

            if (!textVal) {
              if (formError) {
                formError.textContent = 'Please write a brief review.';
                formError.style.display = 'block';
              }
              return;
            }

            if (formError) formError.style.display = 'none';

            // Double submission protection & loading state
            var submitBtnSpan = (typeof document !== 'undefined' && typeof document.querySelector === 'function') ? document.querySelector('#submitReviewBtn span') : document.getElementById('submitReviewBtn');
            if (submitBtn) submitBtn.disabled = true;
            if (submitBtnSpan) submitBtnSpan.textContent = 'SUBMITTING...';

            var service = window.PinboardReviews;
            var submitFn = (service && typeof service.submitReview === 'function')
              ? service.submitReview
              : function (opts) {
                  return fetch('/api/products/' + opts.productId + '/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(opts)
                  }).then(function (r) {
                    if (!r.ok) {
                      return r.json().then(function(err) { throw new Error(err.message || 'Server error'); });
                    }
                    return r.json();
                  });
                };

            submitFn({
              productId: String(productId),
              userId: user.uid || user.id,
              userName: authorVal,
              userEmail: user.email || '',
              rating: rVal,
              text: textVal,
              reviewText: textVal
            }).then(function (res) {
              if (formSuccess) {
                formSuccess.textContent = res.isUpdate ? 'Review updated successfully!' : 'Review submitted successfully!';
                formSuccess.style.display = 'block';
              }
              fetchAndRenderReviews();

              setTimeout(function () {
                closeReviewModal();
                if (submitBtn) submitBtn.disabled = false;
                if (submitBtnSpan) submitBtnSpan.textContent = 'UPDATE REVIEW';
              }, 1200);
            }).catch(function (err) {
              if (submitBtn) submitBtn.disabled = false;
              if (submitBtnSpan) {
                submitBtnSpan.textContent = currentUserReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW';
              }
              if (formError) {
                formError.textContent = err.message || 'Failed to save review. Please try again.';
                formError.style.display = 'block';
              }
            });
          };

          if (window.Auth && typeof window.Auth.waitForAuth === 'function') {
            window.Auth.waitForAuth().then(processSubmission);
          } else if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
            processSubmission(window.Auth.getCurrentUser());
          } else {
            processSubmission(null);
          }
        });
      }
    }

    initProductReviewSystem();
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
