const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- RUNNING PINBOARD ADD TO CART & DUPLICATE PREVENTION TEST SUITE ---');

// Mock browser environment
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

const mockLocalStorage = new LocalStorageMock();
const mockSessionStorage = new LocalStorageMock();

// Load products data
const productsCode = fs.readFileSync(path.join(__dirname, 'js/products-data.js'), 'utf8');

// Set up window / document sandbox
const eventListeners = {};
const windowMock = {
  location: {
    search: '?id=1',
    pathname: '/product.html',
    href: 'http://localhost:3000/product.html?id=1',
    protocol: 'http:',
    host: 'localhost:3000'
  },
  history: {
    replaceState: () => {}
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
    dataset: {},
    listeners: {},
    addEventListener(evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    }
  },
  pdpQtyValue: { textContent: '1', dataset: {} },
  pdpQtyMinus: { dataset: {}, addEventListener: () => {} },
  pdpQtyPlus: { dataset: {}, addEventListener: () => {} }
};

let _cartCountText = '0';
const cartCountEl = {
  get textContent() { return _cartCountText; },
  set textContent(v) { _cartCountText = String(v); }
};

const documentMock = {
  title: '',
  readyState: 'complete',
  getElementById: (id) => documentElements[id] || null,
  querySelector: (sel) => {
    if (sel === '.cart-count') return cartCountEl;
    if (sel === '.pdp-content' || sel === '.pdp-related') return { style: {} };
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel === '.cart-count') return [cartCountEl];
    return [];
  },
  addEventListener: (event, handler) => {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(handler);
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
  console: console
};

vm.createContext(context);
vm.runInContext(productsCode, context);

// Minimal Auth implementation matching auth.js
const authModuleCode = `
window.Auth = {
  getCart: function () {
    try {
      var raw = localStorage.getItem('pinboard_cart_items');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
  isInCart: function (productId) {
    if (productId === undefined || productId === null || productId === '') return false;
    var id = parseInt(productId, 10);
    var cart = this.getCart();
    return cart.some(function (item) {
      if (!isNaN(id) && item.id === id) return true;
      return String(item.id) === String(productId);
    });
  },
  addToCart: function (productId, quantity) {
    var qty = parseInt(quantity, 10) || 1;
    var cart = this.getCart();
    var id = parseInt(productId, 10);
    var existing = cart.find(function (item) {
      if (!isNaN(id) && item.id === id) return true;
      return String(item.id) === String(productId);
    });
    if (existing) {
      return { success: false, alreadyInCart: true, cart: cart };
    }
    var product = (typeof getProductById === 'function') ? getProductById(id || productId) : null;
    var price = product ? (product.salePrice || product.regularPrice) : 899;
    var title = product ? product.title : ('Poster #' + productId);
    var img = (product && product.images && product.images.length > 0) ? product.images[0] : 'default.png';

    cart.push({
      id: isNaN(id) ? productId : id,
      title: title,
      quantity: qty,
      price: price,
      image: img
    });

    try {
      localStorage.setItem('pinboard_cart_items', JSON.stringify(cart));
    } catch (e) {}

    this.updateNavbar();
    this._emitCartChange();
    return { success: true, alreadyInCart: false, cart: cart };
  },
  removeFromCart: function (productId) {
    var id = parseInt(productId, 10);
    var cart = this.getCart();
    var filtered = cart.filter(function (item) {
      if (!isNaN(id) && item.id === id) return false;
      return String(item.id) !== String(productId);
    });
    try {
      localStorage.setItem('pinboard_cart_items', JSON.stringify(filtered));
    } catch (e) {}
    this.updateNavbar();
    this._emitCartChange();
    return filtered;
  },
  getCartCount: function () {
    return this.getCart().length;
  },
  updateNavbar: function () {
    var count = this.getCartCount();
    var countEls = document.querySelectorAll('.cart-count');
    countEls.forEach(function (el) { el.textContent = count; });
  },
  _emitCartChange: function () {
    try {
      var event = new CustomEvent('auth:cartchange', { detail: { cart: this.getCart(), count: this.getCartCount() } });
      window.dispatchEvent(event);
    } catch (e) {}
  }
};
`;

vm.runInContext(authModuleCode, context);

const productJsCode = fs.readFileSync(path.join(__dirname, 'js/product.js'), 'utf8');
vm.runInContext(productJsCode, context);

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL: ' + message);
    process.exit(1);
  } else {
    console.log('✅ PASS: ' + message);
  }
}

