// =============================================
// PINBOARD — Interactive 3D Gallery Space
// High-Performance Parallax, 3D Depth & Physics
// =============================================

(function () {
  'use strict';

  function init3DSpace() {
    var spaceSection = document.getElementById('space3d');
    var viewport = document.getElementById('space3dViewport');
    var stage = document.getElementById('space3dStage');
    if (!spaceSection || !viewport || !stage) return;

    var cards = stage.querySelectorAll('.space3d-card');
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Current & target rotation coordinates
    var targetRotX = 0;
    var targetRotY = 0;
    var currentRotX = 0;
    var currentRotY = 0;
    var isHovered = false;
    var rafId = null;

    // Default base transforms stored on each card
    var cardBaseTransforms = [];
    cards.forEach(function (card, i) {
      cardBaseTransforms[i] = {
        x: parseFloat(card.getAttribute('data-base-x')) || 0,
        y: parseFloat(card.getAttribute('data-base-y')) || 0,
        z: parseFloat(card.getAttribute('data-base-z')) || 0,
        rx: parseFloat(card.getAttribute('data-base-rx')) || 0,
        ry: parseFloat(card.getAttribute('data-base-ry')) || 0,
        rz: parseFloat(card.getAttribute('data-base-rz')) || 0,
        depth: parseFloat(card.getAttribute('data-depth')) || 1
      };
    });

    var isVisible = false;

    // Smooth animation loop using lerp (linear interpolation)
    function updatePhysics() {
      if (!isVisible) {
        rafId = null;
        return;
      }

      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      // Apply overall stage perspective tilt
      stage.style.transform = 'rotateX(' + currentRotX.toFixed(2) + 'deg) rotateY(' + currentRotY.toFixed(2) + 'deg)';

      // Apply parallax depth offset to individual cards
      cards.forEach(function (card, i) {
        if (card.classList.contains('is-active-hover')) return; // let hover CSS handle active card

        var base = cardBaseTransforms[i];
        var offsetX = -currentRotY * base.depth * 1.8;
        var offsetY = currentRotX * base.depth * 1.8;

        card.style.transform =
          'translate3d(' + (base.x + offsetX).toFixed(1) + 'px, ' + (base.y + offsetY).toFixed(1) + 'px, ' + base.z + 'px) ' +
          'rotateX(' + (base.rx - currentRotX * 0.4).toFixed(1) + 'deg) ' +
          'rotateY(' + (base.ry - currentRotY * 0.4).toFixed(1) + 'deg) ' +
          'rotateZ(' + base.rz + 'deg)';
      });

      rafId = requestAnimationFrame(updatePhysics);
    }

    // High-efficiency IntersectionObserver: Run RAF loop ONLY when section is visible
    if ('IntersectionObserver' in window) {
      var spaceObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && !rafId) {
            rafId = requestAnimationFrame(updatePhysics);
          } else if (!isVisible && rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      }, { rootMargin: '100px 0px' });
      spaceObserver.observe(spaceSection);
    } else {
      isVisible = true;
      rafId = requestAnimationFrame(updatePhysics);
    }

    // Mouse Move Parallax Handler
    function handleMouseMove(e) {
      var rect = viewport.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var normX = (e.clientX - centerX) / (rect.width / 2);
      var normY = (e.clientY - centerY) / (rect.height / 2);

      // Clamp between -1 and 1
      normX = Math.max(-1, Math.min(1, normX));
      normY = Math.max(-1, Math.min(1, normY));

      targetRotY = normX * 12;  // max 12 deg Y tilt
      targetRotX = -normY * 10; // max 10 deg X tilt
    }

    viewport.addEventListener('mouseenter', function () {
      isHovered = true;
    });

    viewport.addEventListener('mousemove', handleMouseMove);
    viewport.addEventListener('pointermove', handleMouseMove);

    viewport.addEventListener('mouseleave', function () {
      isHovered = false;
      targetRotX = 0;
      targetRotY = 0;
    });

    // Touch Support for Mobile / Tablet
    var touchStartX = 0;
    var touchStartY = 0;

    viewport.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1) {
        var dx = (e.touches[0].clientX - touchStartX) / 15;
        var dy = (e.touches[0].clientY - touchStartY) / 15;
        targetRotY = Math.max(-14, Math.min(14, dx));
        targetRotX = Math.max(-10, Math.min(10, -dy));
      }
    }, { passive: true });

    viewport.addEventListener('touchend', function () {
      targetRotX = 0;
      targetRotY = 0;
    });

    // Interactive Card Hover & Click navigation
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        card.classList.add('is-active-hover');
      });

      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-active-hover');
      });

      card.addEventListener('click', function (e) {
        var prodId = card.getAttribute('data-product-id');
        if (!prodId) return;

        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(prodId);
        } else {
          try {
            sessionStorage.setItem('pinboard_selected_product_id', prodId);
            localStorage.setItem('pinboard_selected_product_id', prodId);
          } catch (err) {}
          window.location.href = 'product.html?id=' + encodeURIComponent(prodId);
        }
      });
    });

    // Perspective Mode Switches
    var modePills = spaceSection.querySelectorAll('.space3d-mode-pill');
    modePills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        modePills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');

        var mode = pill.getAttribute('data-mode');
        stage.setAttribute('data-mode', mode);

        if (mode === 'wide') {
          targetRotX = 4;
          targetRotY = -6;
        } else if (mode === 'focus') {
          targetRotX = -3;
          targetRotY = 4;
        } else {
          targetRotX = 0;
          targetRotY = 0;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DSpace);
  } else {
    init3DSpace();
  }
})();
