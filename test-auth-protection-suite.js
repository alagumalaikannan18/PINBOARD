const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('--- PINBOARD AUTHENTICATION & PURCHASE PROTECTION TEST SUITE ---');
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

function createFreshEnvironment(viewport = 'desktop', existingStorage = null) {
  const mockLocalStorage = new LocalStorageMock();
  if (existingStorage) {
    if (existingStorage.store) {
      mockLocalStorage.store = Object.assign({}, existingStorage.store);
    }
    if (existingStorage._activeFirebaseUser) {
      mockLocalStorage._activeFirebaseUser = existingStorage._activeFirebaseUser;
    }
  }
  const mockSessionStorage = new LocalStorageMock();
  const eventListeners = {};

  let _cartCountText = '0';
  const cartCountEl = {
    get textContent() { return _cartCountText; },
    set textContent(v) { _cartCountText = String(v); }
  };

  let whatsappOpened = false;

  const documentElements = {
    pdpAddCart: {
      textContent: 'Add to cart',
      dataset: {},
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      disabled: false,
      setAttribute(k, v) { this[k] = v; },
      removeAttribute(k) { delete this[k]; },
      listeners: {},
      addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      click() {
        const handlers = this.listeners['click'] || [];
        handlers.forEach(fn => fn({ preventDefault: () => {} }));
      }
    },
    pdpBuyNow: {
      textContent: 'Buy it now',
      dataset: {},
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      disabled: false,
      setAttribute(k, v) { this[k] = v; },
      removeAttribute(k) { delete this[k]; },
      listeners: {},
      addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      click() {
        const handlers = this.listeners['click'] || [];
        handlers.forEach(fn => fn({ preventDefault: () => {} }));
      }
    },
    pdpQtyValue: { textContent: '1', dataset: {} },
    pdpQtyMinus: { dataset: {}, addEventListener: () => {} },
    pdpQtyPlus: { dataset: {}, addEventListener: () => {} },
    pdpTitle: { textContent: '' },
    pdpSubtitle: { textContent: '' },
    pdpPrice: { innerHTML: '' },
    pdpBadges: { innerHTML: '' },
    pdpRating: { innerHTML: '' },
    pdpValue: { textContent: '' },
    pdpDeliveryDate: { textContent: '' },
    pdpMainImg: { src: '', alt: '' },
    pdpThumbs: { innerHTML: '', style: {} },
    pdpDesc: { textContent: '' },
    pdpFeatures: { innerHTML: '' },
    pdpSpecs: { innerHTML: '' },
    pdpPerfectFor: { innerHTML: '' },
    pdpRelated: { innerHTML: '', querySelectorAll: () => [] },
    orderRequestModal: { style: { display: 'none' }, addEventListener: () => {} },
    orderSuccessModal: { style: { display: 'none' }, addEventListener: () => {} }
  };

  const windowMock = {
    location: {
      search: '?id=1',
      pathname: '/product.html',
      href: 'http://localhost:3000/product.html?id=1',
      protocol: 'http:',
      host: 'localhost:3000'
    },
    navigator: {
      userAgent: viewport === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
        : (viewport === 'tablet' ? 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    addEventListener: (evt, cb) => {
      if (!eventListeners[evt]) eventListeners[evt] = [];
      eventListeners[evt].push(cb);
    },
    removeEventListener: (evt, cb) => {
      if (eventListeners[evt]) {
        eventListeners[evt] = eventListeners[evt].filter(f => f !== cb);
      }
    },
    dispatchEvent: (evt) => {
      const handlers = eventListeners[evt.type] || [];
      handlers.forEach(fn => fn(evt));
    },
    openWhatsAppOrderForAllRecipients: function (orderData) {
      whatsappOpened = true;
      return true;
    },
    console: console,
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options ? options.detail : null;
      }
    },
    URLSearchParams: URLSearchParams,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    parseInt: parseInt,
    Number: Number,
    String: String,
    Boolean: Boolean,
    Array: Array,
    Object: Object,
    Math: Math,
    Date: Date,
    JSON: JSON,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  const documentMock = {
    readyState: 'complete',
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    querySelectorAll: (selector) => {
      if (selector === '.cart-count') return [cartCountEl];
      if (selector === '.pdp-size-pill') return [];
      return [];
    },
    querySelector: (selector) => {
      if (selector === '.pdp-actions' || selector === '.pdp-action-buttons') {
        return { parentNode: { insertBefore: () => {} } };
      }
      return null;
    },
    getElementById: (id) => documentElements[id] || null,
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      className: '',
      id: '',
      innerHTML: '',
      style: {},
      appendChild: () => {},
      addEventListener: () => {}
    }),
    body: { appendChild: () => {}, innerHTML: '' },
    addEventListener: (evt, cb) => {
      if (!eventListeners[evt]) eventListeners[evt] = [];
      eventListeners[evt].push(cb);
    }
  };

  windowMock.document = documentMock;
  windowMock.window = windowMock;
  windowMock.globalThis = windowMock;

  const sandbox = vm.createContext(windowMock);

  const productsCode = fs.readFileSync(path.join(__dirname, 'js/products-data.js'), 'utf8');
  vm.runInContext(productsCode, sandbox);

  let authCode = fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8');
  // Strip ES module imports for VM sandbox evaluation
  authCode = authCode.replace(/import\s*{[^}]*}\s*from\s*["'].*?["'];?/s, 'const auth = { get currentUser() { return window.localStorage._activeFirebaseUser || null; } }, googleProvider = {}, onAuthStateChanged = (a, cb) => { cb(window.localStorage._activeFirebaseUser || null); }, signInWithEmailAndPassword = async () => {}, createUserWithEmailAndPassword = async () => {}, signInWithPopup = async () => {}, signOut = async () => {}, updateProfile = async () => {}, sendPasswordResetEmail = async () => {}, setPersistence = async () => {}, browserLocalPersistence = {}, firebaseConfig = {};');
  vm.runInContext(authCode, sandbox);

  // Wrap setUser to also update simulated Firebase persistence state
  const origSetUser = sandbox.Auth.setUser;
  sandbox.Auth.setUser = function(user) {
    mockLocalStorage._activeFirebaseUser = user;
    return origSetUser.call(sandbox.Auth, user);
  };
  const origLogout = sandbox.Auth.logout;
  sandbox.Auth.logout = function() {
    mockLocalStorage._activeFirebaseUser = null;
    return origLogout.call(sandbox.Auth);
  };

  const productCode = fs.readFileSync(path.join(__dirname, 'js/product.js'), 'utf8');
  vm.runInContext(productCode, sandbox);

  return {
    sandbox,
    windowMock,
    documentElements,
    mockLocalStorage,
    getWhatsappOpened: () => whatsappOpened,
    resetWhatsappOpened: () => { whatsappOpened = false; }
  };
}

