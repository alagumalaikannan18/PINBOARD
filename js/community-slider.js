/**
 * PINBOARD — Customer Wall Gallery Horizontal Slider & 3D Interactive Lightbox
 */
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('community-slider');
  const prevBtn = document.getElementById('comm-slider-prev');
  const nextBtn = document.getElementById('comm-slider-next');
  const dotsContainer = document.getElementById('comm-slider-dots');
  const cards = slider ? Array.from(slider.querySelectorAll('.community-card')) : [];

  // ==========================================
  // 1. HORIZONTAL SLIDER CONTROLS & SNAPPING
  // ==========================================
  const dots = [];
  if (dotsContainer && cards.length) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `comm-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to customer slide ${idx + 1}`);
      dot.setAttribute('type', 'button');
      dot.addEventListener('click', () => scrollToCard(idx));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
  }

  function getCardWidth() {
    if (cards.length === 0) return 320;
    const cardRect = cards[0].getBoundingClientRect();
    const style = window.getComputedStyle(slider);
    const gap = parseFloat(style.gap) || 20;
    return cardRect.width + gap;
  }

  function scrollToCard(index) {
    const targetCard = cards[index];
    if (!targetCard || !slider) return;
    slider.scrollTo({
      left: targetCard.offsetLeft - slider.offsetLeft,
      behavior: 'smooth'
    });
    updateActiveDot(index);
  }

  function updateActiveDot(index) {
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === cards.length - 1;
  }

  if (prevBtn && slider) {
    prevBtn.addEventListener('click', () => {
      const step = getCardWidth();
      slider.scrollBy({ left: -step, behavior: 'smooth' });
    });
  }

  if (nextBtn && slider) {
    nextBtn.addEventListener('click', () => {
      const step = getCardWidth();
      slider.scrollBy({ left: step, behavior: 'smooth' });
    });
  }

  if (slider) {
    let scrollTimeout;
    slider.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollLeft = slider.scrollLeft;
        const step = getCardWidth();
        const activeIdx = Math.round(scrollLeft / step);
        const clampedIdx = Math.max(0, Math.min(cards.length - 1, activeIdx));
        updateActiveDot(clampedIdx);
      }, 50);
    }, { passive: true });

    updateActiveDot(0);
  }

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

    // Focus close button for accessibility
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

  // Touch gesture & drag detection for smooth horizontal swiping
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwipingCard = false;

  if (slider) {
    slider.addEventListener('pointerdown', (e) => {
      touchStartX = e.clientX;
      touchStartY = e.clientY;
      isSwipingCard = false;
    }, { passive: true });

    slider.addEventListener('pointermove', (e) => {
      if (!touchStartX && !touchStartY) return;
      const distX = Math.abs(e.clientX - touchStartX);
      const distY = Math.abs(e.clientY - touchStartY);
      if (distX > 8 && distX > distY) {
        isSwipingCard = true;
      }
    }, { passive: true });

    slider.addEventListener('pointerup', () => {
      setTimeout(() => { isSwipingCard = false; }, 120);
    }, { passive: true });
  }

  // Bind click on cards / images
  cards.forEach((card, idx) => {
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View customer photo ${idx + 1} in full preview`);

    card.addEventListener('click', (e) => {
      // Prevent opening lightbox when dragging/swiping on mobile
      if (isSwipingCard) return;
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
