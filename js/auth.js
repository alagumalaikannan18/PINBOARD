// =========================================================================
// PINBOARD — Real Firebase Authentication & Session Layer
// =========================================================================
// Firebase Authentication is the single source of truth for user sessions.
// Passwords are never stored in localStorage or handled insecurely.
// =========================================================================

import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  firebaseConfig
} from "./firebase-config.js";

(function () {
  'use strict';

  var STORAGE_KEYS = {
    PENDING_ACTION: 'pinboard_pending_purchase_action',
    CART_PREFIX: 'pinboard_cart_items_',
    ORDERS_PREFIX: 'pinboard_customer_orders_'
  };

  function escapeAttr(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function getCartStorageKey(uid) {
    return uid ? (STORAGE_KEYS.CART_PREFIX + uid) : null;
  }

  function getOrdersStorageKey(uid) {
    return uid ? (STORAGE_KEYS.ORDERS_PREFIX + uid) : null;
  }

  var SESSION_STORAGE_KEY = 'pinboard_cached_auth_user';

  function loadCachedUser() {
    try {
      var raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.uid && parsed.isLoggedIn) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  }

  function saveCachedUser(user) {
    try {
      if (user && user.uid && user.isLoggedIn) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {}
  }

  var currentUserState = loadCachedUser();
  var isInitialAuthResolved = false;
  var authReadyCallbacks = [];

  // Default demo orders for demonstration in profile
  var DEFAULT_ORDERS = [
    {
      orderId: 'PB-2026-8941',
      date: '02 Sep 2026',
      total: 1399,
      status: 'In Transit ✈️',
      deliveryEstimate: '08 Sep 2026',
      items: [
        {
          id: 7,
          title: 'Riso Retro — Set of 3',
          subtitle: 'Retro Collection · 3 Prints',
          quantity: 1,
          price: 1399,
          image: 'New Project 22 [D8D9C72].png'
        }
      ]
    },
    {
      orderId: 'PB-2026-7712',
      date: '18 Aug 2026',
      total: 60,
      status: 'Delivered 📦',
      deliveryEstimate: '22 Aug 2026',
      items: [
        {
          id: 2,
          title: 'Bauhaus No.7',
          subtitle: 'Abstract Art · Premium Poster',
          quantity: 1,
          price: 60,
          image: 'New Project 22 [27E5039].png'
        }
      ]
    }
  ];

  /**
   * Formats raw Firebase User to PINBOARD user structure
   */
  function formatFirebaseUser(fbUser) {
    if (!fbUser) return null;
    var name = fbUser.displayName;
    if (!name && fbUser.email) {
      var emailParts = String(fbUser.email).split('@');
      var emailPrefix = emailParts[0] ? emailParts[0].replace(/[._-]/g, ' ') : 'Collector';
      name = emailPrefix.length > 0 ? (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)) : 'Pinboard Collector';
    }
    name = name || 'Pinboard Collector';

    var photoURL = fbUser.photoURL || null;
    if (!photoURL && fbUser.providerData && fbUser.providerData.length > 0) {
      for (var i = 0; i < fbUser.providerData.length; i++) {
        if (fbUser.providerData[i] && fbUser.providerData[i].photoURL) {
          photoURL = fbUser.providerData[i].photoURL;
          break;
        }
      }
    }

    var providerId = (fbUser.providerData && fbUser.providerData[0]) ? fbUser.providerData[0].providerId : 'firebase';
    var joinedDate = 'September 2026';
    if (fbUser.metadata && fbUser.metadata.creationTime) {
      joinedDate = new Date(fbUser.metadata.creationTime).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    var safeName = String(name || 'Pinboard Collector');
    var initial = safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'P';

    return {
      uid: fbUser.uid,
      isLoggedIn: true,
      name: safeName,
      email: fbUser.email || '',
      photoURL: photoURL,
      provider: providerId,
      joinedDate: joinedDate,
      avatarInitial: initial
    };
  }

  /**
   * Maps Firebase Auth error codes to user-friendly messages
   */
  function mapFirebaseError(error) {
    if (!error) return 'An unexpected error occurred. Please try again.';
    var code = error.code || '';

    // Check if configuration placeholder is still present
    if (firebaseConfig && firebaseConfig.apiKey === 'PASTE_YOUR_API_KEY_HERE') {
      return 'Firebase is not yet configured. Please paste your Firebase Project API keys into js/firebase-config.js.';
    }

    switch (code) {
      case 'auth/invalid-credential':
        return 'Incorrect email or password. (Note: If your account was created with Google, please click "Continue with Google" or use "Forgot / Set Password?" to set a password for this email).';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify your password or use "Forgot / Set Password?".';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or click "Create Account".';
      case 'auth/user-disabled':
        return 'This account has been disabled by administrator. Please contact support.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in instead, or use "Forgot / Set Password?" if you need to set a password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address format (e.g. name@gmail.com).';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completing authentication. Please try again.';
      case 'auth/popup-blocked':
        return 'Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
      case 'auth/cancelled-popup-request':
        return 'Google sign-in was cancelled. Please try again.';
      case 'auth/unauthorized-domain':
        return 'Deployment domain unauthorized. Please add this domain (' + window.location.hostname + ') to Firebase Console → Authentication → Settings → Authorized domains.';
      case 'auth/operation-not-allowed':
        return 'Email/Password provider is not enabled in Firebase Console. Please go to Firebase Console → Authentication → Sign-in method and enable "Email/Password".';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password.';
      case 'auth/api-key-not-valid.':
      case 'auth/invalid-api-key':
        return 'Invalid Firebase API Key. Please verify your Firebase project credentials in js/firebase-config.js.';
      default:
        return error.message || 'Authentication failed. Please verify your credentials and try again.';
    }
  }

  var Auth = {
    /**
     * Check if user is currently logged in (Synchronous)
     * @returns {boolean}
     */
    isLoggedIn: function () {
      if (auth && auth.currentUser) return true;
      return !!(currentUserState && currentUserState.isLoggedIn);
    },

    /**
     * Get current user profile
     * @returns {object|null}
     */
    getUser: function () {
      if (auth && auth.currentUser) {
        return formatFirebaseUser(auth.currentUser);
      }
      return currentUserState;
    },

    /**
     * Wait for Firebase to finish initial session check
     * @returns {Promise<object|null>}
     */
    waitForAuth: function () {
      if (isInitialAuthResolved) {
        return Promise.resolve(this.getUser());
      }
      return new Promise(function (resolve) {
        authReadyCallbacks.push(resolve);
      });
    },

    /**
     * Real Firebase Email & Password Sign In
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>} { success: boolean, message?: string, user?: object, code?: string }
     */
    login: async function (email, password) {
      var cleanEmail = (email || '').trim();
      var cleanPassword = password || '';

      if (!cleanEmail) {
        return { success: false, message: 'Please enter your email or Gmail address.' };
      }
      if (!cleanPassword) {
        return { success: false, message: 'Please enter your password.' };
      }

      if (!auth) {
        console.error('[Firebase Auth] Auth instance is not initialized.');
        return { success: false, message: 'Firebase Authentication is not initialized. Please configure js/firebase-config.js.' };
      }

      try {
        console.log('[Firebase Auth] Attempting signInWithEmailAndPassword for:', cleanEmail);
        var userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        console.log('[Firebase Auth] Email/Password Sign-In Success! UID:', userCredential.user.uid);
        var user = formatFirebaseUser(userCredential.user);
        currentUserState = user;
        saveCachedUser(user);
        this.updateNavbar();
        this._emitStateChange();
        return { success: true, user: user };
      } catch (error) {
        console.error('[Firebase Auth] Email/Password Login Failed! Error details:', {
          errorCode: error.code,
          errorMessage: error.message,
          email: cleanEmail
        });
        return {
          success: false,
          code: error.code,
          message: mapFirebaseError(error),
          rawError: error
        };
      }
    },

    /**
     * Real Firebase Google Sign-In with Official Account Popup
     * @returns {Promise<object>} { success: boolean, message?: string, user?: object, code?: string }
     */
    loginWithGoogle: async function () {
      if (!auth || !googleProvider) {
        console.error('[Firebase Auth] Google Auth Provider is not initialized.');
        return { success: false, message: 'Firebase Google Auth is not initialized. Please configure js/firebase-config.js.' };
      }

      try {
        console.log('[Firebase Auth] Opening Google Sign-In Popup...');
        var result = await signInWithPopup(auth, googleProvider);
        console.log('[Firebase Auth] Google Sign-In Success! UID:', result.user.uid, 'Email:', result.user.email);
        var user = formatFirebaseUser(result.user);
        currentUserState = user;
        saveCachedUser(user);
        this.updateNavbar();
        this._emitStateChange();
        return { success: true, user: user };
      } catch (error) {
        console.error('[Firebase Auth] Google Sign-In Failed! Error details:', {
          errorCode: error.code,
          errorMessage: error.message
        });
        return {
          success: false,
          code: error.code,
          message: mapFirebaseError(error),
          rawError: error
        };
      }
    },

    /**
     * Real Firebase Email & Password Account Registration
     * @param {string} name
     * @param {string} email
     * @param {string} password
     * @param {string} confirmPassword
     * @returns {Promise<object>} { success: boolean, message?: string, user?: object, code?: string }
     */
    register: async function (name, email, password, confirmPassword) {
      var cleanName = (name || '').trim();
      var cleanEmail = (email || '').trim();
      var cleanPassword = password || '';
      var cleanConfirm = confirmPassword || '';

      if (!cleanName) {
        return { success: false, message: 'Please enter your full name.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, message: 'Please enter a valid email address.' };
      }
      if (!cleanPassword || cleanPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }
      if (cleanPassword !== cleanConfirm) {
        return { success: false, message: 'Passwords do not match. Please re-enter.' };
      }

      if (!auth) {
        console.error('[Firebase Auth] Auth instance is not initialized.');
        return { success: false, message: 'Firebase Authentication is not initialized. Please configure js/firebase-config.js.' };
      }

      try {
        console.log('[Firebase Auth] Attempting createUserWithEmailAndPassword for:', cleanEmail);
        var userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        console.log('[Firebase Auth] User Created Successfully! UID:', userCredential.user.uid);

        // Update user display name in Firebase profile
        if (cleanName) {
          try {
            await updateProfile(userCredential.user, {
              displayName: cleanName
            });
          } catch (profileErr) {
            console.warn('[Firebase Auth] Profile name update notice:', profileErr);
          }
        }

        var user = formatFirebaseUser(userCredential.user);
        user.name = cleanName;
        currentUserState = user;
        saveCachedUser(user);
        this.updateNavbar();
        this._emitStateChange();
        return { success: true, user: user };
      } catch (error) {
        console.error('[Firebase Auth] Registration Failed! Error details:', {
          errorCode: error.code,
          errorMessage: error.message,
          email: cleanEmail
        });
        return {
          success: false,
          code: error.code,
          message: mapFirebaseError(error),
          rawError: error
        };
      }
    },

    /**
     * Send Password Reset / Set Password Email (for forgotten passwords or Google accounts wanting a password)
     * @param {string} email
     * @returns {Promise<object>} { success: boolean, message?: string, code?: string }
     */
    sendPasswordReset: async function (email) {
      var cleanEmail = (email || '').trim();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, message: 'Please enter a valid email address to receive the password setup link.' };
      }

      if (!auth) {
        console.error('[Firebase Auth] Auth instance is not initialized.');
        return { success: false, message: 'Firebase Authentication is not initialized. Please configure js/firebase-config.js.' };
      }

      try {
        console.log('[Firebase Auth] Sending password reset/setup email to:', cleanEmail);
        await sendPasswordResetEmail(auth, cleanEmail);
        console.log('[Firebase Auth] Password reset email sent successfully to:', cleanEmail);
        return {
          success: true,
          message: 'Password link sent to ' + cleanEmail + '! Please check your inbox (and spam folder) to set or reset your password.'
        };
      } catch (error) {
        console.error('[Firebase Auth] Password Reset Error details:', {
          errorCode: error.code,
          errorMessage: error.message,
          email: cleanEmail
        });
        return {
          success: false,
          code: error.code,
          message: mapFirebaseError(error),
          rawError: error
        };
      }
    },

    /**
     * Real Firebase Sign Out
     * @returns {Promise<object>}
     */
    logout: async function () {
      if (auth) {
        try {
          await signOut(auth);
        } catch (e) {
          console.error('Firebase SignOut Error:', e);
        }
      }
      currentUserState = null;
      saveCachedUser(null);
      this.updateNavbar();
      this._emitStateChange();
      this._emitCartChange();
      return { success: true };
    },

    // ===================================================
    // PENDING PURCHASE ACTION MANAGEMENT
    // ===================================================

    /**
     * Store pending action before login redirect
     * @param {object} actionData
     */
    setPendingAction: function (actionData) {
      if (!actionData) return;
      actionData.timestamp = Date.now();
      try {
        localStorage.setItem(STORAGE_KEYS.PENDING_ACTION, JSON.stringify(actionData));
      } catch (e) {
        console.error('Error saving pending action:', e);
      }
    },

    /**
     * Retrieve pending action
     * @returns {object|null}
     */
    getPendingAction: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEYS.PENDING_ACTION);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp > 2 * 60 * 60 * 1000)) {
          this.clearPendingAction();
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    },

    /**
     * Clear pending action
     */
    clearPendingAction: function () {
      try {
        localStorage.removeItem(STORAGE_KEYS.PENDING_ACTION);
      } catch (e) {
        console.error('Error clearing pending action:', e);
      }
    },

    // ===================================================
    // USER-SPECIFIC CART & ORDERS MANAGEMENT
    // Primary identifier: authenticated user's UID
    // ===================================================

    _getAuthHeaders: function () {
      var headers = { 'Content-Type': 'application/json' };
      var user = this.getUser();
      if (user && user.uid) {
        headers['x-user-id'] = user.uid;
        headers['Authorization'] = 'Bearer ' + user.uid;
      }
      return headers;
    },

    /**
     * Retrieve cart strictly for the current (or specified) authenticated user
     * @param {string} [targetUid]
     * @returns {Array}
     */
    getCart: function (targetUid) {
      var user = this.getUser();
      var uid = targetUid || (user ? user.uid : null);
      if (!uid) {
        return [];
      }
      try {
        var key = getCartStorageKey(uid);
        var raw = localStorage.getItem(key);
        if (!raw) {
          return [];
        }
        return JSON.parse(raw) || [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Check if product is in current authenticated user's cart
     * @param {string|number} productId
     * @param {string} [targetUid]
     * @returns {boolean}
     */
    isInCart: function (productId, targetUid) {
      if (productId === undefined || productId === null || productId === '') return false;
      var cart = this.getCart(targetUid);
      var id = parseInt(productId, 10);
      return cart.some(function (item) {
        if (!isNaN(id) && (item.id === id || item.productId === id)) return true;
        return String(item.id || item.productId) === String(productId);
      });
    },

    /**
     * Add poster to current user's isolated cart (with strict duplicate prevention)
     * @param {string|number} productId
     * @param {number} quantity
     * @returns {object}
     */
    addToCart: function (productId, quantity) {
      var user = this.getUser();
      if (!user || !user.uid) {
        console.warn('[PINBOARD Auth] Protected action: User must be authenticated to add items to cart.');
        return { success: false, requireAuth: true, message: 'Please log in to add items to your cart.', cart: [] };
      }

      var uid = user.uid;
      var qty = parseInt(quantity, 10) || 1;
      var cart = this.getCart(uid);
      var id = parseInt(productId, 10);

      var existing = cart.find(function (item) {
        if (!isNaN(id) && (item.id === id || item.productId === id)) return true;
        return String(item.id || item.productId) === String(productId);
      });

      // Strict duplicate prevention per authenticated user
      if (existing) {
        return { success: false, alreadyInCart: true, cart: cart };
      }

      var product = (typeof getProductById === 'function') ? getProductById(id || productId) : null;
      var price = product ? (product.salePrice || product.regularPrice) : 60;
      var title = product ? product.title : ('Poster #' + productId);
      var img = (product && product.images && product.images.length > 0) ? product.images[0] : 'New Project 22 [FA6B4A7].png';

      var newItem = {
        id: isNaN(id) ? productId : id,
        productId: isNaN(id) ? productId : id,
        title: title,
        quantity: qty,
        price: price,
        image: img
      };

      cart.push(newItem);

      try {
        localStorage.setItem(getCartStorageKey(uid), JSON.stringify(cart));
      } catch (e) {
        console.error('Error saving user cart:', e);
      }

      this.updateNavbar();
      this._emitCartChange();

      // Sync with backend API under user UID
      try {
        if (typeof fetch === 'function') {
          fetch('/api/cart', {
            method: 'POST',
            headers: this._getAuthHeaders(),
            body: JSON.stringify({
              productId: newItem.id,
              quantity: qty,
              title: title,
              price: price,
              image: img
            })
          }).catch(function () {});
        }
      } catch (e) {}

      return { success: true, alreadyInCart: false, cart: cart };
    },

    /**
     * Add Custom Personalized Poster Order to user's cart
     * @param {object} customOrder
     * @returns {object}
     */
    addCustomPostersToCart: function (customOrder) {
      var user = this.getUser();
      if (!user || !user.uid) {
        console.warn('[PINBOARD Auth] User must be authenticated to add custom posters to cart.');
        return { success: false, requireAuth: true, message: 'Please log in to add your custom poster collection to cart.', cart: [] };
      }

      var uid = user.uid;
      var cart = this.getCart(uid);
      var customId = 'custom-' + Date.now();

      var newItem = {
        id: customId,
        productId: customId,
        isCustom: true,
        title: customOrder.title || ('Custom Poster Set (' + (customOrder.template || 5) + ' Prints)'),
        subtitle: customOrder.subtitle || ('Custom Wall Layout · ' + (customOrder.sizesSummary || '')),
        quantity: 1,
        price: customOrder.totalPrice || 1499,
        image: customOrder.coverImage || 'New Project 22 [FA6B4A7].png',
        template: customOrder.template || 5,
        posters: customOrder.posters || [],
        sizesSummary: customOrder.sizesSummary || ''
      };

      cart.push(newItem);

      try {
        localStorage.setItem(getCartStorageKey(uid), JSON.stringify(cart));
      } catch (e) {
        console.error('Error saving custom poster cart:', e);
      }

      this.updateNavbar();
      this._emitCartChange();

      // Sync with backend API
      try {
        if (typeof fetch === 'function') {
          fetch('/api/cart', {
            method: 'POST',
            headers: this._getAuthHeaders(),
            body: JSON.stringify({
              productId: newItem.id,
              quantity: 1,
              title: newItem.title,
              price: newItem.price,
              image: newItem.image
            })
          }).catch(function () {});
        }
      } catch (e) {}

      return { success: true, item: newItem, cart: cart };
    },

    /**
     * Remove item from current user's cart
     * @param {string|number} productId
     * @returns {Array}
     */
    removeFromCart: function (productId) {
      var user = this.getUser();
      if (!user || !user.uid) return [];
      var uid = user.uid;
      var id = parseInt(productId, 10);
      var cart = this.getCart(uid);
      var filtered = cart.filter(function (item) {
        if (!isNaN(id) && (item.id === id || item.productId === id)) return false;
        return String(item.id || item.productId) !== String(productId);
      });

      try {
        localStorage.setItem(getCartStorageKey(uid), JSON.stringify(filtered));
      } catch (e) {
        console.error('Error removing from user cart:', e);
      }

      this.updateNavbar();
      this._emitCartChange();

      // Sync with backend API
      try {
        if (typeof fetch === 'function') {
          fetch('/api/cart/' + encodeURIComponent(productId), {
            method: 'DELETE',
            headers: this._getAuthHeaders()
          }).catch(function () {});
        }
      } catch (e) {}

      return filtered;
    },

    /**
     * Update quantity of a product in the current user's cart
     * @param {string|number} productId
     * @param {number} quantity
     * @returns {Array}
     */
    updateCartQuantity: function (productId, quantity) {
      var user = this.getUser();
      if (!user || !user.uid) return [];
      var uid = user.uid;
      var qty = parseInt(quantity, 10);
      var id = parseInt(productId, 10);

      if (isNaN(qty) || qty <= 0) {
        return this.removeFromCart(productId);
      }

      var cart = this.getCart(uid);
      var updated = false;

      cart.forEach(function (item) {
        if ((!isNaN(id) && (item.id === id || item.productId === id)) || String(item.id || item.productId) === String(productId)) {
          item.quantity = qty;
          updated = true;
        }
      });

      if (updated) {
        try {
          localStorage.setItem(getCartStorageKey(uid), JSON.stringify(cart));
        } catch (e) {
          console.error('Error updating cart quantity:', e);
        }

        this.updateNavbar();
        this._emitCartChange();

        // Sync with backend API
        try {
          if (typeof fetch === 'function') {
            fetch('/api/cart/' + encodeURIComponent(productId), {
              method: 'PATCH',
              headers: this._getAuthHeaders(),
              body: JSON.stringify({ quantity: qty })
            }).catch(function () {});
          }
        } catch (e) {}
      }

      return cart;
    },

    /**
     * Calculate total price of current user's cart
     * @param {string} [targetUid]
     * @returns {number}
     */
    getCartTotal: function (targetUid) {
      var cart = this.getCart(targetUid);
      var totalPosterQty = 0;
      var customTotal = 0;
      cart.forEach(function (item) {
        var qty = Number(item.quantity) || 1;
        if (item.isCustom) {
          customTotal += (Number(item.price) || 1499) * qty;
        } else {
          totalPosterQty += qty;
        }
      });
      var comboSets = Math.floor(totalPosterQty / 3);
      var rem = totalPosterQty % 3;
      var postersTotal = (comboSets * 150) + (rem * 60);
      return postersTotal + customTotal;
    },

    /**
     * Clear current user's cart
     * @returns {Array}
     */
    clearCart: function () {
      var user = this.getUser();
      if (user && user.uid) {
        try {
          localStorage.setItem(getCartStorageKey(user.uid), JSON.stringify([]));
        } catch (e) {}
      }
      this.updateNavbar();
      this._emitCartChange();

      // Sync with backend API
      try {
        if (typeof fetch === 'function') {
          fetch('/api/cart', {
            method: 'DELETE',
            headers: this._getAuthHeaders()
          }).catch(function () {});
        }
      } catch (e) {}

      return [];
    },

    /**
     * Get cart count for current user (0 if logged out)
     * @param {string} [targetUid]
     * @returns {number}
     */
    getCartCount: function (targetUid) {
      var cart = this.getCart(targetUid);
      return cart.length;
    },

    _emitCartChange: function () {
      try {
        var event = new CustomEvent('auth:cartchange', { detail: { cart: this.getCart(), count: this.getCartCount() } });
        window.dispatchEvent(event);
      } catch (e) {}
    },

    /**
     * Retrieve orders for current user
     * @param {string} [targetUid]
     * @returns {Array}
     */
    getOrders: function (targetUid) {
      var user = this.getUser();
      var uid = targetUid || (user ? user.uid : null);
      if (!uid) return [];
      try {
        var key = getOrdersStorageKey(uid);
        var raw = localStorage.getItem(key);
        if (!raw) return DEFAULT_ORDERS;
        return JSON.parse(raw) || DEFAULT_ORDERS;
      } catch (e) {
        return DEFAULT_ORDERS;
      }
    },

    /**
     * Create order for current user
     * @param {string|number} productId
     * @param {number} quantity
     * @returns {object|null}
     */
    createOrder: function (productId, quantity) {
      var user = this.getUser();
      if (!user || !user.uid) {
        console.warn('[PINBOARD Auth] Protected action: User must be authenticated to create an order.');
        return null;
      }

      var uid = user.uid;
      var qty = parseInt(quantity) || 1;
      var id = parseInt(productId);
      var product = (typeof getProductById === 'function') ? getProductById(id) : null;
      var price = product ? (product.salePrice || product.regularPrice) : 60;
      var title = product ? product.title : ('Poster #' + id);
      var img = (product && product.images && product.images.length > 0) ? product.images[0] : 'New Project 22 [FA6B4A7].png';

      var now = new Date();
      var est = new Date();
      est.setDate(now.getDate() + 4);

      var orderTotal = (Math.floor(qty / 3) * 150) + ((qty % 3) * 60);

      var newOrder = {
        orderId: 'PB-2026-' + Math.floor(1000 + Math.random() * 9000),
        date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        total: orderTotal,
        totalAmount: orderTotal,
        status: 'Confirmed ⚡',
        orderStatus: 'Confirmed ⚡',
        deliveryEstimate: est.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        items: [
          {
            id: id,
            productId: id,
            title: title,
            subtitle: product ? product.subtitle : 'Premium Matte Poster',
            quantity: qty,
            price: price,
            image: img
          }
        ]
      };

      var orders = this.getOrders(uid);
      orders.unshift(newOrder);
      try {
        localStorage.setItem(getOrdersStorageKey(uid), JSON.stringify(orders));
      } catch (e) {}

      // Sync with backend API
      try {
        if (typeof fetch === 'function') {
          fetch('/api/orders', {
            method: 'POST',
            headers: this._getAuthHeaders(),
            body: JSON.stringify({
              productId: id,
              quantity: qty
            })
          }).catch(function () {});
        }
      } catch (e) {}

      return newOrder;
    },

    // ===================================================
    // UI UPDATES & DYNAMIC NAVBAR PROFILE / CART OBSERVER
    // ===================================================

    updateNavbar: function () {
      var user = this.getUser();
      var cartCount = this.getCartCount();

      // Update cart count badge strictly for the currently logged-in user
      var countEls = document.querySelectorAll('.cart-count');
      countEls.forEach(function (el) {
        el.textContent = cartCount;
      });

      // Bind cart button clicks across all pages
      var cartBtns = document.querySelectorAll('[aria-label="Cart"], .cart-btn, #navCartBtn');
      cartBtns.forEach(function (btn) {
        if (!btn.dataset.cartBound) {
          btn.dataset.cartBound = 'true';
          btn.addEventListener('click', function (e) {
            if (window.location.pathname.endsWith('cart.html') || window.location.pathname.endsWith('/cart')) {
              return;
            }
            e.preventDefault();
            window.location.href = 'cart.html';
          });
        }
      });

      // Update account icon buttons with user's real profile photo or fallback
      var accountBtns = document.querySelectorAll('[aria-label="Account"], .account-btn, #navAccountBtn');
      accountBtns.forEach(function (btn) {
        btn.setAttribute('title', user ? ('Logged in as ' + user.name) : 'Sign In / Account');

        if (user && user.isLoggedIn) {
          btn.classList.add('is-logged-in');

          if (user.photoURL) {
            // User authenticated with Google or custom profile photo
            btn.innerHTML =
              '<div class="nav-avatar-wrap" title="Logged in as ' + escapeAttr(user.name) + '">' +
                '<img src="' + escapeAttr(user.photoURL) + '" alt="' + escapeAttr(user.name) + '" class="nav-avatar-img" referrerpolicy="no-referrer" />' +
              '</div>';

            // Graceful fallback if image fails to load
            var imgEl = btn.querySelector('.nav-avatar-img');
            if (imgEl) {
              imgEl.addEventListener('error', function () {
                var wrap = btn.querySelector('.nav-avatar-wrap');
                if (wrap) {
                  wrap.innerHTML = '<span class="nav-avatar-initial">' + escapeHtml(user.avatarInitial || 'P') + '</span>';
                }
              });
            }
          } else {
            // Email/Password or account without photoURL -> show initial avatar
            btn.innerHTML =
              '<div class="nav-avatar-wrap" title="Logged in as ' + escapeAttr(user.name) + '">' +
                '<span class="nav-avatar-initial">' + escapeHtml(user.avatarInitial || 'P') + '</span>' +
              '</div>';
          }
        } else {
          // Logged out / Guest -> restore clean default SVG account icon
          btn.classList.remove('is-logged-in');
          btn.innerHTML =
            '<svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<circle cx="12" cy="12" r="10"></circle>' +
              '<circle cx="12" cy="10" r="3.2"></circle>' +
              '<path d="M6 18.5a6 6 0 0 1 12 0"></path>' +
            '</svg>';
        }

        if (btn.tagName.toLowerCase() === 'button' && !btn.dataset.authBound) {
          btn.dataset.authBound = 'true';
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'account.html';
          });
        }
      });
    },

    setUser: function (user) {
      if (user) {
        currentUserState = {
          uid: user.uid || 'usr_' + Date.now(),
          isLoggedIn: true,
          name: user.name || user.displayName || 'Pinboard Collector',
          email: user.email || '',
          photoURL: user.photoURL || null,
          provider: user.provider || 'firebase',
          joinedDate: user.joinedDate || 'September 2026',
          avatarInitial: (user.name || user.displayName || 'P').charAt(0).toUpperCase()
        };
        saveCachedUser(currentUserState);
      } else {
        currentUserState = null;
        saveCachedUser(null);
      }
      this.updateNavbar();
      this._emitStateChange();
      this._emitCartChange();
      return currentUserState;
    },

    _emitStateChange: function () {
      try {
        var event = new CustomEvent('auth:statechange', { detail: { user: this.getUser() } });
        window.dispatchEvent(event);
      } catch (e) {}
    }
  };

  // Expose globally for PINBOARD scripts
  window.PinboardAuth = Auth;
  window.Auth = Auth;

  // Real Firebase Auth State Observer
  if (auth && typeof onAuthStateChanged === 'function') {
    onAuthStateChanged(auth, function (firebaseUser) {
      if (firebaseUser) {
        var newUser = formatFirebaseUser(firebaseUser);
        currentUserState = newUser;
        saveCachedUser(newUser);
      } else if (!currentUserState) {
        currentUserState = null;
        saveCachedUser(null);
      }
      isInitialAuthResolved = true;

      // Resolve any pending waitForAuth promises
      while (authReadyCallbacks.length > 0) {
        var cb = authReadyCallbacks.shift();
        try { cb(currentUserState); } catch (e) {}
      }

      Auth.updateNavbar();
      Auth._emitStateChange();
      Auth._emitCartChange();
    });
  } else {
    isInitialAuthResolved = true;
    while (authReadyCallbacks.length > 0) {
      var cb = authReadyCallbacks.shift();
      try { cb(currentUserState); } catch (e) {}
    }
  }

  // Auto-init navbar on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      Auth.updateNavbar();
    });
  } else {
    Auth.updateNavbar();
  }

  // Cross-tab sync for cart
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf('pinboard_cart_items') !== -1) {
      Auth.updateNavbar();
    }
  });
})();

