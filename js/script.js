// =============================================
// PINBOARD — Main JavaScript
// =============================================

// ---------- HAMBURGER MENU ----------
const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileOverlay.classList.toggle('open');
  document.body.style.overflow = mobileOverlay.classList.contains('open') ? 'hidden' : '';
});
// Close overlay when a link is clicked
mobileOverlay.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ---------- NAVBAR SEARCH & LIVE SEARCH DROPDOWN ----------
(function() {
  const navSearchWrap = document.getElementById('navSearchWrap');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const navSearchInput = document.getElementById('navSearchInput');
  if (!navSearchWrap || !navSearchInput) return;

  // Create or get search dropdown
  let searchDropdown = document.getElementById('navSearchDropdown');
  if (!searchDropdown) {
    searchDropdown = document.createElement('div');
    searchDropdown.className = 'nav-search-dropdown';
    searchDropdown.id = 'navSearchDropdown';
    searchDropdown.setAttribute('role', 'listbox');
    navSearchWrap.appendChild(searchDropdown);
  }

  let selectedIndex = -1;
  let currentResults = [];

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function highlightMatch(text, query) {
    if (!text) return '';
    if (!query) return escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + escapedQuery + ')', 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  function renderDropdown(query) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      searchDropdown.innerHTML = '';
      searchDropdown.classList.remove('is-open');
      currentResults = [];
      selectedIndex = -1;
      return;
    }

    const searchEngine = (window.PinboardSearch && typeof window.PinboardSearch.search === 'function')
      ? window.PinboardSearch
      : (window.PinboardRouter && window.PinboardRouter.searchEngine ? window.PinboardRouter.searchEngine : null);

    currentResults = searchEngine ? searchEngine.search(cleanQuery) : [];
    selectedIndex = -1;

    if (currentResults.length === 0) {
      searchDropdown.innerHTML =
        '<div class="search-no-results">' +
          '<div class="search-no-results-icon">🔍</div>' +
          '<div class="search-no-results-title">No posters found for "<strong>' + escapeHtml(cleanQuery) + '</strong>"</div>' +
          '<p class="search-no-results-sub">Try searching by player (e.g. Messi), superhero (Spider-Man), mood (Retro, Nature, Neon), or style.</p>' +
          '<div class="search-no-results-actions">' +
            '<button type="button" class="btn btn-ghost search-action-clear" id="searchActionClear">Clear</button>' +
            '<a href="index.html#shop" class="btn btn-solid search-action-browse" style="text-decoration:none">Browse All</a>' +
          '</div>' +
        '</div>';
      searchDropdown.classList.add('is-open');

      const clearBtn = searchDropdown.querySelector('#searchActionClear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          navSearchInput.value = '';
          renderDropdown('');
          navSearchInput.focus();
        });
      }
      return;
    }

    // Results found
    let html = 
      '<div class="search-drop-head mono">' +
        '<span>' + currentResults.length + ' POSTER' + (currentResults.length === 1 ? '' : 'S') + ' FOUND</span>' +
        '<button type="button" class="search-drop-clear" id="searchDropClear">Clear</button>' +
      '</div>' +
      '<div class="search-drop-list">';

    currentResults.slice(0, 6).forEach((p, idx) => {
      const price = p.salePrice || p.regularPrice;
      const img = (p.images && p.images[0]) ? p.images[0] : 'New Project 22 [FA6B4A7].png';
      html += 
        '<div class="search-result-item" data-product-id="' + p.id + '" data-index="' + idx + '" tabindex="0" role="option">' +
          '<div class="search-result-img">' +
            '<img src="' + img + '" alt="' + escapeHtml(p.title) + '" />' +
          '</div>' +
          '<div class="search-result-info">' +
            '<div class="search-result-title">' + highlightMatch(p.title, cleanQuery) + '</div>' +
            '<div class="search-result-meta mono">' + escapeHtml(p.category) + ' · ' + (p.pieces || 1) + (p.pieces > 1 ? ' Pieces' : ' Piece') + '</div>' +
            '<div class="search-result-price mono">₹' + price.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="search-result-arrow" aria-hidden="true">→</div>' +
        '</div>';
    });

    html += '</div>';

    if (currentResults.length > 0) {
      html += 
        '<div class="search-drop-footer">' +
          '<button type="button" class="search-drop-view-all" id="searchDropViewAll">' +
            'View all ' + currentResults.length + ' poster' + (currentResults.length === 1 ? '' : 's') + ' in Shop →' +
          '</button>' +
        '</div>';
    }

    searchDropdown.innerHTML = html;
    searchDropdown.classList.add('is-open');

    // Click handler on Clear button
    const clearBtn = searchDropdown.querySelector('#searchDropClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navSearchInput.value = '';
        renderDropdown('');
        navSearchInput.focus();
      });
    }

    // Click handler on View All button
    const viewAllBtn = searchDropdown.querySelector('#searchDropViewAll');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        executeSearchAction(cleanQuery);
      });
    }

    // Click handler on each search result item
    searchDropdown.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = item.getAttribute('data-product-id');
        closeSearch();
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(id);
        } else {
          window.location.href = 'product.html?id=' + encodeURIComponent(id);
        }
      });
    });
  }

  function updateItemSelection() {
    const items = searchDropdown.querySelectorAll('.search-result-item');
    items.forEach((it, idx) => {
      if (idx === selectedIndex) {
        it.classList.add('is-selected');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('is-selected');
      }
    });
  }

  function executeSearchAction(query) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return;

    closeSearch();

    // If on homepage (index.html) with a shop section
    const shopSection = document.getElementById('shop');
    if (shopSection && typeof filterShopBySearch === 'function') {
      filterShopBySearch(cleanQuery);
    } else {
      // If on product.html or account.html
      const results = (window.PinboardSearch && typeof window.PinboardSearch.search === 'function')
        ? window.PinboardSearch.search(cleanQuery)
        : [];
      if (results.length === 1) {
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(results[0]);
        } else {
          window.location.href = 'product.html?id=' + results[0].id;
        }
      } else {
        window.location.href = 'index.html?search=' + encodeURIComponent(cleanQuery) + '#shop';
      }
    }
  }

  function openSearch() {
    navSearchWrap.classList.add('active');
    navSearchInput.focus();
    if (navSearchInput.value.trim()) {
      renderDropdown(navSearchInput.value);
    }
  }

  function closeSearch() {
    navSearchWrap.classList.remove('active');
    if (searchDropdown) {
      searchDropdown.classList.remove('is-open');
    }
    selectedIndex = -1;
  }

  // Toggle button click
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSearch();
    });
  }

  // Close button click
  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navSearchInput.value = '';
      closeSearch();
    });
  }

  // Live input listener (real-time typing)
  let searchDebounceTimer;
  navSearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderDropdown(navSearchInput.value);
    }, 40);
  });

  // Keyboard navigation inside search input
  navSearchInput.addEventListener('keydown', (e) => {
    const items = searchDropdown.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = (selectedIndex + 1) % items.length;
        updateItemSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateItemSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        const id = items[selectedIndex].getAttribute('data-product-id');
        closeSearch();
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(id);
        } else {
          window.location.href = 'product.html?id=' + encodeURIComponent(id);
        }
      } else {
        executeSearchAction(navSearchInput.value);
      }
    } else if (e.key === 'Escape') {
      closeSearch();
      if (searchToggleBtn) searchToggleBtn.focus();
    }
  });

  // Close search when clicking outside
  document.addEventListener('click', (e) => {
    if (navSearchWrap && !navSearchWrap.contains(e.target)) {
      closeSearch();
    }
  });
})();

