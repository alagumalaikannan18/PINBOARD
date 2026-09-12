const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

function createFreshEnvironment() {
  const mockLocalStorage = new LocalStorageMock();
  const mockSessionStorage = new LocalStorageMock();
  const eventListeners = {};

  let _cartCountText = '0';
  const cartCountEl = {
    get textContent() { return _cartCountText; },
    set textContent(v) { _cartCountText = String(v); }
  };

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
    pdpRelated: { innerHTML: '', querySelectorAll: () => [] }
  };

  const windowMock = {
    location: {
      search: '?id=1',
      pathname: '/product.html',
      href: 'http://localhost:3000/product.html?id=1',
      protocol: 'http:',
      host: 'localhost:3000'
    },
    history: {
      replaceState: (state, title, url) => {
        windowMock.location.href = url;
      }
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
    },
    requestAnimationFrame: (cb) => cb()
  };

  let appendedAuthMessage = null;

  const documentMock = {
    title: '',
    readyState: 'complete',
    getElementById: (id) => documentElements[id] || null,
    querySelector: (sel) => {
      if (sel === '.cart-count') return cartCountEl;
      if (sel === '.pdp-content' || sel === '.pdp-related') return { style: {} };
      if (sel === '.pdp-actions') return {
        parentNode: {
          insertBefore: (node, sibling) => {
            appendedAuthMessage = node;
          }
        }
      };
      if (sel === '.pdp-info') return { appendChild: (node) => { appendedAuthMessage = node; } };
      if (sel === '.pdp-auth-message') return appendedAuthMessage;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === '.cart-count') return [cartCountEl];
      if (sel.includes('.account-btn')) return [];
      return [];
    },
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        style: {},
        innerHTML: '',
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k] || null; },
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        }
      };
      return el;
    },
    addEventListener: (event, handler) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    }
  };

  let isUserLoggedIn = false;
  let loggedInUser = null;

  const authMock = {
    isLoggedIn: () => isUserLoggedIn,
    getUser: () => loggedInUser,
    waitForAuth: () => Promise.resolve(isUserLoggedIn ? loggedInUser : null),
    loginAs: (user) => {
      isUserLoggedIn = true;
      loggedInUser = user || { uid: 'test-user-123', name: 'Test Collector', email: 'test@example.com', isLoggedIn: true };
      windowMock.dispatchEvent(new windowMock.CustomEvent('auth:statechange', { detail: { user: loggedInUser } }));
    },
    logout: () => {
      isUserLoggedIn = false;
      loggedInUser = null;
      windowMock.dispatchEvent(new windowMock.CustomEvent('auth:statechange', { detail: { user: null } }));
    },
    setPendingAction: (action) => {
      mockLocalStorage.setItem('pinboard_pending_purchase_action', JSON.stringify(action));
    },
    getPendingAction: () => {
      const raw = mockLocalStorage.getItem('pinboard_pending_purchase_action');
      return raw ? JSON.parse(raw) : null;
    },
    clearPendingAction: () => {
      mockLocalStorage.removeItem('pinboard_pending_purchase_action');
    },
    getCart: () => {
      const raw = mockLocalStorage.getItem('pinboard_cart_items');
      return raw ? JSON.parse(raw) : [];
    },
    isInCart: function(id) {
      const cart = this.getCart();
      const numId = parseInt(id, 10);
      return cart.some(item => (item.id === numId || String(item.id) === String(id)));
    },
    addToCart: function(productId, quantity) {
      if (!this.isLoggedIn()) {
        return { success: false, requireAuth: true, message: 'Please log in to add items to your cart.', cart: this.getCart() };
      }
      const cart = this.getCart();
      const numId = parseInt(productId, 10);
      if (this.isInCart(productId)) {
        return { success: false, alreadyInCart: true, cart: cart };
      }
      cart.push({ id: numId, title: 'Poster #' + productId, quantity: quantity || 1, price: 749, image: 'default.png' });
      mockLocalStorage.setItem('pinboard_cart_items', JSON.stringify(cart));
      cartCountEl.textContent = cart.length;
      windowMock.dispatchEvent(new windowMock.CustomEvent('auth:cartchange', { detail: { cart, count: cart.length } }));
      return { success: true, alreadyInCart: false, cart: cart };
    },
    getOrders: () => {
      const raw = mockLocalStorage.getItem('pinboard_customer_orders');
      return raw ? JSON.parse(raw) : [];
    },
    createOrder: function(productId, quantity) {
      if (!this.isLoggedIn()) {
        return null;
      }
      const orders = this.getOrders();
      const newOrder = { orderId: 'PB-TEST-1', productId, quantity: quantity || 1, total: 749 * (quantity || 1) };
      orders.unshift(newOrder);
      mockLocalStorage.setItem('pinboard_customer_orders', JSON.stringify(orders));
      return newOrder;
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
    clearTimeout: () => {},
    console: console,
    requestAnimationFrame: (cb) => cb()
  };

  vm.createContext(context);

  const productsCode = fs.readFileSync(path.join(__dirname, 'js/products-data.js'), 'utf8');
  vm.runInContext(productsCode, context);

  context.window.Auth = authMock;
  context.window.PinboardAuth = authMock;

  const productJsCode = fs.readFileSync(path.join(__dirname, 'js/product.js'), 'utf8');

  return {
    context,
    documentElements,
    cartCountEl,
    authMock,
    productJsCode,
    getAppendedAuthMessage: () => appendedAuthMessage,
    runProductJs: () => vm.runInContext(productJsCode, context)
  };
}

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL: ' + message);
    process.exit(1);
  } else {
    console.log('✅ PASS: ' + message);
  }
}

