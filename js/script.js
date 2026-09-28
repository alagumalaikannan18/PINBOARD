// =============================================
// PINBOARD — Main JavaScript
// =============================================

// ---------- HAMBURGER MENU & MOBILE NAVIGATION ----------
(function() {
  const hamburger = document.getElementById('hamburger');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobNavCloseBtn = document.getElementById('mobNavCloseBtn');
  if (!hamburger || !mobileOverlay) return;

  function openMobileMenu() {
    hamburger.classList.add('active');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const closeBtn = document.getElementById('mobNavCloseBtn');
    if (closeBtn) closeBtn.focus();
  }

  function closeMobileMenu() {
    hamburger.classList.remove('active');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (hamburger) hamburger.focus();
  }

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mobileOverlay.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  if (mobNavCloseBtn) {
    mobNavCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileMenu();
    });
  }

  // Close overlay on backdrop click
  mobileOverlay.addEventListener('click', (e) => {
    if (e.target === mobileOverlay || (e.target && e.target.classList && e.target.classList.contains('mob-nav-backdrop-glow'))) {
      closeMobileMenu();
    }
  });

  // Close overlay on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileOverlay.classList.contains('open')) {
      closeMobileMenu();
    }
  });

  // Handle link clicks inside mobile overlay
  mobileOverlay.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && !link.classList.contains('mob-nav-close-btn') && link.id !== 'mobNavCloseBtn') {
      closeMobileMenu();
    }
  });

  // Mobile nav search input filter, live catalog search, & submit
  const mobNavSearchInput = document.getElementById('mobNavSearchInput');
  if (mobNavSearchInput && mobileOverlay) {
    const searchWrap = mobNavSearchInput.closest('.mob-nav-search-wrap') || mobNavSearchInput.parentElement;

    // 1. Create or get Clear (X) button inside search wrap
    let clearBtn = searchWrap.querySelector('.mob-search-clear-btn');
    if (!clearBtn) {
      clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'mob-search-clear-btn';
      clearBtn.setAttribute('aria-label', 'Clear search');
      clearBtn.innerHTML = '&times;';
      clearBtn.style.display = 'none';
      searchWrap.appendChild(clearBtn);
    }

    // 2. Create or get Mobile Search Results Container
    let mobSearchResults = mobileOverlay.querySelector('.mob-nav-search-results');
    if (!mobSearchResults) {
      mobSearchResults = document.createElement('div');
      mobSearchResults.className = 'mob-nav-search-results';
      mobSearchResults.id = 'mobNavSearchResults';
      mobSearchResults.style.display = 'none';
      const navLinks = mobileOverlay.querySelector('.mob-nav-links');
      if (navLinks && navLinks.parentNode) {
        navLinks.parentNode.insertBefore(mobSearchResults, navLinks.nextSibling);
      } else {
        const container = mobileOverlay.querySelector('.mob-nav-container');
        if (container) container.appendChild(mobSearchResults);
      }
    }

    const navLinks = mobileOverlay.querySelector('.mob-nav-links');

    function resetMobileMenuSearch() {
      mobNavSearchInput.value = '';
      clearBtn.style.display = 'none';
      mobSearchResults.innerHTML = '';
      mobSearchResults.style.display = 'none';
      if (navLinks) navLinks.style.display = '';
      const items = mobileOverlay.querySelectorAll('.mob-nav-item');
      items.forEach(item => { item.style.display = ''; });
    }

    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetMobileMenuSearch();
      mobNavSearchInput.focus();
    });

    const mobCloseBtn = document.getElementById('mobNavCloseBtn');
    if (mobCloseBtn) {
      mobCloseBtn.addEventListener('click', resetMobileMenuSearch);
    }

    mobNavSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = mobNavSearchInput.value.trim();
        if (query) {
          closeMobileMenu();
          window.location.href = 'shop.html?search=' + encodeURIComponent(query);
        }
      }
    });

    function escapeHtmlHelper(str) {
      return String(str || '').replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }

    function highlightMatchHelper(text, query) {
      if (!text) return '';
      const cleanText = String(text).replace(/&amp;/g, '&');
      if (!query) return escapeHtmlHelper(cleanText);
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(' + escapedQuery + ')', 'gi');
      return escapeHtmlHelper(cleanText).replace(regex, '<mark>$1</mark>');
    }

    function performMobileSearch() {
      const query = mobNavSearchInput.value.trim();
      const cleanQuery = query.toLowerCase();

      if (!query) {
        resetMobileMenuSearch();
        return;
      }

      clearBtn.style.display = 'flex';

      // Hide normal navigation cards
      if (navLinks) navLinks.style.display = 'none';

      // Execute search across catalog
      const searchEngine = (window.PinboardSearch && typeof window.PinboardSearch.search === 'function')
        ? window.PinboardSearch
        : (window.PinboardRouter && window.PinboardRouter.searchEngine ? window.PinboardRouter.searchEngine : null);

      let results = [];
      if (searchEngine) {
        results = searchEngine.search(query);
      } else if (window.PINBOARD_PRODUCTS && Array.isArray(window.PINBOARD_PRODUCTS)) {
        results = window.PINBOARD_PRODUCTS.filter(p => {
          const str = ((p.title || '') + ' ' + (p.subtitle || '') + ' ' + (p.category || '') + ' ' + (p.collection || '') + ' ' + (p.keywords || '') + ' ' + (Array.isArray(p.tags) ? p.tags.join(' ') : '')).toLowerCase();
          return str.includes(cleanQuery);
        });
      }

      mobSearchResults.style.display = 'block';

      if (results.length === 0) {
        mobSearchResults.innerHTML =
          '<div class="mob-search-empty">' +
            '<div class="mob-search-empty-icon">🔍</div>' +
            '<div class="mob-search-empty-title">No posters found for "<strong>' + escapeHtmlHelper(query) + '</strong>"</div>' +
            '<p class="mob-search-empty-sub">Try searching by player (e.g. Messi), superhero (Spider-Man), movie, or collection.</p>' +
            '<button type="button" class="mob-search-empty-clear-btn" id="mobSearchEmptyClearBtn">Clear Search</button>' +
          '</div>';

        const emptyClearBtn = mobSearchResults.querySelector('#mobSearchEmptyClearBtn');
        if (emptyClearBtn) {
          emptyClearBtn.addEventListener('click', () => {
            resetMobileMenuSearch();
            mobNavSearchInput.focus();
          });
        }
        return;
      }

      // Render compact search results
      let html =
        '<div class="mob-search-head mono">' +
          '<span>' + results.length + ' POSTER' + (results.length === 1 ? '' : 'S') + ' FOUND</span>' +
          '<button type="button" class="mob-search-head-clear" id="mobSearchHeadClear">Clear</button>' +
        '</div>' +
        '<div class="mob-search-list">';

      results.slice(0, 8).forEach((p) => {
        const price = p.salePrice || p.regularPrice || 60;
        const _pc = window.PinboardPosterConfig;
        const img = (_pc && _pc.hasValidPoster(p)) ? p.images[0] : (_pc ? _pc.getPlaceholder(true) : '');
        const pUrl = (window.PinboardRouter && typeof window.PinboardRouter.getProductUrl === 'function')
          ? window.PinboardRouter.getProductUrl(p)
          : ('product.html?id=' + p.id);

        html +=
          '<a href="' + pUrl + '" class="mob-search-item" data-product-id="' + p.id + '">' +
            '<div class="mob-search-item-img">' +
              '<img src="' + img + '" alt="' + escapeHtmlHelper(p.title) + '" loading="lazy" />' +
            '</div>' +
            '<div class="mob-search-item-info">' +
              '<div class="mob-search-item-title">' + highlightMatchHelper(p.title, query) + '</div>' +
              '<div class="mob-search-item-meta mono">' + escapeHtmlHelper(p.category || 'Poster') + ' · ₹' + price.toLocaleString() + '</div>' +
            '</div>' +
            '<div class="mob-search-item-arrow">→</div>' +
          '</a>';
      });

      html += '</div>';

      if (results.length > 0) {
        html +=
          '<div class="mob-search-footer">' +
            '<a href="shop.html?search=' + encodeURIComponent(query) + '" class="mob-search-view-all-btn" id="mobSearchViewAllBtn">' +
              'View all ' + results.length + ' poster' + (results.length === 1 ? '' : 's') + ' in Shop →' +
            '</a>' +
          '</div>';
      }

      mobSearchResults.innerHTML = html;

      // Event handlers inside search results
      const headClear = mobSearchResults.querySelector('#mobSearchHeadClear');
      if (headClear) {
        headClear.addEventListener('click', (e) => {
          e.stopPropagation();
          resetMobileMenuSearch();
          mobNavSearchInput.focus();
        });
      }

      const viewAllBtn = mobSearchResults.querySelector('#mobSearchViewAllBtn');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
          closeMobileMenu();
        });
      }

      mobSearchResults.querySelectorAll('.mob-search-item').forEach(link => {
        link.addEventListener('click', () => {
          closeMobileMenu();
        });
      });
    }

    let mobSearchDebounceTimer;
    mobNavSearchInput.addEventListener('input', () => {
      clearTimeout(mobSearchDebounceTimer);
      mobSearchDebounceTimer = setTimeout(performMobileSearch, 180);
    });
  }
})();

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
    const cleanText = String(text).replace(/&amp;/g, '&');
    if (!query) return escapeHtml(cleanText);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + escapedQuery + ')', 'gi');
    return escapeHtml(cleanText).replace(regex, '<mark>$1</mark>');
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
      const price = p.salePrice || p.regularPrice || 60;
      const _pc = window.PinboardPosterConfig;
      const img = (_pc && _pc.hasValidPoster(p)) ? p.images[0] : (_pc ? _pc.getPlaceholder(true) : '');
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
    }, 180);
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
      const price = p.salePrice || p.regularPrice || 60;
      const _pc = window.PinboardPosterConfig;
      const img = (_pc && _pc.hasValidPoster(p)) ? p.images[0] : (_pc ? _pc.getPlaceholder(false) : '');
      const srcsetAttr = (_pc && typeof _pc.getResponsiveSrcset === 'function') ? _pc.getResponsiveSrcset(img) : '';
      const sizesAttr = (_pc && typeof _pc.getResponsiveSizes === 'function') ? _pc.getResponsiveSizes('card') : '';
      const responsiveImgAttr = srcsetAttr ? 'srcset="' + srcsetAttr + '" sizes="' + sizesAttr + '" ' : '';
      cardsHtml +=
        '<div class="product" data-product-id="' + p.id + '" style="cursor: pointer;" tabindex="0" role="link">' +
          '<div class="product-tape"></div>' +
          badgeHtml +
          '<div class="product-img">' +
            '<img src="' + img + '" ' + responsiveImgAttr + 'alt="' + p.title + '" loading="lazy" decoding="async" />' +
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