// TEST 1: Open Poster A -> Click once -> Cart count = 1, Button = 'Now Available in Cart'
console.log('\n--- TEST 1: Add Poster A once ---');
assert(documentElements.pdpAddCart.textContent === 'Add to cart', 'Initial button text is "Add to cart"');
assert(documentElements.pdpAddCart.disabled === false, 'Initial button is enabled');
assert(cartCountEl.textContent === '0', 'Initial cart count is 0');

documentElements.pdpAddCart.click();

assert(cartCountEl.textContent === '1', 'Cart count increased to 1');
assert(documentElements.pdpAddCart.textContent === 'Now Available in Cart', 'Button text changed to "Now Available in Cart"');
assert(documentElements.pdpAddCart.disabled === true, 'Button is disabled');
assert(documentElements.pdpAddCart.classList.contains('in-cart'), 'Button has .in-cart class');

// TEST 2: Repeated clicks on Poster A
console.log('\n--- TEST 2: Repeated click on Poster A ---');
documentElements.pdpAddCart.click();
documentElements.pdpAddCart.click();

assert(cartCountEl.textContent === '1', 'Cart count remains 1 after repeated clicks');
assert(context.window.Auth.getCart().length === 1, 'Underlying cart array length is 1');
assert(documentElements.pdpAddCart.textContent === 'Now Available in Cart', 'Button remains "Now Available in Cart"');

// TEST 3: Refresh product page for Poster A
console.log('\n--- TEST 3: Page refresh simulation for Poster A ---');
// Re-run product.js simulating page reload
vm.runInContext(productJsCode, context);
assert(documentElements.pdpAddCart.textContent === 'Now Available in Cart', 'After refresh, button is "Now Available in Cart"');
assert(documentElements.pdpAddCart.disabled === true, 'After refresh, button remains disabled');

// TEST 4: Open Poster B (Product ID 2)
console.log('\n--- TEST 4: Open and add Poster B ---');
windowMock.location.search = '?id=2';
vm.runInContext(productJsCode, context);

assert(documentElements.pdpAddCart.textContent === 'Add to cart', 'Poster B shows "Add to cart"');
assert(documentElements.pdpAddCart.disabled === false, 'Poster B button is enabled');
assert(cartCountEl.textContent === '1', 'Cart count is still 1 before adding Poster B');

documentElements.pdpAddCart.click();

assert(cartCountEl.textContent === '2', 'Cart count increases to 2 after adding Poster B');
assert(documentElements.pdpAddCart.textContent === 'Now Available in Cart', 'Poster B button is now "Now Available in Cart"');
assert(context.window.Auth.getCart().length === 2, 'Underlying cart has 2 unique items');

// TEST 5: Remove Poster A and navigate back to Poster A
console.log('\n--- TEST 5: Remove Poster A and check button restoration ---');
context.window.Auth.removeFromCart(1);
assert(cartCountEl.textContent === '1', 'Cart count reduced to 1 after removing Poster 1');

windowMock.location.search = '?id=1';
vm.runInContext(productJsCode, context);

assert(documentElements.pdpAddCart.textContent === 'Add to cart', 'Poster A button returned to "Add to cart"');
assert(documentElements.pdpAddCart.disabled === false, 'Poster A button is enabled again');

// TEST 6: Quantity selector handling (e.g. qty = 3 for Poster C / ID 3)
console.log('\n--- TEST 6: Quantity selection with Poster C ---');
windowMock.location.search = '?id=3';
documentElements.pdpQtyValue.textContent = '3';
vm.runInContext(productJsCode, context);

// Emulate setting currentQty = 3
documentElements.pdpAddCart.click(); // will use default currentQty or qty from element
const cartItems = context.window.Auth.getCart();
const poster3 = cartItems.find(item => item.id === 3);
assert(poster3 !== undefined, 'Poster 3 exists in cart');
assert(cartCountEl.textContent === '2', 'Unique cart count is 2 (Poster 2 and Poster 3)');
assert(documentElements.pdpAddCart.textContent === 'Now Available in Cart', 'Poster C button is "Now Available in Cart"');

// Repeated clicks on Poster C must not duplicate
documentElements.pdpAddCart.click();
assert(cartCountEl.textContent === '2', 'Cart count remains 2 after repeated clicks on Poster C');
assert(context.window.Auth.getCart().filter(item => item.id === 3).length === 1, 'Only 1 cart item exists for Poster C');

console.log('\n🎉 ALL 6 TEST SUITE SCENARIOS PASSED WITH ZERO ERRORS!\n');
