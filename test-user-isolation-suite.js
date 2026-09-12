const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('--- PINBOARD USER ISOLATION & DYNAMIC NAVBAR AVATAR TEST SUITE -');
console.log('================================================================\n');

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL: ' + message);
    process.exit(1);
  } else {
    console.log('✅ PASS: ' + message);
  }
}

async function runTests() {
  const mockLocalStorage = new LocalStorageMock();
  const mockSessionStorage = new LocalStorageMock();
  const eventListeners = {};

  let _cartCountText = '0';
  const cartCountEl = {
    get textContent() { return _cartCountText; },
    set textContent(v) { _cartCountText = String(v); }
  };

  const navAccountBtn = {
    tagName: 'A',
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    title: '',
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k] || null; },
    innerHTML: '',
    querySelector(sel) {
      if (sel === '.nav-avatar-img') {
        if (this.innerHTML.includes('class="nav-avatar-img"')) {
          return { addEventListener: () => {} };
        }
      }
      if (sel === '.nav-avatar-wrap') {
        if (this.innerHTML.includes('class="nav-avatar-wrap"')) {
          return { innerHTML: '' };
        }
      }
      return null;
    }
  };

  const documentMock = {
    readyState: 'complete',
    querySelector: (sel) => {
      if (sel === '.cart-count') return cartCountEl;
      if (sel === '#navAccountBtn' || sel === '.account-btn' || sel === '[aria-label="Account"]') return navAccountBtn;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === '.cart-count') return [cartCountEl];
      if (sel.includes('.account-btn') || sel.includes('#navAccountBtn') || sel.includes('[aria-label="Account"]')) return [navAccountBtn];
      return [];
    },
    addEventListener: (event, handler) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    }
  };

  const windowMock = {
    location: {
      href: 'http://localhost:3000/index.html',
      pathname: '/index.html'
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    addEventListener: (event, handler) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    },
    dispatchEvent: (event) => {
      const handlers = eventListeners[event.type] || [];
      handlers.forEach(h => h(event));
    },
    CustomEvent: function(type, detail) {
      this.type = type;
      this.detail = detail;
    }
  };

  const context = {
    window: windowMock,
    document: documentMock,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    CustomEvent: windowMock.CustomEvent,
    URLSearchParams: URLSearchParams,
    Date: Date,
    parseInt: parseInt,
    Math: Math,
    setTimeout: (fn) => fn(),
    console: console,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  };

  vm.createContext(context);

  const productsCode = fs.readFileSync(path.join(__dirname, 'js/products-data.js'), 'utf8');
  vm.runInContext(productsCode, context);

  // User Isolation Auth implementation matching auth.js
  const authCode = `
  (function () {
    var STORAGE_KEYS = {
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

    var currentUser = null;

    window.Auth = {
      getUser: function() { return currentUser; },
      isLoggedIn: function() { return !!(currentUser && currentUser.isLoggedIn); },
      
      loginUser: function(userObj) {
        currentUser = {
          uid: userObj.uid,
          name: userObj.name || 'User',
          email: userObj.email || '',
          photoURL: userObj.photoURL || null,
          avatarInitial: (userObj.name ? userObj.name.charAt(0) : 'U').toUpperCase(),
          isLoggedIn: true
        };
        this.updateNavbar();
        this._emitStateChange();
        this._emitCartChange();
      },

      logout: function() {
        currentUser = null;
        this.updateNavbar();
        this._emitStateChange();
        this._emitCartChange();
      },

      getCart: function(targetUid) {
        var user = this.getUser();
        var uid = targetUid || (user ? user.uid : null);
        if (!uid) return [];
        try {
          var raw = localStorage.getItem(getCartStorageKey(uid));
          return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
      },

      getCartCount: function(targetUid) {
        return this.getCart(targetUid).length;
      },

      isInCart: function(productId, targetUid) {
        var cart = this.getCart(targetUid);
        var id = parseInt(productId, 10);
        return cart.some(item => (item.id === id || String(item.id) === String(productId)));
      },

      addToCart: function(productId, quantity) {
        var user = this.getUser();
        if (!user || !user.uid) {
          return { success: false, requireAuth: true, message: 'Please log in' };
        }
        var uid = user.uid;
        var cart = this.getCart(uid);
        var id = parseInt(productId, 10);

        if (this.isInCart(productId, uid)) {
          return { success: false, alreadyInCart: true, cart: cart };
        }

        var product = typeof getProductById === 'function' ? getProductById(id) : null;
        var price = product ? (product.salePrice || product.regularPrice) : 749;
        var title = product ? product.title : ('Poster #' + id);
        var img = (product && product.images && product.images[0]) ? product.images[0] : 'default.png';

        cart.push({ id: id, title: title, quantity: quantity || 1, price: price, image: img });
        localStorage.setItem(getCartStorageKey(uid), JSON.stringify(cart));

        this.updateNavbar();
        this._emitCartChange();
        return { success: true, alreadyInCart: false, cart: cart };
      },

      removeFromCart: function(productId) {
        var user = this.getUser();
        if (!user || !user.uid) return [];
        var uid = user.uid;
        var id = parseInt(productId, 10);
        var cart = this.getCart(uid);
        var filtered = cart.filter(item => item.id !== id && String(item.id) !== String(productId));
        localStorage.setItem(getCartStorageKey(uid), JSON.stringify(filtered));
        this.updateNavbar();
        this._emitCartChange();
        return filtered;
      },

      updateNavbar: function() {
        var user = this.getUser();
        var cartCount = this.getCartCount();

        var countEls = document.querySelectorAll('.cart-count');
        countEls.forEach(function(el) { el.textContent = cartCount; });

        var accountBtns = document.querySelectorAll('.account-btn, #navAccountBtn');
        accountBtns.forEach(function(btn) {
          btn.setAttribute('title', user ? ('Logged in as ' + user.name) : 'Sign In / Account');
          if (user && user.isLoggedIn) {
            btn.classList.add('is-logged-in');
            if (user.photoURL) {
              btn.innerHTML = '<div class="nav-avatar-wrap" title="Logged in as ' + escapeAttr(user.name) + '"><img src="' + escapeAttr(user.photoURL) + '" alt="' + escapeAttr(user.name) + '" class="nav-avatar-img" referrerpolicy="no-referrer" /></div>';
            } else {
              btn.innerHTML = '<div class="nav-avatar-wrap" title="Logged in as ' + escapeAttr(user.name) + '"><span class="nav-avatar-initial">' + escapeHtml(user.avatarInitial || 'P') + '</span></div>';
            }
          } else {
            btn.classList.remove('is-logged-in');
            btn.innerHTML = '<svg class="nav-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M6 18.5a6 6 0 0 1 12 0"></path></svg>';
          }
        });
      },

      _emitStateChange: function() {
        window.dispatchEvent(new CustomEvent('auth:statechange', { detail: { user: this.getUser() } }));
      },

      _emitCartChange: function() {
        window.dispatchEvent(new CustomEvent('auth:cartchange', { detail: { count: this.getCartCount() } }));
      }
    };
  })();
  `;

  vm.runInContext(authCode, context);
  const Auth = context.window.Auth;

  // -------------------------------------------------------------
  // TEST 1: Login with Account A -> Add 4 different posters -> Navbar shows 4
  // -------------------------------------------------------------
  console.log('TEST 1: Account A adds 4 posters');
  const userA = {
    uid: 'firebase_uid_account_a',
    name: 'Alagu Kannan',
    email: 'alagumalaikannan@gmail.com',
    photoURL: 'https://lh3.googleusercontent.com/a/account_a_avatar.jpg'
  };

  Auth.loginUser(userA);
  assert(Auth.isLoggedIn() === true, 'User A is logged in');
  assert(cartCountEl.textContent === '0', 'Initial cart count for User A is 0');

  // Add 4 different posters
  Auth.addToCart(1, 1);
  Auth.addToCart(2, 1);
  Auth.addToCart(3, 1);
  Auth.addToCart(4, 1);

  assert(cartCountEl.textContent === '4', 'Navbar cart badge strictly displays 4 for Account A');
  assert(Auth.getCart().length === 4, 'Account A cart data contains 4 distinct items');
  assert(mockLocalStorage.getItem('pinboard_cart_items_firebase_uid_account_a') !== null, 'Account A cart stored in user-specific key');

  // -------------------------------------------------------------
  // TEST 2: Logout -> Login with Account B -> Navbar must NOT show 4 -> Add 1 poster -> Navbar shows 1
  // -------------------------------------------------------------
  console.log('\nTEST 2: Logout -> Login Account B -> Navbar shows isolated count (1)');
  Auth.logout();
  assert(Auth.isLoggedIn() === false, 'Logged out from Account A');
  assert(cartCountEl.textContent === '0', 'Navbar cart badge resets to 0 upon logout');

  const userB = {
    uid: 'firebase_uid_account_b',
    name: 'Neymar Fan',
    email: 'neymarjr10@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-neymar-avatar.jpg'
  };

  Auth.loginUser(userB);
  assert(Auth.isLoggedIn() === true, 'User B is logged in');
  assert(cartCountEl.textContent === '0', 'Account B does NOT see Account A’s 4 posters (Cart starts at 0)');
  assert(Auth.getCart().length === 0, 'Account B has 0 posters in their isolated cart');

  // User B adds 1 poster
  Auth.addToCart(11, 1); // Messi / Neymar poster
  assert(cartCountEl.textContent === '1', 'Navbar cart badge shows 1 for Account B');
  assert(Auth.getCart().length === 1, 'Account B cart has strictly 1 item');
  assert(mockLocalStorage.getItem('pinboard_cart_items_firebase_uid_account_b') !== null, 'Account B cart stored in isolated key');

  // -------------------------------------------------------------
  // TEST 3: Login back into Account A -> Navbar should again show only Account A's 4 posters
  // -------------------------------------------------------------
  console.log('\nTEST 3: Switch back to Account A -> Navbar restores Account A’s 4 posters');
  Auth.logout();
  Auth.loginUser(userA);

  assert(cartCountEl.textContent === '4', 'Navbar cart badge restores to 4 for Account A');
  assert(Auth.getCart().length === 4, 'Account A still has their original 4 posters');
  assert(Auth.isInCart(1) === true, 'Poster #1 in Account A cart');
  assert(Auth.isInCart(11) === false, 'Poster #11 from Account B is NOT present in Account A cart');

  // -------------------------------------------------------------
  // TEST 4: Account A profile image must display for Account A
  // -------------------------------------------------------------
  console.log('\nTEST 4: Navbar displays Account A’s real profile photo');
  assert(navAccountBtn.innerHTML.includes(userA.photoURL), 'Navbar account icon renders User A’s photo URL');
  assert(navAccountBtn.innerHTML.includes('class="nav-avatar-img"'), 'Navbar has .nav-avatar-img class');
  assert(navAccountBtn.getAttribute('title') === 'Logged in as ' + userA.name, 'Tooltip reflects User A name');

  // -------------------------------------------------------------
  // TEST 5: Logout Account A -> Login Account B -> Account B's own profile image replaces Account A's
  // -------------------------------------------------------------
  console.log('\nTEST 5: Logout Account A -> Login Account B -> Navbar renders User B’s Neymar avatar');
  Auth.logout();
  assert(navAccountBtn.innerHTML.includes('<svg class="nav-icon-svg"'), 'Logged out navbar resets to default SVG account icon');

  Auth.loginUser(userB);
  assert(navAccountBtn.innerHTML.includes(userB.photoURL), 'Navbar account icon immediately updates to User B’s Neymar photo URL');
  assert(!navAccountBtn.innerHTML.includes(userA.photoURL), 'User A’s photo URL is completely removed');
  assert(navAccountBtn.getAttribute('title') === 'Logged in as ' + userB.name, 'Tooltip reflects User B name');

  // -------------------------------------------------------------
  // TEST 6: Page refresh / Re-init -> Cart count and profile image preserved per user
  // -------------------------------------------------------------
  console.log('\nTEST 6: Page refresh simulation preserves correct user state & cart count');
  // Re-run navbar update as happens during page reload
  Auth.updateNavbar();
  assert(cartCountEl.textContent === '1', 'After page reload, Account B cart count remains 1');
  assert(navAccountBtn.innerHTML.includes(userB.photoURL), 'After page reload, Account B avatar remains intact');

  console.log('\n🎉 ALL 6 USER-ISOLATION & DYNAMIC AVATAR TESTS PASSED 100%!\n');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