async function runTests() {
  const tick = () => new Promise(r => setTimeout(r, 20));

  // TEST 1: Logged out -> Product Detail -> Add to Cart -> Login prompt appears -> Product is NOT added
  console.log('--- TEST 1: Guest -> Product Detail -> Add to Cart ---');
  {
    const env = createFreshEnvironment('desktop');
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), false, 'User is guest');
    env.documentElements.pdpAddCart.click();
    await tick();

    const cart = env.sandbox.Auth.getCart();
    assert.strictEqual(cart.length, 0, 'Cart remains empty for guest');
    assert.strictEqual(env.documentElements.pdpAddCart.disabled, false, 'Button remains enabled');
    const pending = env.sandbox.Auth.getPendingAction();
    assert(pending !== null, 'Pending action saved for redirect');
    assert.strictEqual(pending.action, 'cart', 'Pending action type is cart');
    console.log('✅ PASS: Guest Add to Cart blocked & pending action saved');
  }

  // TEST 2: Logged out -> Product Detail -> Buy Now -> Login prompt appears -> WhatsApp does NOT open -> No order created
  console.log('\n--- TEST 2: Guest -> Product Detail -> Buy Now ---');
  {
    const env = createFreshEnvironment('desktop');
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), false, 'User is guest');
    env.documentElements.pdpBuyNow.click();
    await tick();

    const orders = env.sandbox.Auth.getOrders();
    assert.strictEqual(orders.length, 0, 'No order created for guest');
    assert.strictEqual(env.getWhatsappOpened(), false, 'WhatsApp does NOT open for guest');
    const pending = env.sandbox.Auth.getPendingAction();
    assert(pending !== null, 'Pending action saved for redirect');
    assert.strictEqual(pending.action, 'buy', 'Pending action type is buy');
    console.log('✅ PASS: Guest Buy Now blocked, WhatsApp prevented & pending action saved');
  }

  // TEST 3: Login successfully -> Product Detail -> Add to Cart -> works
  console.log('\n--- TEST 3: Authenticated User -> Product Detail -> Add to Cart ---');
  {
    const env = createFreshEnvironment('desktop');
    env.sandbox.Auth.setUser({ uid: 'usr_test_100', name: 'Test User' });
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), true, 'User is logged in');

    env.documentElements.pdpAddCart.click();
    await tick();
    const cart = env.sandbox.Auth.getCart();
    assert.strictEqual(cart.length, 1, 'Product added to cart for authenticated user');
    assert.strictEqual(env.documentElements.pdpAddCart.disabled, true, 'Button disabled after adding');
    console.log('✅ PASS: Authenticated Add to Cart works normally');
  }

  // TEST 4: Login successfully -> Product Detail -> Buy Now -> opens modal (WhatsApp opens ONLY after form submit)
  console.log('\n--- TEST 4: Authenticated User -> Product Detail -> Buy Now ---');
  {
    const env = createFreshEnvironment('desktop');
    env.sandbox.Auth.setUser({ uid: 'usr_test_100', name: 'Test User' });
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), true, 'User is logged in');

    env.documentElements.pdpBuyNow.click();
    await tick();
    assert.strictEqual(env.documentElements.orderRequestModal.style.display, 'flex', 'Order request modal opened');
    assert.strictEqual(env.getWhatsappOpened(), false, 'WhatsApp MUST NOT open when BUY NOW is clicked');
    console.log('✅ PASS: BUY NOW opens modal without triggering WhatsApp prematurely');
  }

  // TEST 5 & 6: Login -> Refresh -> Add to Cart & Buy Now still work
  console.log('\n--- TEST 5 & 6: Login -> Page Refresh Simulation ---');
  {
    const env = createFreshEnvironment('desktop');
    env.sandbox.Auth.setUser({ uid: 'usr_refresh_user', name: 'Refresh User' });

    // Simulate Page Refresh (re-initialize sandbox with cached session)
    const refreshedEnv = createFreshEnvironment('desktop', env.mockLocalStorage);

    // Verify persistence session state restored
    assert.strictEqual(refreshedEnv.sandbox.Auth.isLoggedIn(), true, 'User remains authenticated after page refresh');

    refreshedEnv.documentElements.pdpAddCart.click();
    await tick();
    assert.strictEqual(refreshedEnv.sandbox.Auth.getCart().length, 1, 'Add to Cart works after refresh');

    refreshedEnv.resetWhatsappOpened();
    refreshedEnv.documentElements.pdpBuyNow.click();
    await tick();
    assert.strictEqual(refreshedEnv.documentElements.orderRequestModal.style.display, 'flex', 'Buy Now opens modal after refresh');
    assert.strictEqual(refreshedEnv.getWhatsappOpened(), false, 'WhatsApp does not open prematurely on Buy Now click after refresh');
    console.log('✅ PASS: Auth persistence intact after page refresh for both Add to Cart and Buy Now');
  }

  // TEST 7 & 8: Login -> Logout -> Add to Cart & Buy Now required login
  console.log('\n--- TEST 7 & 8: Login -> Logout -> Purchasing Protection ---');
  {
    const env = createFreshEnvironment('desktop');
    env.sandbox.Auth.setUser({ uid: 'usr_logout_user', name: 'Logout User' });
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), true);

    await env.sandbox.Auth.logout();
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), false, 'User is logged out');

    env.documentElements.pdpAddCart.click();
    await tick();
    assert.strictEqual(env.sandbox.Auth.getCart().length, 0, 'Add to Cart blocked after logout');

    env.resetWhatsappOpened();
    env.documentElements.pdpBuyNow.click();
    await tick();
    assert.strictEqual(env.getWhatsappOpened(), false, 'WhatsApp blocked after logout');
    console.log('✅ PASS: Purchasing actions correctly re-protected after logout');
  }

  // TEST 9, 10, 11: Guest -> Shop All / Search / Collection -> Action Login Protection
  console.log('\n--- TEST 9, 10, 11: Guest -> Shop All / Search / Collection Protection ---');
  {
    const env = createFreshEnvironment('desktop');

    // Direct call to Auth.addToCart without auth
    const resCart = env.sandbox.Auth.addToCart(5, 1);
    assert.strictEqual(resCart.requireAuth, true, 'Auth.addToCart rejects unauthenticated guest');
    assert.strictEqual(resCart.success, false, 'Returns success: false');

    // Direct call to Auth.createOrder without auth
    const resOrder = env.sandbox.Auth.createOrder(5, 1);
    assert.strictEqual(resOrder, null, 'Auth.createOrder rejects unauthenticated guest');

    // Direct call to Auth.addCustomPostersToCart without auth
    const resCustom = env.sandbox.Auth.addCustomPostersToCart({ template: 5, totalPrice: 250 });
    assert.strictEqual(resCustom.requireAuth, true, 'Auth.addCustomPostersToCart rejects unauthenticated guest');
    console.log('✅ PASS: Underlying handlers enforce login protection across Shop All, Search & Collections');
  }

  // TEST 12 & 13: Mobile -> Guest -> Add to Cart & Buy Now -> Login required
  console.log('\n--- TEST 12 & 13: Mobile Viewport Protection ---');
  {
    const mobileEnv = createFreshEnvironment('mobile');
    assert.strictEqual(mobileEnv.sandbox.Auth.isLoggedIn(), false);

    mobileEnv.documentElements.pdpAddCart.click();
    await tick();
    assert.strictEqual(mobileEnv.sandbox.Auth.getCart().length, 0, 'Mobile Add to Cart blocked for guest');

    mobileEnv.documentElements.pdpBuyNow.click();
    await tick();
    assert.strictEqual(mobileEnv.getWhatsappOpened(), false, 'Mobile Buy Now / WhatsApp blocked for guest');
    console.log('✅ PASS: Mobile purchase protection verified');
  }

  // TEST 14 & 15: Tablet & Desktop Viewport Protection
  console.log('\n--- TEST 14 & 15: Tablet & Desktop Viewport Protection ---');
  {
    const tabletEnv = createFreshEnvironment('tablet');
    assert.strictEqual(tabletEnv.sandbox.Auth.isLoggedIn(), false);

    tabletEnv.documentElements.pdpAddCart.click();
    await tick();
    assert.strictEqual(tabletEnv.sandbox.Auth.getCart().length, 0, 'Tablet Add to Cart blocked for guest');

    tabletEnv.documentElements.pdpBuyNow.click();
    await tick();
    assert.strictEqual(tabletEnv.getWhatsappOpened(), false, 'Tablet Buy Now / WhatsApp blocked for guest');
    console.log('✅ PASS: Tablet & Desktop purchase protection verified');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 15 AUTHENTICATION & PURCHASING PROTECTION SCENARIOS PASSED!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