// ---------- HOMEPAGE SHOP FILTER BY SEARCH ----------
function filterShopBySearch(query) {
  const shopSection = document.getElementById('shop');
  if (!shopSection) return;
  const productsGrid = shopSection.querySelector('.products');
  if (!productsGrid) return;

  // Save original initial Best Sellers grid HTML
  if (!window._originalShopHtml) {
    window._originalShopHtml = productsGrid.innerHTML;
  }

  const cleanQuery = (query || '').trim();
  const searchEngine = window.PinboardSearch || (window.PinboardRouter ? window.PinboardRouter.searchEngine : null);
  const results = searchEngine ? searchEngine.search(cleanQuery) : [];

  // Remove existing banner if any
  const existingBanner = shopSection.querySelector('.shop-search-banner');
  if (existingBanner) existingBanner.remove();

  // Create search feedback banner
  const banner = document.createElement('div');
  banner.className = 'shop-search-banner';
  banner.innerHTML =
    '<div class="shop-search-banner-info">' +
      '<span class="shop-search-banner-tag">SEARCH RESULTS</span>' +
      '<span>Showing <strong>' + results.length + '</strong> poster' + (results.length === 1 ? '' : 's') + ' for "<strong>' + cleanQuery + '</strong>"</span>' +
    '</div>' +
    '<button type="button" class="shop-search-clear-btn" id="shopSearchClearBtn">Show All Posters</button>';

  productsGrid.parentNode.insertBefore(banner, productsGrid);

  const clearBtn = banner.querySelector('#shopSearchClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      restoreDefaultShop();
    });
  }

  if (results.length === 0) {
    productsGrid.innerHTML =
      '<div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 8px;">' +
        '<div style="font-size: 32px; margin-bottom: 12px;">🔍</div>' +
        '<h3 style="font-family: \'Anton\', sans-serif; font-size: 24px; text-transform: uppercase; margin-bottom: 8px;">No Posters Found</h3>' +
        '<p style="color: #666; font-size: 14px; margin-bottom: 20px;">We couldn\'t find any posters matching "' + cleanQuery + '".</p>' +
        '<button type="button" class="btn btn-solid" id="noResultsBrowseBtn" style="cursor: pointer;">Browse All Best Sellers</button>' +
      '</div>';
    const browseBtn = document.getElementById('noResultsBrowseBtn');
    if (browseBtn) browseBtn.addEventListener('click', restoreDefaultShop);
  } else {
    let cardsHtml = '';
    results.forEach(p => {
      const badgeHtml = p.badge ? '<div class="badge">' + p.badge + '</div>' : '';
      const price = p.salePrice || p.regularPrice;
      const img = (p.images && p.images[0]) ? p.images[0] : 'New Project 22 [FA6B4A7].png';
      cardsHtml +=
        '<div class="product" data-product-id="' + p.id + '" style="cursor: pointer;" tabindex="0" role="link">' +
          '<div class="product-tape"></div>' +
          badgeHtml +
          '<div class="product-img">' +
            '<img src="' + img + '" alt="' + p.title + '" />' +
          '</div>' +
          '<div class="product-info">' +
            '<div>' +
              '<div class="name">' + p.title + '</div>' +
              '<div class="cat">' + p.category + ' · ' + p.size + '</div>' +
            '</div>' +
            '<div class="price">₹' + price.toLocaleString() + '</div>' +
          '</div>' +
        '</div>';
    });
    productsGrid.innerHTML = cardsHtml;

    // Bind click events on generated cards
    productsGrid.querySelectorAll('[data-product-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const pid = card.getAttribute('data-product-id');
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(pid);
        } else {
          window.location.href = 'product.html?id=' + encodeURIComponent(pid);
        }
      });
      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
          e.preventDefault();
          const pid = card.getAttribute('data-product-id');
          if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
            window.PinboardRouter.navigateToProduct(pid);
          } else {
            window.location.href = 'product.html?id=' + encodeURIComponent(pid);
          }
        }
      });
    });
  }

  shopSection.scrollIntoView({ behavior: 'smooth' });
}
window.filterShopBySearch = filterShopBySearch;

