// =============================================
// PINBOARD — Global Navigation & Interaction Engine
// 100% Reliable, First-Click Event Delegation across Mobile, Tablet, Laptop & Desktop
// =============================================

(function () {
  'use strict';

  function initPinboardNavigation() {
    try {
      // Prevent duplicate binding on window
      if (window._pinboardNavInitialized) return;
      window._pinboardNavInitialized = true;

    // Helper: Safely set selected product ID in storage
    function storeSelectedProductId(id) {
      if (!id) return;
      try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('pinboard_selected_product_id', id);
        if (typeof localStorage !== 'undefined') localStorage.setItem('pinboard_selected_product_id', id);
      } catch (e) {}
    }

    // Helper: Navigate to product detail page
    function goToProduct(id) {
      if (!id) return;
      storeSelectedProductId(id);
      if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
        window.PinboardRouter.navigateToProduct(id);
      } else {
        window.location.href = 'product.html?id=' + encodeURIComponent(id);
      }
    }

    // Helper: Close mobile menu overlay if open
    function closeMobileMenuIfOpen() {
      var mobileOverlay = document.getElementById('mobileOverlay');
      var hamburger = document.getElementById('hamburger');
      if (mobileOverlay && (mobileOverlay.classList.contains('open') || mobileOverlay.classList.contains('is-active'))) {
        mobileOverlay.classList.remove('open');
        mobileOverlay.classList.remove('is-active');
        mobileOverlay.setAttribute('aria-hidden', 'true');
        if (hamburger) {
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
        document.body.style.overflow = '';
      }
    }

    // =========================================================================
    // GLOBAL DELEGATED CLICK LISTENER ON DOCUMENT (FIRST-CLICK GUARANTEE)
    // =========================================================================
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;

      // 1. Back Buttons (.pinboard-back-btn)
      var backBtn = target.closest('.pinboard-back-btn');
      if (backBtn) {
        e.preventDefault();
        backBtn.classList.add('is-pressed');
        var fallbackUrl = backBtn.getAttribute('data-fallback') || 'index.html';
        
        var hasSameOriginReferrer = false;
        try {
          if (document.referrer) {
            var refUrl = new URL(document.referrer, window.location.href);
            if (refUrl.origin === window.location.origin && refUrl.href !== window.location.href) {
              hasSameOriginReferrer = true;
            }
          }
        } catch (err) {}

        if (hasSameOriginReferrer && window.history.length > 1) {
          window.history.back();
          var watchdogTimer = setTimeout(function () {
            window.location.href = fallbackUrl;
          }, 350);
          window.addEventListener('pagehide', function () {
            clearTimeout(watchdogTimer);
          }, { once: true });
        } else {
          window.location.href = fallbackUrl;
        }
        return;
      }

      // 2. Product Card Clicks ([data-product-id])
      var productCard = target.closest('[data-product-id]');
      if (productCard) {
        // Do not intercept if user clicked an interactive CTA button inside card (e.g. Add to Cart, Buy Now, review buttons)
        if (target.closest('button, .pdp-cta-btn, .btn-add-cart, .star-btn, .shop-search-clear-btn')) return;
        var pid = productCard.getAttribute('data-product-id');
        if (pid) {
          closeMobileMenuIfOpen();
          goToProduct(pid);
          return;
        }
      }

      // 3. Cart Button / Icon Clicks
      var cartBtn = target.closest('[aria-label="Cart"], .cart-btn, #navCartBtn, .mob-nav-cart-link');
      if (cartBtn) {
        if (window.location.pathname.endsWith('cart.html') || window.location.pathname.endsWith('/cart')) return;
        e.preventDefault();
        closeMobileMenuIfOpen();
        window.location.href = 'cart.html';
        return;
      }

      // 4. Collections Overlay Trigger Links
      var collectionsTrigger = target.closest('a[href*="#collections"], a[href*="collections.html"], .hero-cta-collections, .mob-nav-collections');
      if (!collectionsTrigger) {
        var linkEl = target.closest('a');
        if (linkEl) {
          var linkTxt = (linkEl.textContent || '').trim().toLowerCase();
          var linkHref = (linkEl.getAttribute('href') || '').toLowerCase();
          if ((linkTxt === 'collections' || linkTxt === 'view collections') && !linkHref.includes('movies') && !linkHref.includes('cars')) {
            collectionsTrigger = linkEl;
          }
        }
      }

      if (collectionsTrigger) {
        e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        closeMobileMenuIfOpen();
        var catOverlay = document.getElementById('catOverlay');
        if (catOverlay) {
          if (typeof window.toggleCollectionOverlay === 'function') {
            window.toggleCollectionOverlay();
          } else {
            catOverlay.classList.toggle('open');
            document.body.style.overflow = catOverlay.classList.contains('open') ? 'hidden' : '';
          }
        } else {
          var targetHref = collectionsTrigger.getAttribute('href') || 'index.html#collections';
          window.location.href = targetHref;
        }
        return;
      }

      // 5. Category Card Clicks (.cat-card inside collection overlay or page)
      var catCard = target.closest('.cat-card');
      if (catCard) {
        var catHref = catCard.getAttribute('href');
        var catName = catCard.getAttribute('data-category');
        if (typeof window.closeCollectionOverlay === 'function') {
          window.closeCollectionOverlay();
        }
        closeMobileMenuIfOpen();

        if (catHref && catHref !== '#' && !catHref.startsWith('javascript:')) {
          window.location.href = catHref;
        } else if (catName) {
          window.location.href = catName + '.html';
        }
        return;
      }

      // 6. Create Your Wall / Custom Posters Card
      var wallCard = target.closest('.pdp-create-wall-card, .pdp-wall-banner, [href="custom-posters.html"]');
      if (wallCard && !target.closest('button')) {
        closeMobileMenuIfOpen();
        window.location.href = 'custom-posters.html';
        return;
      }

      // 7. General Mobile Nav Link Click Auto-Close
      var mobLink = target.closest('#mobileOverlay a:not(#mobNavCloseBtn)');
      if (mobLink) {
        closeMobileMenuIfOpen();
      }
    });

    // Keyboard accessibility for space/enter on buttons
    document.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        var active = document.activeElement;
        if (active && active.classList.contains('pinboard-back-btn')) {
          active.classList.add('is-pressed');
        }
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        var active = document.activeElement;
        if (active && active.classList.contains('pinboard-back-btn')) {
          active.classList.remove('is-pressed');
        }
      }
    });
    } catch (error) {
      console.error("[PINBOARD Navigation] Global navigation initialization failed:", error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPinboardNavigation);
  } else {
    initPinboardNavigation();
  }
})();
