/**
 * PINBOARD — Customer Wall Gallery Horizontal Slider & 3D Interactive Lightbox
 * Reuses the exact smooth touch-drag & vertical scroll-release architecture as Collections
 */
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('community-slider');
  const prevBtn = document.getElementById('comm-slider-prev');
  const nextBtn = document.getElementById('comm-slider-next');
  const dotsContainer = document.getElementById('comm-slider-dots');
  const cards = slider ? Array.from(slider.querySelectorAll('.community-card')) : [];

  let currentIndex = 0;
  let isPointerInteracting = false;
  let isHorizontalDrag = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let startSlideOffset = 0;
  let wasCommunityDragged = false;

  const dots = [];
  if (dotsContainer && cards.length) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `comm-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to customer slide ${idx + 1}`);
      dot.setAttribute('type', 'button');
      dot.addEventListener('click', () => goToCard(idx));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
  }

  function getGap() {
    if (!slider) return 20;
    const style = window.getComputedStyle(slider);
    return parseFloat(style.gap) || 20;
  }

  function getMaxIndex() {
    return cards.length > 0 ? cards.length - 1 : 0;
  }

  function getSlideOffset(index) {
    if (!cards.length || !cards[index] || !slider) return 0;
    const targetCard = cards[index];
    const sliderOffset = slider.offsetLeft || 0;
    return targetCard.offsetLeft - sliderOffset;
  }

  function updateCarousel() {
    if (!slider) return;
    const offset = getSlideOffset(currentIndex);
    slider.style.transform = `translateX(-${offset}px)`;
    updateActiveDot(currentIndex);
  }

  function goToCard(index) {
    currentIndex = Math.max(0, Math.min(getMaxIndex(), index));
    if (slider) {
      slider.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    updateCarousel();
  }

  function updateActiveDot(index) {
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === cards.length - 1;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) goToCard(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < getMaxIndex()) goToCard(currentIndex + 1);
    });
  }

  // ==========================================================
  // 1:1 TOUCH DRAG & SMOOTH VERTICAL SCROLL RELEASE (Matching Collections)
  // ==========================================================
  function startDrag(clientX, clientY) {
    pointerStartX = clientX;
    pointerStartY = clientY;
    lastPointerX = clientX;
    lastPointerY = clientY;
    startSlideOffset = getSlideOffset(currentIndex);
    isPointerInteracting = true;
    isHorizontalDrag = false;
    wasCommunityDragged = false;
    if (slider) slider.style.transition = 'none';
  }

  function moveDrag(clientX, clientY) {
    if (!isPointerInteracting) return;
    lastPointerX = clientX;
    lastPointerY = clientY;

    const diffX = clientX - pointerStartX;
    const diffY = clientY - pointerStartY;

    if (!isHorizontalDrag) {
      if (Math.abs(diffX) > 8 && Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalDrag = true;
      } else if (Math.abs(diffY) > 8 && Math.abs(diffY) >= Math.abs(diffX)) {
        // Vertical swipe detected -> release pointer drag so native page vertical scrolling is 100% fluid
        isPointerInteracting = false;
        return;
      }
    }

    if (isHorizontalDrag && slider) {
      wasCommunityDragged = true;
      let currentOffset = startSlideOffset - diffX;
      const cardW = cards[0] ? cards[0].offsetWidth + getGap() : 300;
      const maxOff = Math.max(0, (cards.length - 1) * cardW);

      if (currentOffset < 0) {
        currentOffset = currentOffset * 0.3;
      } else if (currentOffset > maxOff) {
        currentOffset = maxOff + (currentOffset - maxOff) * 0.3;
      }
      slider.style.transform = `translateX(-${currentOffset}px)`;
    }
  }

  function endDrag() {
    if (!isPointerInteracting) return;
    isPointerInteracting = false;
    if (slider) {
      slider.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    const diffX = lastPointerX - pointerStartX;
    if (isHorizontalDrag && Math.abs(diffX) > 30) {
      if (diffX < 0 && currentIndex < getMaxIndex()) {
        currentIndex++;
      } else if (diffX > 0 && currentIndex > 0) {
        currentIndex--;
      }
    }
    updateCarousel();
    setTimeout(() => { wasCommunityDragged = false; }, 150);
  }

  if (slider) {
    if (window.PointerEvent) {
      slider.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        startDrag(e.clientX, e.clientY);
      }, { passive: true });

      slider.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse') return;
        moveDrag(e.clientX, e.clientY);
      }, { passive: true });

      slider.addEventListener('pointerup', endDrag, { passive: true });
      slider.addEventListener('pointercancel', endDrag, { passive: true });
    } else {
      slider.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      slider.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      slider.addEventListener('touchend', endDrag, { passive: true });
      slider.addEventListener('touchcancel', endDrag, { passive: true });
    }
  }

  // Recalculate position on window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      updateCarousel();
    }, 100);
  });

  updateCarousel();

  // ==========================================
  // 2. FULL PHOTO LIGHTBOX MODAL PREVIEW
  // ==========================================
  const lightbox = document.getElementById('comm-lightbox');
  const lightboxOverlay = document.getElementById('comm-lightbox-overlay');
  const lightboxClose = document.getElementById('comm-lightbox-close');
  const lightboxPrev = document.getElementById('comm-lightbox-prev');
  const lightboxNext = document.getElementById('comm-lightbox-next');
  const lightboxImg = document.getElementById('comm-lightbox-img');
  const lightboxCaption = document.getElementById('comm-lightbox-caption');
  const lightboxBadge = document.getElementById('comm-lightbox-badge');
  const lightboxCounter = document.getElementById('comm-lightbox-counter');

  // Collect photo gallery metadata
  const galleryItems = cards.map((card) => {
    const img = card.querySelector('img');
    const captionEl = card.querySelector('.community-card-caption');
    const badgeEl = card.querySelector('.community-card-badge');
    return {
      src: img ? img.getAttribute('src') : '',
      alt: img ? img.getAttribute('alt') : 'Customer Wall Setup',
      caption: captionEl ? captionEl.textContent.trim() : '',
      badge: badgeEl ? badgeEl.textContent.trim() : 'PINBOARD COMMUNITY'
    };
  });

  let currentModalIndex = 0;
  let isLightboxOpen = false;

  function openLightbox(index) {
    if (!lightbox || !galleryItems.length) return;
    currentModalIndex = (index + galleryItems.length) % galleryItems.length;
    renderLightboxItem(currentModalIndex);

    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-locked');
    isLightboxOpen = true;

    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-locked');
    isLightboxOpen = false;
  }

  function renderLightboxItem(index) {
    const item = galleryItems[index];
    if (!item) return;

    if (lightboxImg) {
      lightboxImg.style.opacity = '0';
      lightboxImg.style.transform = 'scale(0.96)';
      setTimeout(() => {
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightboxImg.style.opacity = '1';
        lightboxImg.style.transform = 'scale(1)';
      }, 120);
    }
    if (lightboxCaption) lightboxCaption.textContent = item.caption;
    if (lightboxBadge) lightboxBadge.textContent = item.badge;
    if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${galleryItems.length}`;
  }

  function prevLightboxItem() {
    currentModalIndex = (currentModalIndex - 1 + galleryItems.length) % galleryItems.length;
    renderLightboxItem(currentModalIndex);
  }

  function nextLightboxItem() {
    currentModalIndex = (currentModalIndex + 1) % galleryItems.length;
    renderLightboxItem(currentModalIndex);
  }

  // Bind click on cards / images
  cards.forEach((card, idx) => {
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View customer photo ${idx + 1} in full preview`);

    card.addEventListener('click', (e) => {
      // Prevent opening lightbox when dragging/swiping on mobile
      if (wasCommunityDragged) return;
      // Prevent accidental opening when clicking nested interactive links if any
      if (e.target.closest('a') || e.target.closest('button')) return;
      openLightbox(idx);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightboxItem);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightboxItem);

  // Keyboard navigation & accessibility for lightbox
  document.addEventListener('keydown', (e) => {
    if (!isLightboxOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevLightboxItem();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextLightboxItem();
    }
  });

  // ==========================================
  // 3. 3D CTA BUTTONS TACTILE TILT & PHYSICS
  // ==========================================
  const buttons3D = document.querySelectorAll('.comm-btn-3d');
  buttons3D.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;

      const tiltX = -deltaY * 6; // max 6deg
      const tiltY = deltaX * 6;

      btn.style.transform = `perspective(600px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-3px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
});
