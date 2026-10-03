// ==========================================================================
// PINBOARD — Custom Posters Studio Engine
// Template Selection, Drag-and-Drop Uploads, Individual Per-Poster Sizing & Cart Integration
// ==========================================================================

(function () {
  'use strict';

  // Configurable Pricing Architecture & Single Source of Truth Matrix
  var CUSTOM_PRICING_MATRIX = {
    A4: { 5: 250, 8: 350, 10: 400, 12: 450 },
    A6: { 5: 80, 8: 130, 10: 150, 12: 190 }
  };

  var PRICING_CONFIG = {
    sizes: {
      A6: { code: 'A6', name: 'Small', dim: '105 × 148 mm' },
      A4: { code: 'A4', name: 'Standard', dim: '210 × 297 mm' }
    },
    templates: {
      5: { count: 5, name: '5 Posters', label: 'Compact Gallery', defaultSize: 'A4' },
      8: { count: 8, name: '8 Posters', label: 'Salon Wall', defaultSize: 'A4' },
      10: { count: 10, name: '10 Posters', label: 'Grand Collection', defaultSize: 'A4' },
      12: { count: 12, name: '12 Posters', label: 'Master Exhibition', defaultSize: 'A4' }
    }
  };

  // Studio State
  var state = {
    activeTemplate: 5,
    slots: []
  };

  /**
   * Initialize or resize slots array while preserving already uploaded photos
   */
  function initSlots(count) {
    var newSlots = [];
    for (var i = 0; i < count; i++) {
      if (state.slots[i]) {
        newSlots.push(state.slots[i]);
      } else {
        newSlots.push({
          index: i,
          image: null,
          fileName: null,
          size: 'A4'
        });
      }
    }
    state.slots = newSlots;
  }

  /**
   * Calculate live order pricing and itemization using official matrix
   */
  function calculateSummary() {
    var totalUploaded = 0;
    var totalSized = 0;
    var count = state.activeTemplate || 5;
    var sizeCounts = { A6: 0, A4: 0 };

    state.slots.forEach(function (slot) {
      if (slot.image) totalUploaded++;
      var sKey = (slot.size === 'A6') ? 'A6' : 'A4';
      slot.size = sKey;
      totalSized++;
      sizeCounts[sKey] = (sizeCounts[sKey] || 0) + 1;
    });

    // Subtotal calculation from matrix
    var subtotal = 0;
    if (sizeCounts.A4 === count) {
      subtotal = CUSTOM_PRICING_MATRIX.A4[count] || 250;
    } else if (sizeCounts.A6 === count) {
      subtotal = CUSTOM_PRICING_MATRIX.A6[count] || 80;
    } else {
      var a4Unit = (CUSTOM_PRICING_MATRIX.A4[count] || 250) / count;
      var a6Unit = (CUSTOM_PRICING_MATRIX.A6[count] || 80) / count;
      subtotal = Math.round((sizeCounts.A4 * a4Unit) + (sizeCounts.A6 * a6Unit));
    }

    var isComplete = (totalUploaded === count) && (totalSized === count);
    var sizesSummaryParts = [];
    ['A4', 'A6'].forEach(function (s) {
      if (sizeCounts[s] > 0) {
        sizesSummaryParts.push(s + ' × ' + sizeCounts[s]);
      }
    });

    return {
      totalUploaded: totalUploaded,
      totalSized: totalSized,
      totalRequired: count,
      isComplete: isComplete,
      subtotal: subtotal,
      totalPrice: subtotal,
      sizesSummary: sizesSummaryParts.join(', ') || 'Sizes pending'
    };
  }

  /**
   * Render Slot Cards Grid
   */
  function renderSlotsGrid() {
    var container = document.getElementById('uploadSlotsContainer');
    if (!container) return;

    var count = state.activeTemplate || 5;
    var html = '';
    state.slots.forEach(function (slot, i) {
      var numDisplay = (i + 1 < 10 ? '0' : '') + (i + 1);
      var hasImage = !!slot.image;
      var activeSize = slot.size === 'A6' ? 'A6' : 'A4';

      var previewContent = '';
      if (hasImage) {
        previewContent =
          '<div class="slot-artwork-wrap">' +
            '<img src="' + slot.image + '" alt="Poster ' + numDisplay + '" />' +
            '<div class="slot-artwork-glare"></div>' +
            '<div class="slot-artwork-overlay-actions">' +
              '<button type="button" class="slot-action-btn replace" data-slot="' + i + '">🔄 Replace Photo</button>' +
              '<button type="button" class="slot-action-btn delete" data-slot="' + i + '">🗑️ Remove</button>' +
            '</div>' +
          '</div>';
      } else {
        previewContent =
          '<div class="slot-dropzone" data-slot="' + i + '" tabindex="0" role="button" aria-label="Upload photo for poster ' + numDisplay + '">' +
            '<svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
              '<polyline points="17 8 12 3 7 8"></polyline>' +
              '<line x1="12" y1="3" x2="12" y2="15"></line>' +
            '</svg>' +
            '<span class="dropzone-label">+ Upload Photo</span>' +
            '<span class="dropzone-hint">JPG, PNG, WEBP · Max 100MB</span>' +
          '</div>';
      }

      // Size Selection Buttons for THIS specific poster slot (A6 and A4 only)
      var sizeOptionsHtml = '';
      ['A6', 'A4'].forEach(function (sKey) {
        var sInfo = PRICING_CONFIG.sizes[sKey];
        var isSelected = activeSize === sKey;
        var pVal = CUSTOM_PRICING_MATRIX[sKey][count] || 250;
        sizeOptionsHtml +=
          '<button type="button" class="size-pill-btn ' + (isSelected ? 'active' : '') + '" data-slot="' + i + '" data-size="' + sKey + '">' +
            '<span class="size-pill-code">' + sInfo.code + '</span>' +
            '<span class="size-pill-name">' + sInfo.name + '</span>' +
            '<span class="size-pill-dim">' + sInfo.dim + '</span>' +
            '<span class="size-pill-price">₹' + pVal + '</span>' +
          '</button>';
      });

      html +=
        '<div class="poster-slot-card" data-slot-index="' + i + '">' +
          '<div class="slot-card-inner ' + (hasImage ? 'is-complete' : '') + '">' +
            '<div class="slot-preview-chamber">' +
              previewContent +
              '<input type="file" id="slotFileInput_' + i + '" accept="image/jpeg,image/png,image/webp,image/jpg" style="display:none;" />' +
            '</div>' +
            '<div class="slot-controls">' +
              '<div class="slot-controls-header">' +
                '<h3 class="slot-num-title">POSTER ' + numDisplay + '</h3>' +
                '<span class="slot-status-pill ' + (hasImage ? 'ready' : 'pending') + '">' +
                  (hasImage ? '✓ Photo Ready' : 'Photo Required') +
                '</span>' +
              '</div>' +
              '<div class="individual-size-picker">' +
                '<label class="size-picker-label">Choose Size for Poster ' + numDisplay + ':</label>' +
                '<div class="size-options-grid">' +
                  sizeOptionsHtml +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;
    attachSlotHandlers(container);
  }

  /**
   * Attach Slot Event Handlers (Upload, Size Change, Replace, Remove)
   */
  function attachSlotHandlers(container) {
    // 1. Dropzone click to trigger hidden file input
    container.querySelectorAll('.slot-dropzone').forEach(function (dropzone) {
      var slotIdx = parseInt(dropzone.getAttribute('data-slot'), 10);
      var fileInput = document.getElementById('slotFileInput_' + slotIdx);

      dropzone.addEventListener('click', function () {
        if (fileInput) fileInput.click();
      });

      dropzone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (fileInput) fileInput.click();
        }
      });

      // Drag and Drop
      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('dragover');
      });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileUpload(slotIdx, e.dataTransfer.files[0]);
        }
      });
    });

    // 2. Hidden File Inputs
    container.querySelectorAll('input[type="file"]').forEach(function (input) {
      input.addEventListener('change', function (e) {
        var idParts = input.id.split('_');
        var slotIdx = parseInt(idParts[1], 10);
        if (input.files && input.files[0]) {
          handleFileUpload(slotIdx, input.files[0]);
        }
      });
    });

    // 3. Replace Button
    container.querySelectorAll('.slot-action-btn.replace').forEach(function (btn) {
      var slotIdx = parseInt(btn.getAttribute('data-slot'), 10);
      var fileInput = document.getElementById('slotFileInput_' + slotIdx);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (fileInput) fileInput.click();
      });
    });

    // 4. Remove Button
    container.querySelectorAll('.slot-action-btn.delete').forEach(function (btn) {
      var slotIdx = parseInt(btn.getAttribute('data-slot'), 10);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state.slots[slotIdx].objectUrl) {
          try { URL.revokeObjectURL(state.slots[slotIdx].objectUrl); } catch (err) {}
          state.slots[slotIdx].objectUrl = null;
        }
        state.slots[slotIdx].image = null;
        state.slots[slotIdx].fileName = null;
        state.slots[slotIdx].fileRef = null;
        renderSlotsGrid();
        updateSummaryPanel();
      });
    });

    // 5. Individual Size Pill Buttons (Optimized DOM update without full grid rebuild)
    container.querySelectorAll('.size-pill-btn').forEach(function (btn) {
      var slotIdx = parseInt(btn.getAttribute('data-slot'), 10);
      var sizeKey = btn.getAttribute('data-size');
      btn.addEventListener('click', function () {
        state.slots[slotIdx].size = sizeKey;
        var sInfo = PRICING_CONFIG.sizes[sizeKey] || PRICING_CONFIG.sizes.A4;
        state.slots[slotIdx].price = sInfo.price;

        // Fast update active pill state on this card without destroying DOM
        var card = container.querySelector('[data-slot-index="' + slotIdx + '"]');
        if (card) {
          card.querySelectorAll('.size-pill-btn').forEach(function (b) {
            if (b.getAttribute('data-size') === sizeKey) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
        } else {
          renderSlotsGrid();
        }
        updateSummaryPanel();
      });
    });
  }

  /**
   * High-Performance Canvas Image Resizer for UI Previews (Prevents RAM Bloat)
   */
  function generateOptimizedPreview(file, maxDimension, callback) {
    var tempUrl = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var width = img.width;
      var height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      var previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(tempUrl);
      callback(previewDataUrl);
    };
    img.onerror = function () {
      URL.revokeObjectURL(tempUrl);
      callback(null);
    };
    img.src = tempUrl;
  }

  /**
   * Handle File Upload & Validation with instant optimized preview
   */
  function handleFileUpload(slotIdx, file) {
    if (!file) return;

    // Type validation
    var validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Size validation (Max 100MB limit preserved)
    var MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert('The uploaded image is too large. Please select an image under 100MB.');
      return;
    }

    // Clean up previous blob URL if any
    if (state.slots[slotIdx].objectUrl) {
      try { URL.revokeObjectURL(state.slots[slotIdx].objectUrl); } catch (e) {}
      state.slots[slotIdx].objectUrl = null;
    }

    state.slots[slotIdx].fileName = file.name;
    state.slots[slotIdx].fileRef = file;

    // Generate lightweight UI preview (1000px max, ~50KB) instead of storing 100MB in RAM
    generateOptimizedPreview(file, 1000, function (previewUrl) {
      if (!previewUrl) {
        alert('Failed to process image file. Please try another photo.');
        return;
      }
      state.slots[slotIdx].image = previewUrl;
      renderSlotsGrid();
      updateSummaryPanel();
    });
  }

  /**
   * Update Live Order Summary Panel
   */
  function updateSummaryPanel() {
    var summary = calculateSummary();

    // 1. Template name & counts
    var templateNameEl = document.getElementById('summaryTemplateName');
    if (templateNameEl) {
      templateNameEl.textContent = state.activeTemplate + ' CUSTOM POSTERS';
    }

    // 2. Progress Meter
    var progressLabel = document.getElementById('summaryProgressLabel');
    var progressFill = document.getElementById('summaryProgressFill');
    var progressStatusMsg = document.getElementById('summaryProgressStatusMsg');

    var pct = Math.round((summary.totalUploaded / summary.totalRequired) * 100);
    if (progressLabel) {
      progressLabel.textContent = summary.totalUploaded + ' OF ' + summary.totalRequired + ' UPLOADED';
    }
    if (progressFill) {
      progressFill.style.width = pct + '%';
    }
    if (progressStatusMsg) {
      if (summary.isComplete) {
        progressStatusMsg.innerHTML = '<strong style="color:#059669">✓ All ' + summary.totalRequired + ' photos uploaded &amp; configured!</strong>';
      } else {
        var remaining = summary.totalRequired - summary.totalUploaded;
        progressStatusMsg.textContent = 'Please upload ' + remaining + ' more photo' + (remaining === 1 ? '' : 's') + ' to continue.';
      }
    }

    // 3. Itemized Breakdown List
    var breakdownList = document.getElementById('summaryBreakdownList');
    if (breakdownList) {
      var listHtml = '';
      var count = state.activeTemplate || 5;
      state.slots.forEach(function (slot, i) {
        var numDisplay = (i + 1 < 10 ? '0' : '') + (i + 1);
        var sKey = slot.size === 'A6' ? 'A6' : 'A4';
        var sInfo = PRICING_CONFIG.sizes[sKey] || PRICING_CONFIG.sizes.A4;
        var slotPrice = Math.round((CUSTOM_PRICING_MATRIX[sKey][count] || 250) / count);
        var thumbHtml = slot.image
          ? '<img src="' + slot.image + '" class="summary-thumb" alt="P' + numDisplay + '" />'
          : '<div class="summary-thumb empty">P' + numDisplay + '</div>';

        listHtml +=
          '<div class="summary-poster-item">' +
            '<div class="summary-item-left">' +
              thumbHtml +
              '<span>Poster ' + numDisplay + ' (' + sInfo.code + ')</span>' +
            '</div>' +
            '<span class="summary-item-price">₹' + slotPrice + '</span>' +
          '</div>';
      });
      breakdownList.innerHTML = listHtml;
    }

    // 4. Pricing Calculation
    var subtotalEl = document.getElementById('summarySubtotal');
    var totalEl = document.getElementById('summaryTotalPrice');
    var checkoutBtn = document.getElementById('customCheckoutBtn');
    var previewBtn = document.getElementById('customPreviewBtn');

    if (subtotalEl) subtotalEl.textContent = '₹' + summary.subtotal.toLocaleString();
    if (totalEl) totalEl.textContent = '₹' + summary.totalPrice.toLocaleString();

    if (checkoutBtn) {
      if (summary.isComplete) {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<span>BUY YOUR CUSTOM POSTER — ₹' + summary.totalPrice.toLocaleString() + '</span> <span>→</span>';
      } else {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<span>UPLOAD ' + (summary.totalRequired - summary.totalUploaded) + ' MORE TO PROCEED</span>';
      }
    }

    // 5. Preview Button Visibility (Visible ONLY when all photos are uploaded)
    if (previewBtn) {
      if (summary.isComplete) {
        previewBtn.style.display = 'inline-flex';
      } else {
        previewBtn.style.display = 'none';
      }
    }

    // 6. Re-render live preview if modal is open
    var previewModal = document.getElementById('customWallPreviewModal');
    if (previewModal && previewModal.classList.contains('open')) {
      if (!summary.isComplete) {
        closeWallPreviewModal();
      } else {
        renderWallPreviewContent();
      }
    }
  }

  /**
   * Render Wall Preview Modal Content with actual customer uploads & chosen sizes
   */
  function renderWallPreviewContent() {
    var roomWall = document.getElementById('wallPreviewRoomWall');
    var sizesGrid = document.getElementById('wallPreviewSizesGrid');
    var titleEl = document.getElementById('wallPreviewTitle');
    var subtitleEl = document.getElementById('wallPreviewSubtitle');
    var totalValEl = document.getElementById('wallPreviewTotalVal');

    if (!roomWall) return;

    var summary = calculateSummary();
    if (titleEl) titleEl.textContent = state.activeTemplate + ' POSTERS';
    if (subtitleEl) {
      var tInfo = PRICING_CONFIG.templates[state.activeTemplate] || { label: 'Gallery Wall' };
      subtitleEl.textContent = tInfo.label + ' · ' + summary.sizesSummary;
    }
    if (totalValEl) totalValEl.textContent = '₹' + summary.totalPrice.toLocaleString();

    // Render configured size breakdown pills
    if (sizesGrid) {
      var sizesHtml = '';
      state.slots.forEach(function (slot, idx) {
        var numDisplay = (idx + 1 < 10 ? '0' : '') + (idx + 1);
        var sInfo = PRICING_CONFIG.sizes[slot.size] || PRICING_CONFIG.sizes.A4;
        sizesHtml +=
          '<div class="pv-size-item">' +
            '<span class="pv-size-num">Poster ' + numDisplay + '</span>' +
            '<span class="pv-size-badge">' + sInfo.code + '</span>' +
            '<span class="pv-size-dim">' + sInfo.dim + '</span>' +
            '<span class="pv-size-price">₹' + sInfo.price + '</span>' +
          '</div>';
      });
      sizesGrid.innerHTML = sizesHtml;
    }

    // Helper to generate a single physical mounted poster
    function createPreviewFrame(slotIdx, roleClass) {
      var slot = state.slots[slotIdx];
      if (!slot) return '';
      var numDisplay = (slotIdx + 1 < 10 ? '0' : '') + (slotIdx + 1);
      var sizeKey = (slot.size || 'A4').toLowerCase();
      var _pc = window.PinboardPosterConfig;
      var imgSrc = slot.image || (_pc ? _pc.getPlaceholder(false) : '');
      var sInfo = PRICING_CONFIG.sizes[slot.size] || PRICING_CONFIG.sizes.A4;

      return (
        '<div class="pv-poster-frame ' + (roleClass || '') + ' pv-scale-' + sizeKey + '" data-slot="' + slotIdx + '">' +
          '<div class="pv-artwork-wrap">' +
            '<img src="' + imgSrc + '" alt="Poster ' + numDisplay + '" />' +
            '<div class="pv-glare"></div>' +
          '</div>' +
          '<div class="pv-frame-tag">' +
            '<span class="pv-tag-num">' + numDisplay + '</span>' +
            '<span class="pv-tag-size">' + sInfo.code + '</span>' +
          '</div>' +
        '</div>'
      );
    }

    var wallHtml = '';
    if (state.activeTemplate === 5) {
      // 5-POSTER COMPOSITION: Center Hero (Poster 01) with 2 Left & 2 Right posters
      wallHtml =
        '<div class="pv-gallery-wall pv-wall-5" id="pvWallZoomable">' +
          '<div class="pv-col pv-col-left">' +
            createPreviewFrame(1, 'pv-side-top') +
            createPreviewFrame(3, 'pv-side-bottom') +
          '</div>' +
          '<div class="pv-col pv-col-center">' +
            createPreviewFrame(0, 'pv-hero') +
          '</div>' +
          '<div class="pv-col pv-col-right">' +
            createPreviewFrame(2, 'pv-side-top') +
            createPreviewFrame(4, 'pv-side-bottom') +
          '</div>' +
        '</div>';
    } else if (state.activeTemplate === 8) {
      // 8-POSTER COMPOSITION: Balanced multi-row staggered gallery
      wallHtml =
        '<div class="pv-gallery-wall pv-wall-8" id="pvWallZoomable">' +
          '<div class="pv-row pv-row-pair">' +
            createPreviewFrame(0, '') +
            createPreviewFrame(1, '') +
          '</div>' +
          '<div class="pv-row pv-row-quad">' +
            createPreviewFrame(2, '') +
            createPreviewFrame(3, 'pv-hero') +
            createPreviewFrame(4, 'pv-hero') +
            createPreviewFrame(5, '') +
          '</div>' +
          '<div class="pv-row pv-row-pair">' +
            createPreviewFrame(6, '') +
            createPreviewFrame(7, '') +
          '</div>' +
        '</div>';
    } else if (state.activeTemplate === 10) {
      // 10-POSTER COMPOSITION: Dynamic 3-tier gallery wall with central hierarchy
      wallHtml =
        '<div class="pv-gallery-wall pv-wall-10" id="pvWallZoomable">' +
          '<div class="pv-row pv-row-pair">' +
            createPreviewFrame(0, '') +
            createPreviewFrame(1, '') +
          '</div>' +
          '<div class="pv-row pv-row-quad">' +
            createPreviewFrame(2, '') +
            createPreviewFrame(3, 'pv-focal') +
            createPreviewFrame(4, 'pv-focal') +
            createPreviewFrame(5, '') +
          '</div>' +
          '<div class="pv-row pv-row-quad">' +
            createPreviewFrame(6, '') +
            createPreviewFrame(7, '') +
            createPreviewFrame(8, '') +
            createPreviewFrame(9, '') +
          '</div>' +
        '</div>';
    } else if (state.activeTemplate === 12) {
      // 12-POSTER COMPOSITION: Master Exhibition 4-tier arrangement
      wallHtml =
        '<div class="pv-gallery-wall pv-wall-12" id="pvWallZoomable">' +
          '<div class="pv-row pv-row-triple">' +
            createPreviewFrame(0, '') +
            createPreviewFrame(1, '') +
            createPreviewFrame(2, '') +
          '</div>' +
          '<div class="pv-row pv-row-5">' +
            createPreviewFrame(3, '') +
            createPreviewFrame(4, 'pv-hero') +
            createPreviewFrame(5, 'pv-hero') +
            createPreviewFrame(6, 'pv-hero') +
            createPreviewFrame(7, '') +
          '</div>' +
          '<div class="pv-row pv-row-triple">' +
            createPreviewFrame(8, '') +
            createPreviewFrame(9, '') +
            createPreviewFrame(10, '') +
          '</div>' +
          '<div class="pv-row pv-row-center">' +
            createPreviewFrame(11, 'pv-focal') +
          '</div>' +
        '</div>';
    }

    roomWall.innerHTML = wallHtml;
  }

  // Centralized Preview Zoom State
  var previewZoomState = {
    currentZoom: 1.0,
    fitZoom: 1.0
  };

  function applyPreviewZoom(zoom) {
    // Allow continuous zoom out down to 20% (0.20) and zoom in up to 250% (2.50)
    var clamped = Math.max(0.20, Math.min(2.50, Math.round(zoom * 100) / 100));
    previewZoomState.currentZoom = clamped;

    var wall = document.getElementById('pvWallZoomable');
    var zoomLevelEl = document.getElementById('stageZoomLevel');

    if (wall) {
      wall.style.transform = 'scale(' + clamped + ')';
      wall.style.transformOrigin = 'center center';
    }
    if (zoomLevelEl) {
      zoomLevelEl.textContent = Math.round(clamped * 100) + '%';
    }
  }

  function calculateFitScale() {
    var stageContainer = document.getElementById('wallPreviewStageContainer');
    var zoomableWall = document.getElementById('pvWallZoomable');
    if (!stageContainer || !zoomableWall) return 1.0;

    // Available room dimensions inside stage container
    var availW = Math.max(stageContainer.clientWidth - 48, 100);
    var availH = Math.max(stageContainer.clientHeight - 70, 100);

    // Temporarily unscale wall to read actual layout dimensions
    var prevTransform = zoomableWall.style.transform;
    zoomableWall.style.transform = 'none';

    var templateW = zoomableWall.scrollWidth || zoomableWall.offsetWidth || 750;
    var templateH = zoomableWall.scrollHeight || zoomableWall.offsetHeight || 450;

    zoomableWall.style.transform = prevTransform;

    if (templateW <= 0 || templateH <= 0) return 1.0;

    var scaleX = availW / templateW;
    var scaleY = availH / templateH;

    // Safe padding so posters never touch container edges
    var fit = Math.min(scaleX, scaleY) * 0.90;

    // Sensible fit bounds
    fit = Math.max(0.20, Math.min(1.15, fit));
    return Math.round(fit * 100) / 100;
  }

  function autoFitPreviewStage() {
    var fit = calculateFitScale();
    previewZoomState.fitZoom = fit;
    applyPreviewZoom(fit);
  }

  function openWallPreviewModal() {
    var summary = calculateSummary();
    if (!summary.isComplete) {
      alert('Please upload all ' + summary.totalRequired + ' photos to preview your custom wall.');
      return;
    }
    renderWallPreviewContent();
    var modal = document.getElementById('customWallPreviewModal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Automatically compute template fit scale once modal is open in DOM
      requestAnimationFrame(function () {
        autoFitPreviewStage();
      });
    }
  }

  function closeWallPreviewModal() {
    var modal = document.getElementById('customWallPreviewModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function setupPreviewModalActions() {
    var previewBtn = document.getElementById('customPreviewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', openWallPreviewModal);
    }

    var closeBtn = document.getElementById('wallPreviewCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeWallPreviewModal);
    }

    var bottomCloseBtn = document.getElementById('wallPreviewBottomCloseBtn');
    if (bottomCloseBtn) {
      bottomCloseBtn.addEventListener('click', closeWallPreviewModal);
    }

    var checkoutBtn = document.getElementById('wallPreviewCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        closeWallPreviewModal();
        var mainCheckoutBtn = document.getElementById('customCheckoutBtn');
        if (mainCheckoutBtn) mainCheckoutBtn.click();
      });
    }

    // Zoom Controls
    var zoomInBtn = document.getElementById('stageZoomInBtn');
    var zoomOutBtn = document.getElementById('stageZoomOutBtn');
    var zoomResetBtn = document.getElementById('stageZoomResetBtn');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', function () {
        applyPreviewZoom(previewZoomState.currentZoom + 0.05);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', function () {
        applyPreviewZoom(previewZoomState.currentZoom - 0.05);
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', function () {
        applyPreviewZoom(previewZoomState.fitZoom);
      });
    }

    // Window resize auto-fit recalculation when preview is open
    window.addEventListener('resize', function () {
      var modal = document.getElementById('customWallPreviewModal');
      if (modal && modal.classList.contains('open')) {
        autoFitPreviewStage();
      }
    });

    var modal = document.getElementById('customWallPreviewModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeWallPreviewModal();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeWallPreviewModal();
      }
    });
  }

  /**
   * Template Selection Setup (5, 8, 10, 12 Cards)
   */
  function setupTemplateCards() {
    var cards = document.querySelectorAll('.template-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var count = parseInt(card.getAttribute('data-count'), 10) || 5;
        state.activeTemplate = count;

        cards.forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');

        initSlots(count);
        renderSlotsGrid();
        updateSummaryPanel();

        var modal = document.getElementById('customWallPreviewModal');
        if (modal && modal.classList.contains('open')) {
          renderWallPreviewContent();
          requestAnimationFrame(function () {
            autoFitPreviewStage();
          });
        }

        // Smooth scroll to upload step
        var uploadStep = document.getElementById('uploadStepAnchor');
        if (uploadStep) {
          uploadStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /**
   * Checkout & Cart Integration Action
   */
  /**
   * Validate Google Drive Link URL
   */
  function isValidGoogleDriveUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    var trimmed = urlStr.trim();
    if (!trimmed) return false;
    var parsed = null;
    try {
      parsed = new URL(trimmed);
    } catch (e) {
      try {
        parsed = new URL('https://' + trimmed);
      } catch (e2) {
        return false;
      }
    }
    if (!parsed || !parsed.hostname) return false;
    var host = parsed.hostname.toLowerCase();
    var isDriveHost = (host === 'drive.google.com' || host.endsWith('.drive.google.com') || host === 'docs.google.com' || host.endsWith('.docs.google.com'));
    return isDriveHost;
  }

  function validateCustomOrderForm() {
    var nameEl = document.getElementById('customCustName');
    var emailEl = document.getElementById('customCustEmail');
    var phoneEl = document.getElementById('customCustPhone');
    var addressEl = document.getElementById('customCustAddress');
    var cityEl = document.getElementById('customCustCity');
    var stateEl = document.getElementById('customCustState');
    var pincodeEl = document.getElementById('customCustPincode');
    var driveLinkEl = document.getElementById('customDriveLink');
    var errBox = document.getElementById('customFormError');

    var name = (nameEl ? nameEl.value : '').trim();
    var email = (emailEl ? emailEl.value : '').trim();
    var phone = (phoneEl ? phoneEl.value : '').trim();
    var address = (addressEl ? addressEl.value : '').trim();
    var city = (cityEl ? cityEl.value : '').trim();
    var state = (stateEl ? stateEl.value : '').trim();
    var pincode = (pincodeEl ? pincodeEl.value : '').trim();
    var driveLink = (driveLinkEl ? driveLinkEl.value : '').trim();

    // Reset highlights
    [nameEl, emailEl, phoneEl, addressEl, cityEl, stateEl, pincodeEl, driveLinkEl].forEach(function (el) {
      if (el) {
        el.style.borderColor = '#d1d5db';
        el.style.backgroundColor = '#ffffff';
      }
    });

    var showError = function (msg, targetEl) {
      if (errBox) {
        errBox.style.display = 'block';
        errBox.textContent = msg;
      }
      if (targetEl) {
        targetEl.style.borderColor = '#dc2626';
        targetEl.style.backgroundColor = '#fef2f2';
        targetEl.focus();
      }
      return false;
    };

    if (!name) return showError('Full Name is required.', nameEl);

    if (!email) return showError('Email Address is required.', emailEl);
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return showError('Please enter a valid Email Address.', emailEl);

    if (!phone) return showError('Phone Number is required.', phoneEl);
    var cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) return showError('Please enter a valid Phone Number.', phoneEl);

    if (!address) return showError('Delivery Address is required.', addressEl);
    if (!city) return showError('City is required.', cityEl);
    if (!state) return showError('State is required.', stateEl);

    if (!pincode) return showError('PIN Code is required.', pincodeEl);
    var cleanPin = pincode.replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) return showError('Please enter a valid PIN Code.', pincodeEl);

    if (!driveLink) return showError('Google Drive link is required for custom poster orders.', driveLinkEl);

    if (!isValidGoogleDriveUrl(driveLink)) {
      return showError('Please enter a valid Google Drive sharing link.', driveLinkEl);
    }

    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }

    return {
      name: name,
      email: email,
      phone: phone,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      driveLink: driveLink,
      notes: (document.getElementById('customCustNotes') ? document.getElementById('customCustNotes').value : '').trim()
    };
  }

  function openCustomOrderModal() {
    var summary = calculateSummary();
    if (!summary.isComplete) {
      alert('Please upload all ' + summary.totalRequired + ' photos and select their sizes before proceeding.');
      return;
    }

    var modalTitle = document.getElementById('customModalItemTitle');
    var modalSize = document.getElementById('customModalItemSize');
    var modalPrice = document.getElementById('customModalItemPrice');
    var modalSubtotal = document.getElementById('customModalSubtotal');
    var modalFinalTotal = document.getElementById('customModalFinalTotal');
    var modalImg = document.getElementById('customModalItemImg');

    if (modalTitle) modalTitle.textContent = state.activeTemplate + ' Custom Posters Set';
    if (modalSize) modalSize.textContent = 'Sizes: ' + summary.sizesSummary;
    if (modalPrice) modalPrice.textContent = '₹' + summary.totalPrice.toLocaleString();
    if (modalSubtotal) modalSubtotal.textContent = '₹' + summary.totalPrice.toLocaleString();
    if (modalFinalTotal) modalFinalTotal.textContent = '₹' + summary.totalPrice.toLocaleString();
    if (modalImg && state.slots[0] && state.slots[0].image) {
      modalImg.src = state.slots[0].image;
    }

    // Prefill details if user logged in
    try {
      if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
        var user = window.Auth.getCurrentUser();
        if (user) {
          if (user.displayName && document.getElementById('customCustName') && !document.getElementById('customCustName').value) {
            document.getElementById('customCustName').value = user.displayName;
          }
          if (user.email && document.getElementById('customCustEmail') && !document.getElementById('customCustEmail').value) {
            document.getElementById('customCustEmail').value = user.email;
          }
          if (user.phone && document.getElementById('customCustPhone') && !document.getElementById('customCustPhone').value) {
            document.getElementById('customCustPhone').value = user.phone;
          }
        }
      }
    } catch (e) {}

    var errBox = document.getElementById('customFormError');
    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }

    var modal = document.getElementById('customOrderModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCustomOrderModal() {
    var modal = document.getElementById('customOrderModal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  /**
   * Custom Poster Order Action (Opens Order Details Form & Hands off to WhatsApp)
   */
  function setupCheckoutAction() {
    var btn = document.getElementById('customCheckoutBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        var summary = calculateSummary();
        if (!summary.isComplete) {
          alert('Please upload all ' + summary.totalRequired + ' photos and select their sizes before proceeding.');
          return;
        }
        openCustomOrderModal();
      });
    }

    var previewCheckoutBtn = document.getElementById('wallPreviewCheckoutBtn');
    if (previewCheckoutBtn) {
      previewCheckoutBtn.addEventListener('click', function () {
        closeWallPreviewModal();
        openCustomOrderModal();
      });
    }

    var orderForm = document.getElementById('customOrderForm');
    if (orderForm && !orderForm.dataset.submitBound) {
      orderForm.dataset.submitBound = 'true';
      orderForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var formData = validateCustomOrderForm();
        if (!formData) return;

        var count = state.activeTemplate || 5;
        var summary = calculateSummary();
        var productName = 'Custom Poster Set (' + count + ' Prints)';
        var productId = 'custom-poster-set';
        var sizeStr = summary.sizesSummary;
        var qtyStr = count;
        var priceStr = summary.totalPrice.toLocaleString();

        var msgLines = [
          'Hello PINBOARD,',
          '',
          'I would like to place a Custom Poster order.',
          '',
          'CUSTOM POSTER DETAILS',
          'Product: ' + productName,
          'Product ID: ' + productId,
          'Size: ' + sizeStr,
          'Quantity: ' + qtyStr,
          'Price: ₹' + priceStr,
          '',
          'CUSTOMER DETAILS',
          'Name: ' + formData.name,
          'Email: ' + formData.email,
          'Phone: ' + formData.phone,
          '',
          'DELIVERY DETAILS',
          'Address: ' + formData.address,
          'City: ' + formData.city,
          'State: ' + formData.state,
          'PIN Code: ' + formData.pincode,
          '',
          'GOOGLE DRIVE LINK',
          formData.driveLink,
          ''
        ];

        if (formData.notes) {
          msgLines.push('ORDER NOTES');
          msgLines.push(formData.notes);
          msgLines.push('');
        }

        msgLines.push('Estimated Delivery: 3–5 days');
        msgLines.push('');
        msgLines.push('Please confirm my Custom Poster order request.');

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
        } catch (err) {
          window.location.href = waUrl;
        }

        closeCustomOrderModal();
      });
    }

    var modalClose = document.getElementById('closeCustomOrderModal');
    if (modalClose) {
      modalClose.addEventListener('click', function () {
        closeCustomOrderModal();
      });
    }

    var orderModal = document.getElementById('customOrderModal');
    if (orderModal) {
      orderModal.addEventListener('click', function (e) {
        if (e.target === orderModal) {
          closeCustomOrderModal();
        }
      });
    }
  }

  /**
   * Hero 3D Perspective Tilt
   */
  function initHero3D() {
    var heroStage = document.getElementById('customHeroStage');
    if (!heroStage) return;

    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) return;

    var isHovered = false;
    var collage = heroStage.querySelector('.custom-hero-collage');

    heroStage.addEventListener('mouseenter', function () {
      isHovered = true;
      if (collage) collage.style.transition = 'transform 0.12s ease-out, box-shadow 0.3s ease';
    });

    heroStage.addEventListener('mousemove', function (e) {
      if (!isHovered || !collage) return;
      var rect = heroStage.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      var rotY = (x * 16 - 5).toFixed(2);
      var rotX = (-y * 14 + 4).toFixed(2);

      collage.style.transform = 'translateZ(36px) rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg)';
    });

    heroStage.addEventListener('mouseleave', function () {
      isHovered = false;
      if (collage) {
        collage.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease';
        collage.style.transform = 'translateZ(30px) rotateY(-5deg) rotateX(4deg)';
      }
    });
  }

  /**
   * Studio Boot
   */
  function initStudio() {
    initSlots(state.activeTemplate);
    setupTemplateCards();
    renderSlotsGrid();
    updateSummaryPanel();
    setupCheckoutAction();
    setupPreviewModalActions();
    initHero3D();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudio);
  } else {
    initStudio();
  }
})();