function restoreDefaultShop() {
  const shopSection = document.getElementById('shop');
  if (!shopSection) return;
  const productsGrid = shopSection.querySelector('.products');
  const banner = shopSection.querySelector('.shop-search-banner');
  if (banner) banner.remove();
  if (productsGrid && window._originalShopHtml) {
    productsGrid.innerHTML = window._originalShopHtml;
    // Rebind original product cards
    productsGrid.querySelectorAll('[data-product-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const pid = card.getAttribute('data-product-id');
        if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
          window.PinboardRouter.navigateToProduct(pid);
        } else {
          window.location.href = 'product.html?id=' + encodeURIComponent(pid);
        }
      });
      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
          e.preventDefault();
          const pid = card.getAttribute('data-product-id');
          if (window.PinboardRouter && typeof window.PinboardRouter.navigateToProduct === 'function') {
            window.PinboardRouter.navigateToProduct(pid);
          } else {
            window.location.href = 'product.html?id=' + encodeURIComponent(pid);
          }
        }
      });
    });
  }
}
window.restoreDefaultShop = restoreDefaultShop;

// Check URL parameter for initial search filter on page load (e.g. index.html?search=messi)
(function() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') || urlParams.get('q');
    if (searchQuery) {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          filterShopBySearch(searchQuery);
        }, 100);
      });
    }
  } catch (e) {}
})();


// ---------- FRAME CONFIGURATOR ----------
const frameSwatches = document.querySelectorAll('.swatch');
const frameDemo = document.getElementById('frameDemo');
frameSwatches.forEach(sw => {
  sw.addEventListener('click', () => {
    frameSwatches.forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    frameDemo.classList.remove('framed', 'oak');
    if (sw.classList.contains('sw-black')) frameDemo.classList.add('framed');
    if (sw.classList.contains('sw-oak')) frameDemo.classList.add('oak');
  });
});
const sizePills = document.querySelectorAll('.size-pill');
sizePills.forEach(p => {
  p.addEventListener('click', () => {
    sizePills.forEach(s => s.classList.remove('active'));
    p.classList.add('active');
  });
});

