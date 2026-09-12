// =============================================
// PINBOARD — Back Navigation System
// Intelligent, 3D Tactile Back Button Handler
// =============================================

(function () {
  'use strict';

  function initPinboardNavigation() {
    // Global delegated click listener for all back buttons
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.pinboard-back-btn');
      if (!btn) return;

      e.preventDefault();

      // Immediate tactile active feedback
      btn.classList.add('is-pressed');

      var fallbackUrl = btn.getAttribute('data-fallback') || 'index.html';

      // Check whether there is a valid previous page in browser history from the same origin
      var hasSameOriginReferrer = false;
      try {
        if (document.referrer) {
          var refUrl = new URL(document.referrer, window.location.href);
          // Same domain / origin AND not the exact same page URL
          if (refUrl.origin === window.location.origin && refUrl.href !== window.location.href) {
            hasSameOriginReferrer = true;
          }
        }
      } catch (err) {
        hasSameOriginReferrer = false;
      }

      // Check if user came from inside PINBOARD and has history
      setTimeout(function () {
        if (hasSameOriginReferrer && window.history.length > 1) {
          // Trigger history.back()
          window.history.back();

          // Safety watchdog fallback: If browser fails to navigate back within 350ms (e.g., trapped history), redirect to fallback
          var watchdogTimer = setTimeout(function () {
            window.location.href = fallbackUrl;
          }, 350);

          window.addEventListener('pagehide', function () {
            clearTimeout(watchdogTimer);
          }, { once: true });
        } else {
          // Direct fallback
          window.location.href = fallbackUrl;
        }
      }, 100);
    });

    // Global delegated click listener for all cart buttons
    document.addEventListener('click', function (e) {
      var cartBtn = e.target.closest('[aria-label="Cart"], .cart-btn, #navCartBtn');
      if (!cartBtn) return;

      // Don't intercept if already on cart.html unless intended
      if (window.location.pathname.endsWith('cart.html') || window.location.pathname.endsWith('/cart')) {
        return;
      }

      e.preventDefault();
      window.location.href = 'cart.html';
    });

    // Keyboard accessibility for space/enter
    document.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        var btn = document.activeElement && document.activeElement.closest('.pinboard-back-btn');
        if (btn) {
          btn.classList.add('is-pressed');
        }
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        var btn = document.activeElement && document.activeElement.closest('.pinboard-back-btn');
        if (btn) {
          btn.classList.remove('is-pressed');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPinboardNavigation);
  } else {
    initPinboardNavigation();
  }
})();