// ---------- COLLECTIONS CAROUSEL ----------
(function() {
  var track = document.getElementById('collectionsTrack');
  var nextBtn = document.getElementById('carouselNextBtn');
  var prevBtn = document.getElementById('carouselPrevBtn');
  var viewport = document.querySelector('.collections-viewport');
  if (!track || !nextBtn || !prevBtn || !viewport) return;

  var currentIndex = 0;

  function getGAP() {
    var w = window.innerWidth;
    return w <= 767 ? 14 : (w <= 1024 ? 16 : 2);
  }

  function getCardsPerView() {
    var w = window.innerWidth;
    if (w <= 767) return 1;
    if (w <= 1024) return 2;
    return 3;
  }

  function getCards() {
    return track.querySelectorAll('.collection-card');
  }

  function getMaxIndex() {
    var cards = getCards();
    var w = window.innerWidth;
    if (w <= 767) {
      return Math.max(0, cards.length - 1);
    }
    return Math.max(0, cards.length - getCardsPerView());
  }

  // Compute correct card width from the VIEWPORT container
  function sizeCards() {
    var vw = viewport.offsetWidth;
    var w = window.innerWidth;
    var cards = getCards();
    var gap = getGAP();

    if (w <= 767) {
      // Mobile: prominent active card with elegant peek of next card
      var cardW = Math.min(360, Math.max(220, Math.round(vw * 0.82)));
      if (vw <= 340) {
        cardW = Math.round(vw - 36);
      }
      for (var i = 0; i < cards.length; i++) {
        cards[i].style.width = cardW + 'px';
        cards[i].style.flex = '0 0 ' + cardW + 'px';
      }
    } else if (w <= 1024) {
      // Tablet: 2 cards per view
      var perView = 2;
      var cardW = Math.round((vw - gap) / perView);
      for (var i = 0; i < cards.length; i++) {
        cards[i].style.width = cardW + 'px';
        cards[i].style.flex = '0 0 ' + cardW + 'px';
      }
    } else {
      // Desktop: 3 cards per view (exact desktop behavior)
      var perView = 3;
      var totalGaps = (perView - 1) * gap;
      var cardW = (vw - totalGaps) / perView;
      for (var i = 0; i < cards.length; i++) {
        cards[i].style.width = cardW + 'px';
        cards[i].style.flex = '0 0 ' + cardW + 'px';
      }
    }
  }

  function getSlideOffset() {
    var cards = getCards();
    if (cards.length === 0) return 0;
    var cardW = cards[0].offsetWidth;
    var gap = getGAP();
    return (cardW + gap) * currentIndex;
  }

  function updateButtons() {
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

  function updateActiveCardClasses() {
    var cards = getCards();
    for (var i = 0; i < cards.length; i++) {
      if (i === currentIndex) {
        cards[i].classList.add('is-active-card');
      } else {
        cards[i].classList.remove('is-active-card');
      }
    }
  }

  function updateCarousel() {
    sizeCards();
    var offset = getSlideOffset();
    track.style.transform = 'translateX(-' + offset + 'px)';
    updateButtons();
    updateActiveCardClasses();
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

  // Unified Touch / Pointer 1:1 Live Dragging for Mobile & Tablet
  var pointerStartX = 0;
  var pointerStartY = 0;
  var lastPointerX = 0;
  var lastPointerY = 0;
  var startSlideOffset = 0;
  var isPointerInteracting = false;
  var isHorizontalDrag = false;
  var wasCollectionDragged = false;
  var currentTouchedCard = null;
  var touchFadeTimeout = null;

  function clearCardGlow() {
    clearTimeout(touchFadeTimeout);
    if (currentTouchedCard) {
      currentTouchedCard.classList.remove('is-touch-active');
      currentTouchedCard = null;
    }
  }

  function setCardGlow(card) {
    if (!card) return;
    clearTimeout(touchFadeTimeout);
    if (currentTouchedCard && currentTouchedCard !== card) {
      currentTouchedCard.classList.remove('is-touch-active');
    }
    currentTouchedCard = card;
    currentTouchedCard.classList.add('is-touch-active');
  }

  function getCardFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    return el ? el.closest('.collection-card') : null;
  }

  function startDrag(clientX, clientY, target) {
    pointerStartX = clientX;
    pointerStartY = clientY;
    lastPointerX = clientX;
    lastPointerY = clientY;
    startSlideOffset = getSlideOffset();
    isPointerInteracting = true;
    isHorizontalDrag = false;
    wasCollectionDragged = false;
    track.style.transition = 'none';

    var targetCard = (target && target.closest ? target.closest('.collection-card') : null) || getCardFromPoint(clientX, clientY);
    if (targetCard && track.contains(targetCard)) {
      setCardGlow(targetCard);
    }
  }

  function moveDrag(clientX, clientY) {
    if (!isPointerInteracting) return;
    lastPointerX = clientX;
    lastPointerY = clientY;

    var diffX = clientX - pointerStartX;
    var diffY = clientY - pointerStartY;

    if (!isHorizontalDrag) {
      if (Math.abs(diffX) > 12 && Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalDrag = true;
      } else if (Math.abs(diffY) > 8 && Math.abs(diffY) >= Math.abs(diffX)) {
        // Vertical swipe detected -> release pointer drag so native page vertical scrolling is 100% fluid
        isPointerInteracting = false;
        return;
      }
    }

    if (isHorizontalDrag && Math.abs(diffX) > 12) {
      wasCollectionDragged = true;
      var currentOffset = startSlideOffset - diffX;
      var cards = getCards();
      var cardW = cards[0] ? cards[0].offsetWidth + getGAP() : 300;
      var maxOff = Math.max(0, (cards.length - 1) * cardW);

      if (currentOffset < 0) {
        currentOffset = currentOffset * 0.3;
      } else if (currentOffset > maxOff) {
        currentOffset = maxOff + (currentOffset - maxOff) * 0.3;
      }
      track.style.transform = 'translateX(-' + currentOffset + 'px)';

      var cardUnderFinger = getCardFromPoint(clientX, clientY);
      if (cardUnderFinger && track.contains(cardUnderFinger)) {
        setCardGlow(cardUnderFinger);
      }
    }
  }

  function endDrag() {
    if (!isPointerInteracting) return;
    isPointerInteracting = false;
    track.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';

    var diffX = lastPointerX - pointerStartX;

    if (isHorizontalDrag && Math.abs(diffX) > 30) {
      if (diffX < 0 && currentIndex < getMaxIndex()) {
        currentIndex++;
      } else if (diffX > 0 && currentIndex > 0) {
        currentIndex--;
      }
    }

    updateCarousel();

    setTimeout(function() {
      wasCollectionDragged = false;
    }, 150);

    clearTimeout(touchFadeTimeout);
    touchFadeTimeout = setTimeout(function() {
      clearCardGlow();
    }, 260);
  }

  if (window.PointerEvent) {
    viewport.addEventListener('pointerdown', function(e) {
      if (e.pointerType === 'mouse') return;
      startDrag(e.clientX, e.clientY, e.target);
    }, { passive: true });

    viewport.addEventListener('pointermove', function(e) {
      if (e.pointerType === 'mouse') return;
      moveDrag(e.clientX, e.clientY);
    }, { passive: true });

    viewport.addEventListener('pointerup', endDrag, { passive: true });
    viewport.addEventListener('pointercancel', endDrag, { passive: true });
  } else {
    viewport.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    viewport.addEventListener('touchend', endDrag, { passive: true });
    viewport.addEventListener('touchcancel', endDrag, { passive: true });
  }

  var collectionCards = getCards();
  for (var cIdx = 0; cIdx < collectionCards.length; cIdx++) {
    collectionCards[cIdx].addEventListener('click', function(e) {
      if (wasCollectionDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  // Recalculate on resize
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      updateCarousel();
    }, 100);
  });

  // Route detection for /collections page to mirror exact reference structure
  function updateCollectionsPageLayout() {
    var path = window.location.pathname.toLowerCase();
    var hash = window.location.hash.toLowerCase();
    var isCollections = (
      path === '/collections' ||
      path.endsWith('/collections') ||
      path.endsWith('/collections.html') ||
      hash === '#collections'
    );
    if (isCollections) {
      document.body.classList.add('is-collections-page');
    } else {
      document.body.classList.remove('is-collections-page');
    }
  }

  updateCollectionsPageLayout();
  window.addEventListener('popstate', updateCollectionsPageLayout);
  window.addEventListener('hashchange', updateCollectionsPageLayout);

  // Initial sizing and state
  updateCarousel();
  window.addEventListener('load', function() {
    updateCollectionsPageLayout();
    updateCarousel();
  });
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
    var href = (link.getAttribute('href') || '').toLowerCase();
    if (text === 'collections' || text === 'view collections' || href.indexOf('#collections') !== -1 || (href.indexOf('collections') !== -1 && href.indexOf('movies') === -1 && href.indexOf('cars') === -1)) {
      // Collections trigger -> toggle/open overlay
      link.addEventListener('click', function(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        // Close mobile overlay if open
        var mobileOverlay = document.getElementById('mobileOverlay');
        var hamburger = document.getElementById('hamburger');
        if (mobileOverlay && mobileOverlay.classList.contains('open')) {
          mobileOverlay.classList.remove('open');
          if (hamburger) hamburger.classList.remove('active');
          document.body.style.overflow = '';
        }
        var catOverlay = document.getElementById('catOverlay');
        if (catOverlay) {
          toggleCollectionOverlay();
        }
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

// =============================================
// PINBOARD — Community Newsletter & JOIN Form Engine
// =============================================
(function initPinboardNewsletter() {
  function setupNewsletterForms() {
    var forms = document.querySelectorAll('.foot-newsletter-form');
    if (!forms || forms.length === 0) return;

    forms.forEach(function (form) {
      if (form.dataset.subscribedBound === 'true') return;
      form.dataset.subscribedBound = 'true';

      var input = form.querySelector('input[type="email"]') || form.querySelector('input');
      var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
      var msgBox = form.querySelector('.foot-newsletter-msg');

      if (!msgBox) {
        msgBox = document.createElement('div');
        msgBox.className = 'foot-newsletter-msg';
        form.appendChild(msgBox);
      }

      function showError(text) {
        msgBox.className = 'foot-newsletter-msg is-error';
        msgBox.textContent = text;
        msgBox.style.display = 'block';
        if (input) {
          input.focus();
          input.classList.add('has-error');
        }
      }

      function clearError() {
        msgBox.className = 'foot-newsletter-msg';
        msgBox.textContent = '';
        msgBox.style.display = 'none';
        if (input) input.classList.remove('has-error');
      }

      function showSuccessState(message) {
        var successHTML = 
          '<div class="foot-newsletter-success-box">' +
            '<div class="foot-newsletter-success-title">' +
              '<i class="fa-solid fa-circle-check"></i> ' +
              '<span>You\'re on the list!</span>' +
            '</div>' +
            '<div class="foot-newsletter-success-sub">' +
              (message || 'Watch your inbox for secret drops & exhibition restocks.') +
            '</div>' +
          '</div>';
        
        form.innerHTML = successHTML;
      }

      function validateEmail(val) {
        if (!val) return false;
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(val.trim());
      }

      function handleSubmit(e) {
        if (e) e.preventDefault();
        clearError();

        var emailVal = input ? input.value.trim() : '';

        if (!emailVal) {
          showError('Please enter your email address.');
          return;
        }

        if (!validateEmail(emailVal)) {
          showError('Please enter a valid email address.');
          return;
        }

        // Processing Loading State
        if (btn) {
          btn.disabled = true;
          btn.classList.add('is-loading');
          btn.innerHTML = '<span>JOINING...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>';
        }
        if (input) input.disabled = true;

        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal })
        })
        .then(function (res) {
          if (res.ok) return res.json();
          return res.json().then(function (data) {
            throw new Error(data.message || 'Subscription failed');
          });
        })
        .then(function (data) {
          showSuccessState(data.message);
        })
        .catch(function (err) {
          if (err.message && err.message !== 'Failed to fetch') {
            showError(err.message);
            if (btn) {
              btn.disabled = false;
              btn.classList.remove('is-loading');
              btn.innerHTML = '<span>JOIN</span> <i class="fa-solid fa-arrow-right btn-icon"></i>';
            }
            if (input) input.disabled = false;
          } else {
            // Standalone client-side fallback
            setTimeout(function () {
              showSuccessState("Watch your inbox for PINBOARD drops.");
            }, 400);
          }
        });
      }

      form.addEventListener('submit', handleSubmit);

      if (input) {
        input.addEventListener('input', function () {
          clearError();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNewsletterForms);
  } else {
    setupNewsletterForms();
  }

  window.initPinboardNewsletter = setupNewsletterForms;
})();