// Configurator Add to Cart
const configuratorCartBtn = document.querySelector('.configurator .btn-cart');
if (configuratorCartBtn) {
  configuratorCartBtn.addEventListener('click', () => {
    if (!window.Auth || !Auth.isLoggedIn()) {
      if (window.Auth) {
        Auth.setPendingAction({
          action: 'cart',
          productId: 1,
          quantity: 1,
          returnUrl: window.location.href
        });
      }
      window.location.href = 'account.html';
      return;
    }
    if (window.Auth) {
      Auth.addToCart(1, 1);
    }
    configuratorCartBtn.textContent = 'Added to Cart ✓';
    setTimeout(() => {
      configuratorCartBtn.textContent = 'Add to Cart — ₹899';
    }, 2500);
  });
}

// ---------- NEWSLETTER FORM ----------
const newsForm = document.querySelector('.news-form');
if (newsForm) {
  newsForm.addEventListener('submit', function(event) {
    event.preventDefault();
    this.querySelector('button').textContent = 'Pinned \u2713';
  });
}

// ---------- COLLECTIONS CAROUSEL ----------
(function() {
  var track = document.getElementById('collectionsTrack');
  var nextBtn = document.getElementById('carouselNextBtn');
  var prevBtn = document.getElementById('carouselPrevBtn');
  var viewport = document.querySelector('.collections-viewport');
  if (!track || !nextBtn || !prevBtn || !viewport) return;

  var currentIndex = 0;
  var GAP = 2;

  function getCardsPerView() {
    return window.innerWidth <= 767 ? 1 : 3;
  }

  function getCards() {
    return track.querySelectorAll('.collection-card');
  }

  function getMaxIndex() {
    return Math.max(0, getCards().length - getCardsPerView());
  }

  // Compute correct card width from the VIEWPORT container, not the track
  function sizeCards() {
    var vw = viewport.offsetWidth;
    var perView = getCardsPerView();
    var totalGaps = (perView - 1) * GAP;
    var cardW = (vw - totalGaps) / perView;
    var cards = getCards();
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.width = cardW + 'px';
    }
  }

  function getSlideOffset() {
    var cards = getCards();
    if (cards.length === 0) return 0;
    var cardW = cards[0].offsetWidth;
    return (cardW + GAP) * currentIndex;
  }

  function updateButtons() {
    // Hide prev at start, hide next at end
    if (currentIndex <= 0) {
      prevBtn.classList.add('is-hidden');
    } else {
      prevBtn.classList.remove('is-hidden');
    }
    if (currentIndex >= getMaxIndex()) {
      nextBtn.classList.add('is-hidden');
    } else {
      nextBtn.classList.remove('is-hidden');
    }
  }

  function updateCarousel() {
    sizeCards();
    var offset = getSlideOffset();
    track.style.transform = 'translateX(-' + offset + 'px)';
    updateButtons();
  }

  function clickFeedback(btn) {
    btn.classList.add('is-clicked');
    setTimeout(function() { btn.classList.remove('is-clicked'); }, 200);
  }

  nextBtn.addEventListener('click', function() {
    if (currentIndex < getMaxIndex()) {
      currentIndex++;
      updateCarousel();
    }
    clickFeedback(nextBtn);
  });

  prevBtn.addEventListener('click', function() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
    clickFeedback(prevBtn);
  });

  // Recalculate on resize
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      updateCarousel();
    }, 150);
  });

  // Initial sizing and state
  updateCarousel();
  window.addEventListener('load', updateCarousel);
})();

