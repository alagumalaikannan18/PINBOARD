// =========================================================================
// PINBOARD — Real Product Review & Shared Rating System Test Suite
// =========================================================================
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock DOM & Window environment helper
function createEnvironment(viewport = 'desktop', existingDbState = null, searchString = '?id=12') {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    store
  };

  const dbState = existingDbState || {
    // Shared in-memory DB simulating Firestore / API storage per product
    productsReviews: {} // productId -> array of { userId, userName, rating, text, createdAt }
  };

  const documentElements = {
    pdpAddCart: { dataset: {}, textContent: 'ADD TO CART', disabled: false, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
    pdpBuyNow: { dataset: {}, textContent: 'BUY NOW', disabled: false, addEventListener: () => {} },
    pdpRatingScore: { textContent: '0.0' },
    pdpRatingStarsHeader: { textContent: '☆☆☆☆☆' },
    pdpReviewCount: { textContent: 'No reviews yet' },
    pdpReviewScore: { textContent: '0.0' },
    pdpReviewCountBadge: { textContent: 'No reviews yet' },
    pdpReviewStars: { textContent: '☆☆☆☆☆' },
    pdpReviewsPreviewList: { innerHTML: '' },
    pdpAuthPrompt: { style: { display: 'none' }, innerHTML: '', scrollIntoView: () => {} },
    reviewModal: { style: { display: 'none' }, addEventListener: () => {} },
    pdpOpenReviewModalBtn: { listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, click() { if (this.listeners.click) this.listeners.click({ preventDefault: () => {} }); } },
    closeReviewModal: { listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, click() { if (this.listeners.click) this.listeners.click({ preventDefault: () => {} }); } },
    pdpReviewForm: { listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, submit() { if (this.listeners.submit) this.listeners.submit({ preventDefault: () => {} }); } },
    reviewRatingVal: { value: '5' },
    reviewAuthorName: { value: '' },
    reviewText: { value: '' },
    reviewFormError: { style: { display: 'none' }, textContent: '' },
    reviewFormSuccess: { style: { display: 'none' }, textContent: '' },
    submitReviewBtn: { disabled: false },
    reviewModalProductTitle: { textContent: '' }
  };

  const windowMock = {
    location: {
      search: searchString,
      pathname: '/product.html',
      href: 'http://localhost:3000/product.html' + searchString
    },
    navigator: {
      userAgent: viewport === 'mobile' ? 'iPhone' : (viewport === 'tablet' ? 'iPad' : 'Windows')
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
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
    clearTimeout: clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    console: console,
    document: {
      readyState: 'complete',
      getElementById: (id) => documentElements[id] || null,
      querySelectorAll: (sel) => {
        if (sel === '#reviewStarRating .star-btn') {
          return [1, 2, 3, 4, 5].map(v => ({
            getAttribute: () => String(v),
            classList: { add: () => {}, remove: () => {} },
            addEventListener: () => {}
          }));
        }
        return [];
      }
    }
  };

  windowMock.window = windowMock;
  windowMock.globalThis = windowMock;

  const sandbox = vm.createContext(windowMock);

  // Load products data
  const productsCode = fs.readFileSync(path.join(__dirname, 'js/products-data.js'), 'utf8');
  vm.runInContext(productsCode, sandbox);

  // Load auth
  let authCode = fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8');
  authCode = authCode.replace(/import\s*{[^}]*}\s*from\s*["'].*?["'];?/s, 'const auth = { get currentUser() { return window.localStorage._activeFirebaseUser || null; } }, googleProvider = {}, onAuthStateChanged = (a, cb) => { cb(window.localStorage._activeFirebaseUser || null); }, signInWithEmailAndPassword = async () => {}, createUserWithEmailAndPassword = async () => {}, signInWithPopup = async () => {}, signOut = async () => {}, updateProfile = async () => {}, sendPasswordResetEmail = async () => {}, setPersistence = async () => {}, browserLocalPersistence = {}, firebaseConfig = {};');
  vm.runInContext(authCode, sandbox);

  // Mock PinboardReviews DB backend
  sandbox.PinboardReviews = {
    getReviewsForProduct: async (pid) => {
      const list = dbState.productsReviews[String(pid)] || [];
      return JSON.parse(JSON.stringify(list));
    },
    submitReview: async ({ productId, userId, userName, userEmail, rating, text }) => {
      const pid = String(productId);
      if (!dbState.productsReviews[pid]) dbState.productsReviews[pid] = [];
      const list = dbState.productsReviews[pid];
      const idx = list.findIndex(r => r.userId === userId);
      const isUpdate = idx !== -1;

      const reviewObj = {
        id: `rev_${userId}_${pid}`,
        productId: pid,
        userId,
        userName,
        userEmail,
        rating: Number(rating),
        text: String(text).trim(),
        createdAt: isUpdate ? list[idx].createdAt : new Date().toISOString()
      };

      if (isUpdate) {
        list[idx] = reviewObj;
      } else {
        list.unshift(reviewObj);
      }

      let sum = 0;
      list.forEach(r => { sum += r.rating; });
      const avg = Number((sum / list.length).toFixed(1));

      return {
        success: true,
        reviewId: reviewObj.id,
        newRatingAverage: avg,
        newCount: list.length,
        isUpdate
      };
    }
  };

  // Helper method to set mock active user
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

  // Load product controller
  const productCode = fs.readFileSync(path.join(__dirname, 'js/product.js'), 'utf8');
  vm.runInContext(productCode, sandbox);

  return {
    sandbox,
    documentElements,
    dbState,
    mockLocalStorage
  };
}

async function runReviewTests() {
  const tick = () => new Promise(r => setTimeout(r, 20));

  console.log('================================================================');
  console.log('--- PINBOARD REAL REVIEW & SHARED RATING SYSTEM TEST SUITE ---');
  console.log('================================================================\n');

  // TEST 1: Logged out -> Write Review -> Login prompt appears & modal blocked
  console.log('--- TEST 1: Guest -> Write Review -> Login Prompt Required ---');
  {
    const env = createEnvironment('desktop');
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), false, 'User is logged out');

    env.documentElements.pdpOpenReviewModalBtn.click();
    await tick();

    assert.strictEqual(env.documentElements.reviewModal.style.display, 'none', 'Modal remains hidden for guest');
    assert.strictEqual(env.documentElements.pdpAuthPrompt.style.display, 'block', 'Auth prompt shown to guest');
    assert(env.documentElements.pdpAuthPrompt.innerHTML.includes('Please login to write a review'), 'Prompt contains correct message');
    console.log('✅ PASS: Guest clicking Write Review is blocked & prompted to login');
  }

  // TEST 2: Logged out -> Submit review attempt -> Blocked
  console.log('\n--- TEST 2: Guest -> Submit Review Attempt -> Blocked ---');
  {
    const env = createEnvironment('desktop');
    env.documentElements.reviewAuthorName.value = 'Hacker Guest';
    env.documentElements.reviewText.value = 'Fake review attempt';
    env.documentElements.pdpReviewForm.submit();
    await tick();

    assert.strictEqual(Object.keys(env.dbState.productsReviews).length, 0, 'No review created in DB for guest');
    console.log('✅ PASS: Guest submit review attempt rejected safely');
  }

  // TEST 3: Logged in -> User A submits 5-star review on Product 12 -> Saved to DB
  console.log('\n--- TEST 3: User A -> Submit 5-Star Review on Product 12 ---');
  let sharedDbState;
  {
    const env = createEnvironment('desktop');
    sharedDbState = env.dbState; // Keep DB instance for cross-user simulation
    env.sandbox.Auth.setUser({ uid: 'usr_spider_fan', name: 'Peter Parker Fan' });
    assert.strictEqual(env.sandbox.Auth.isLoggedIn(), true);

    env.documentElements.pdpOpenReviewModalBtn.click();
    await tick();
    assert.strictEqual(env.documentElements.reviewModal.style.display, 'flex', 'Modal opens for logged-in user');

    env.documentElements.reviewRatingVal.value = '5';
    env.documentElements.reviewAuthorName.value = 'Peter Parker Fan';
    env.documentElements.reviewText.value = 'Spider-Man poster quality is absolutely insane! 10/10 print!';
    env.documentElements.pdpReviewForm.submit();
    await tick();

    const p12Reviews = sharedDbState.productsReviews['12'];
    assert(p12Reviews && p12Reviews.length === 1, 'Review permanently stored in DB');
    assert.strictEqual(p12Reviews[0].rating, 5, 'Rating 5 stored');
    assert.strictEqual(p12Reviews[0].userId, 'usr_spider_fan', 'Associated with User A UID');
    assert.strictEqual(env.documentElements.pdpReviewScore.textContent, '5.0', 'PDP Score updated to 5.0');
    assert.strictEqual(env.documentElements.pdpReviewCountBadge.textContent, '1 review', 'Count badge updated to 1 review');
    console.log('✅ PASS: User A review permanently saved in DB & rating updated to 5.0 (1 review)');
  }

  // TEST 4: Page Refresh -> Review & rating remain 5.0 / 1 review
  console.log('\n--- TEST 4: Page Refresh Simulation -> Rating & Review Persist ---');
  {
    const refreshedEnv = createEnvironment('desktop', sharedDbState);
    await tick();

    assert.strictEqual(refreshedEnv.documentElements.pdpReviewScore.textContent, '5.0', 'Score persists as 5.0 after refresh');
    assert.strictEqual(refreshedEnv.documentElements.pdpReviewCountBadge.textContent, '1 review', 'Count badge persists as 1 review');
    assert(refreshedEnv.documentElements.pdpReviewsPreviewList.innerHTML.includes('Spider-Man poster quality'), 'User A review visible after refresh');
    console.log('✅ PASS: Database data correctly reloaded after page refresh');
  }

  // TEST 5 & 6: User B opens same product -> Sees User A's review & 5.0 rating
  console.log('\n--- TEST 5 & 6: User B Logged In -> Sees Shared Rating & User A Review ---');
  {
    const userBEnv = createEnvironment('desktop', sharedDbState);
    userBEnv.sandbox.Auth.setUser({ uid: 'usr_messi_king', name: 'Lionel Collector' });
    await tick();

    assert.strictEqual(userBEnv.documentElements.pdpReviewScore.textContent, '5.0', 'User B sees shared 5.0 score');
    assert(userBEnv.documentElements.pdpReviewsPreviewList.innerHTML.includes('Peter Parker Fan'), 'User B sees User A author name');
    console.log('✅ PASS: Rating and review shared accurately across different user accounts');
  }

  // TEST 7: User B submits 4-star review -> Average becomes (5+4)/2 = 4.5 / 2 reviews
  console.log('\n--- TEST 7: User B Submits 4-Star Review -> Aggregate Rating Becomes 4.5 ---');
  {
    const userBEnv = createEnvironment('desktop', sharedDbState);
    userBEnv.sandbox.Auth.setUser({ uid: 'usr_messi_king', name: 'Lionel Collector' });
    await tick();

    userBEnv.documentElements.pdpOpenReviewModalBtn.click();
    await tick();

    userBEnv.documentElements.reviewRatingVal.value = '4';
    userBEnv.documentElements.reviewAuthorName.value = 'Lionel Collector';
    userBEnv.documentElements.reviewText.value = 'Great matte finish, paper thickness is great.';
    userBEnv.documentElements.pdpReviewForm.submit();
    await tick();

    const p12Reviews = sharedDbState.productsReviews['12'];
    assert.strictEqual(p12Reviews.length, 2, '2 reviews total stored in DB');
    assert.strictEqual(userBEnv.documentElements.pdpReviewScore.textContent, '4.5', 'Average rating correctly calculated to (5+4)/2 = 4.5');
    assert.strictEqual(userBEnv.documentElements.pdpReviewCountBadge.textContent, '2 reviews', 'Review count updated to 2 reviews');
    console.log('✅ PASS: Multi-user ratings aggregated atomically to 4.5 (2 reviews)');
  }

  // TEST 8: User B re-submits (edits) review to 5 stars -> Average becomes (5+5)/2 = 5.0 / 2 reviews (NO DUPLICATE!)
  console.log('\n--- TEST 8: User B Re-submits Review -> Updates Existing & Recalculates Without Duplicates ---');
  {
    const userBEnv = createEnvironment('desktop', sharedDbState);
    userBEnv.sandbox.Auth.setUser({ uid: 'usr_messi_king', name: 'Lionel Collector' });
    await tick();

    userBEnv.documentElements.pdpOpenReviewModalBtn.click();
    await tick();

    userBEnv.documentElements.reviewRatingVal.value = '5';
    userBEnv.documentElements.reviewAuthorName.value = 'Lionel Collector';
    userBEnv.documentElements.reviewText.value = 'Updated: Changing to 5 stars! The colors are magnificent!';
    userBEnv.documentElements.pdpReviewForm.submit();
    await tick();

    const p12Reviews = sharedDbState.productsReviews['12'];
    assert.strictEqual(p12Reviews.length, 2, 'Still exactly 2 reviews in DB (no duplicates!)');
    assert.strictEqual(userBEnv.documentElements.pdpReviewScore.textContent, '5.0', 'Average updated to (5+5)/2 = 5.0');
    console.log('✅ PASS: Re-submitting review updates existing record without creating duplicates');
  }

  // TEST 9: Open Product 11 (Messi) -> Reviews are isolated (0 reviews, 0.0, No reviews yet)
  console.log('\n--- TEST 9: Product Isolation -> Product 11 Reviews are Independent ---');
  {
    const prod11Env = createEnvironment('desktop', sharedDbState, '?id=11');
    await tick();

    assert.strictEqual(prod11Env.documentElements.pdpReviewScore.textContent, '0.0', 'Product 11 rating is 0.0');
    assert.strictEqual(prod11Env.documentElements.pdpReviewCountBadge.textContent, 'No reviews yet', 'Product 11 has No reviews yet');
    assert.strictEqual(prod11Env.documentElements.pdpReviewsPreviewList.innerHTML, '', 'Product 11 review preview list is empty');
    console.log('✅ PASS: Product 12 reviews do not leak into Product 11');
  }

  // TEST 10: XSS Sanitization & HTML Escaping
  console.log('\n--- TEST 10: XSS Sanitization -> Malicious HTML Tags Escaped ---');
  {
    const env = createEnvironment('desktop', sharedDbState);
    env.sandbox.Auth.setUser({ uid: 'usr_xss_test', name: 'Security Tester' });
    await tick();

    env.documentElements.reviewRatingVal.value = '5';
    env.documentElements.reviewAuthorName.value = '<script>alert("xss")</script>';
    env.documentElements.reviewText.value = '<img src=x onerror=alert(1)> Awesome poster!';
    env.documentElements.pdpReviewForm.submit();
    await tick();

    const html = env.documentElements.pdpReviewsPreviewList.innerHTML;
    assert(!html.includes('<script>'), 'Script tags stripped or escaped');
    assert(html.includes('&lt;script&gt;') || !html.includes('<script>alert'), 'XSS payload safely escaped');
    console.log('✅ PASS: Malicious review text sanitized against XSS attacks');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL REVIEW & RATING SYSTEM TEST SCENARIOS PASSED WITH ZERO ERRORS!');
  console.log('================================================================');
}

runReviewTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