async function runAllTests() {
  // -------------------------------------------------------------
  // TEST 1: User is not logged in. Click ADD TO CART.
  // -------------------------------------------------------------
  console.log('TEST 1: Unauthenticated user clicks ADD TO CART');
  {
    const env = createFreshEnvironment();
    env.runProductJs();

    assert(env.authMock.isLoggedIn() === false, 'User is initially logged out');
    assert(env.cartCountEl.textContent === '0', 'Initial cart count is 0');
    assert(env.authMock.getCart().length === 0, 'Cart storage is empty');

    // Click ADD TO CART while not logged in
    env.documentElements.pdpAddCart.click();
    await Promise.resolve(); // Allow promise microtasks to settle

    assert(env.cartCountEl.textContent === '0', 'Cart count must not increase for unauthenticated user');
    assert(env.authMock.getCart().length === 0, 'Cart storage must remain empty');
    assert(env.documentElements.pdpAddCart.textContent === 'Add to cart', 'Button remains "Add to cart"');
    
    const pending = env.authMock.getPendingAction();
    assert(pending !== null, 'Pending action was saved');
    assert(pending.action === 'cart', 'Pending action type is "cart"');
    assert(pending.productId === 1 || pending.productId === '1', 'Pending action preserved product ID 1');

    const authMsg = env.getAppendedAuthMessage();
    assert(authMsg !== null, 'Auth notification message element was injected');
    assert(authMsg.innerHTML.includes('Please log in to add items to your cart.'), 'Message contains "Please log in to add items to your cart."');
    assert(authMsg.innerHTML.includes('account.html?redirect='), 'Message includes redirect link to account.html');
  }

  // -------------------------------------------------------------
  // TEST 2: User is not logged in. Click BUY IT NOW.
  // -------------------------------------------------------------
  console.log('\nTEST 2: Unauthenticated user clicks BUY IT NOW');
  {
    const env = createFreshEnvironment();
    env.runProductJs();

    assert(env.authMock.isLoggedIn() === false, 'User is initially logged out');
    assert(env.authMock.getOrders().length === 0, 'Orders storage is empty');

    // Click BUY IT NOW while not logged in
    env.documentElements.pdpBuyNow.click();
    await Promise.resolve();

    assert(env.authMock.getOrders().length === 0, 'Purchase flow must not execute / no orders created');

    const pending = env.authMock.getPendingAction();
    assert(pending !== null, 'Pending action was saved');
    assert(pending.action === 'buy', 'Pending action type is "buy"');

    const authMsg = env.getAppendedAuthMessage();
    assert(authMsg !== null, 'Auth notification message element was injected');
    assert(authMsg.innerHTML.includes('Please log in to continue with your purchase.'), 'Message contains "Please log in to continue with your purchase."');
  }

  // -------------------------------------------------------------
  // TEST 3: User logs in successfully. Return to the product page.
  // -------------------------------------------------------------
  console.log('\nTEST 3: User logs in and returns to the product page');
  {
    const env = createFreshEnvironment();
    // Simulate returning with ?id=1
    env.context.window.location.search = '?id=1';
    env.authMock.loginAs({ uid: 'user-789', name: 'Alagu', email: 'alagu@example.com', isLoggedIn: true });
    env.runProductJs();
    await Promise.resolve();

    assert(env.authMock.isLoggedIn() === true, 'User is authenticated');
    assert(env.documentElements.pdpAddCart.textContent === 'Add to cart', 'Product page renders normally ready for interaction');
    assert(env.documentElements.pdpAddCart.disabled === false, 'Add to cart button is enabled');
  }

  // -------------------------------------------------------------
  // TEST 4: Logged-in user clicks ADD TO CART.
  // -------------------------------------------------------------
  console.log('\nTEST 4: Logged-in user clicks ADD TO CART');
  {
    const env = createFreshEnvironment();
    env.authMock.loginAs({ uid: 'user-789', name: 'Alagu', email: 'alagu@example.com', isLoggedIn: true });
    env.runProductJs();
    await Promise.resolve();

    assert(env.cartCountEl.textContent === '0', 'Initial cart count is 0');

    // Click ADD TO CART
    env.documentElements.pdpAddCart.click();
    await Promise.resolve();

    assert(env.cartCountEl.textContent === '1', 'Cart count increased to 1');
    assert(env.authMock.getCart().length === 1, 'Cart storage contains 1 item');
    assert(env.documentElements.pdpAddCart.textContent === 'Now Available in Cart', 'Button text updated to "Now Available in Cart"');
    assert(env.documentElements.pdpAddCart.disabled === true, 'Button is disabled to prevent duplicates');

    // Repeated clicks must not duplicate
    env.documentElements.pdpAddCart.click();
    await Promise.resolve();
    assert(env.cartCountEl.textContent === '1', 'Cart count remains 1 after repeated clicks');
    assert(env.authMock.getCart().length === 1, 'Cart storage remains 1 item');
  }

  // -------------------------------------------------------------
  // TEST 5: Logged-in user clicks BUY IT NOW.
  // -------------------------------------------------------------
  console.log('\nTEST 5: Logged-in user clicks BUY IT NOW');
  {
    const env = createFreshEnvironment();
    env.authMock.loginAs({ uid: 'user-789', name: 'Alagu', email: 'alagu@example.com', isLoggedIn: true });
    env.runProductJs();
    await Promise.resolve();

    assert(env.authMock.getOrders().length === 0, 'Initially 0 orders');

    // Click BUY IT NOW
    env.documentElements.pdpBuyNow.click();
    await Promise.resolve();

    assert(env.authMock.getOrders().length === 1, 'Order created successfully for authenticated user');
  }

  // -------------------------------------------------------------
  // TEST 6: User logs out and returns to a product page.
  // -------------------------------------------------------------
  console.log('\nTEST 6: User logs out and returns to product page');
  {
    const env = createFreshEnvironment();
    env.authMock.loginAs({ uid: 'user-789', name: 'Alagu', email: 'alagu@example.com', isLoggedIn: true });
    env.runProductJs();
    await Promise.resolve();

    // User logs out
    env.authMock.logout();
    await Promise.resolve();
    assert(env.authMock.isLoggedIn() === false, 'User is logged out');

    // Try to click ADD TO CART again
    env.documentElements.pdpAddCart.click();
    await Promise.resolve();
    assert(env.cartCountEl.textContent === '0', 'Cart count did not change');
    
    const authMsg = env.getAppendedAuthMessage();
    assert(authMsg !== null, 'Auth notification message is shown again');
    assert(authMsg.innerHTML.includes('Please log in to add items to your cart.'), 'Login message displayed');

    // Try to click BUY IT NOW again
    env.documentElements.pdpBuyNow.click();
    await Promise.resolve();
    assert(env.authMock.getOrders().length === 0, 'Purchase is blocked again for logged out user');
  }

  console.log('\n🎉 ALL 6 PINBOARD AUTHENTICATION TESTS PASSED PERFECTLY!\n');
}

runAllTests().catch(err => {
  console.error(err);
  process.exit(1);
});