// ---------- COLLECTIONS CATEGORY OVERLAY & NAVIGATION ----------
function closeCollectionOverlay() {
  var catOverlay = document.getElementById('catOverlay');
  if (catOverlay) {
    catOverlay.classList.remove('open', 'active', 'show', 'visible');
    catOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
  document.body.classList.remove('overlay-active', 'cat-open', 'modal-open');
}
window.closeCollectionOverlay = closeCollectionOverlay;

function openCollectionOverlay(e) {
  if (e && e.preventDefault) e.preventDefault();
  var catOverlay = document.getElementById('catOverlay');
  if (!catOverlay) return;
  catOverlay.classList.add('open');
  catOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openCollectionOverlay = openCollectionOverlay;

function toggleCollectionOverlay(e) {
  if (e && e.preventDefault) e.preventDefault();
  var catOverlay = document.getElementById('catOverlay');
  if (!catOverlay) return;
  if (catOverlay.classList.contains('open')) {
    closeCollectionOverlay();
  } else {
    openCollectionOverlay();
  }
}
window.toggleCollectionOverlay = toggleCollectionOverlay;

(function() {
  var catOverlay = document.getElementById('catOverlay');
  var catCloseBtn = document.getElementById('catOverlayClose');
  if (!catOverlay) return;

  // Intercept all navigation links across navbar, mobile menu, footer, hero
  var allLinks = document.querySelectorAll('nav a, .mobile-overlay a, footer a, .hero-cta button, .hero-cta a');
  allLinks.forEach(function(link) {
    var text = link.textContent.trim().toLowerCase();
    if (text === 'collections' || text === 'view collections') {
      // Collections trigger -> toggle/open overlay
      link.addEventListener('click', function(e) {
        if (e && e.preventDefault) e.preventDefault();
        // Close mobile overlay if open
        var mobileOverlay = document.getElementById('mobileOverlay');
        var hamburger = document.getElementById('hamburger');
        if (mobileOverlay && mobileOverlay.classList.contains('open')) {
          mobileOverlay.classList.remove('open');
          if (hamburger) hamburger.classList.remove('active');
        }
        toggleCollectionOverlay();
      });
    } else {
      // All other nav links (Shop All, Frames, About, etc.) -> close overlay first
      link.addEventListener('click', function() {
        closeCollectionOverlay();
      });
    }
  });

  // Logo click closes overlay
  var logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', function() {
      closeCollectionOverlay();
    });
  }

  // Search toggle or other icon buttons close collection overlay if open
  var searchToggleBtn = document.getElementById('searchToggleBtn');
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', function() {
      closeCollectionOverlay();
    });
  }

  // Close button (X)
  if (catCloseBtn) {
    catCloseBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeCollectionOverlay();
    });
  }

  // Click on dark backdrop closes overlay
  catOverlay.addEventListener('click', function(e) {
    if (e.target === catOverlay) {
      closeCollectionOverlay();
    }
  });

  // Escape key closes overlay
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && catOverlay.classList.contains('open')) {
      closeCollectionOverlay();
    }
  });

  // Category card clicks -> navigate directly to dedicated category page
  var catCards = catOverlay.querySelectorAll('.cat-card');
  catCards.forEach(function(card) {
    card.addEventListener('click', function(e) {
      var href = card.getAttribute('href');
      var category = card.getAttribute('data-category');
      closeCollectionOverlay();
      var mobileOverlay = document.getElementById('mobileOverlay');
      var hamburger = document.getElementById('hamburger');
      if (mobileOverlay && mobileOverlay.classList.contains('open')) {
        mobileOverlay.classList.remove('open');
        if (hamburger) hamburger.classList.remove('active');
      }

      if (href && href !== '#' && !href.startsWith('javascript:')) {
        // Normal navigation to dedicated category page (e.g. movies.html)
        window.location.href = href;
      } else if (category) {
        window.location.href = category + '.html';
      }
    });
  });
})();

// ---------- PRODUCT CARD CLICK → PRODUCT PAGE ----------
(function() {
  var cards = document.querySelectorAll('[data-product-id]');
  cards.forEach(function(card) {
    card.style.cursor = 'pointer';
    if (!card.hasAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'link');
    }
    function navigateToProduct() {
      var id = card.getAttribute('data-product-id');
      if (id) {
        var router = window.PinboardRouter;
        if (router && typeof router.navigateToProduct === 'function') {
          router.navigateToProduct(id);
        } else {
          try {
            sessionStorage.setItem('pinboard_selected_product_id', id);
            localStorage.setItem('pinboard_selected_product_id', id);
          } catch (e) {}
          window.location.href = 'product.html?id=' + encodeURIComponent(id);
        }
      }
    }
    card.addEventListener('click', function(e) {
      if (e.target.closest('button')) return;
      navigateToProduct();
    });
    card.addEventListener('keydown', function(e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
        e.preventDefault();
        navigateToProduct();
      }
    });
  });

  // Hero pinned links
  document.querySelectorAll('.pinned-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var href = link.getAttribute('href');
      var match = href && href.match(/id=([^&]+)/);
      if (match) {
        var id = decodeURIComponent(match[1]);
        try {
          sessionStorage.setItem('pinboard_selected_product_id', id);
          localStorage.setItem('pinboard_selected_product_id', id);
        } catch (err) {}
      }
    });
  });
})();
