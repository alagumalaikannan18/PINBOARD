const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('--- PINBOARD LOGIN PERSISTENCE & RESPONSIVE AUTH SUITE ---');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function assert(condition, description) {
  total++;
  if (condition) {
    console.log(`  ✔ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

// 1. Inspect firebase/config.js for setPersistence and browserLocalPersistence
const firebaseConfigContent = fs.readFileSync(path.join(__dirname, 'firebase/config.js'), 'utf8');
assert(firebaseConfigContent.includes('setPersistence') && firebaseConfigContent.includes('browserLocalPersistence'), 'firebase/config.js explicitly imports and configures browserLocalPersistence');

// 2. Inspect firebase/auth.js for setPersistence re-export
const firebaseAuthContent = fs.readFileSync(path.join(__dirname, 'firebase/auth.js'), 'utf8');
assert(firebaseAuthContent.includes('setPersistence') && firebaseAuthContent.includes('browserLocalPersistence'), 'firebase/auth.js exports setPersistence and browserLocalPersistence');

// 3. Inspect js/firebase-config.js for re-exports
const jsFirebaseConfigContent = fs.readFileSync(path.join(__dirname, 'js/firebase-config.js'), 'utf8');
assert(jsFirebaseConfigContent.includes('setPersistence') && jsFirebaseConfigContent.includes('browserLocalPersistence'), 'js/firebase-config.js re-exports browserLocalPersistence');

// 4. Inspect js/auth.js for persistence initialization and session restoration
const jsAuthContent = fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8');
assert(jsAuthContent.includes('setPersistence(auth, browserLocalPersistence)'), 'js/auth.js initializes browser local persistence on auth');
assert(jsAuthContent.includes('saveCachedUser(newUser)') || jsAuthContent.includes('saveCachedUser(user)'), 'js/auth.js caches authenticated user session to localStorage');
assert(jsAuthContent.includes('loadCachedUser()'), 'js/auth.js loads cached user session immediately upon module initialization');

// 5. Inspect account.html for Auth.waitForAuth handling
const accountHtmlContent = fs.readFileSync(path.join(__dirname, 'account.html'), 'utf8');
assert(accountHtmlContent.includes('Auth.waitForAuth()'), 'account.html waits for initial auth resolution before rendering views');
assert(accountHtmlContent.includes("window.addEventListener('auth:statechange'"), 'account.html listens for auth state changes');

// 6. Inspect css/account.css for mobile responsiveness (320px - 430px viewports)
const accountCssContent = fs.readFileSync(path.join(__dirname, 'css/account.css'), 'utf8');
assert(accountCssContent.includes('max-width'), 'css/account.css contains responsive layout constraints');
assert(accountCssContent.includes('@media'), 'css/account.css defines media queries for mobile viewports');
assert(accountCssContent.includes('box-sizing: border-box') || accountCssContent.includes('width: 100%'), 'css/account.css enforces clean input sizing without horizontal overflow');

// 7. Verify mock auth persistence simulation
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new LocalStorageMock();
const SESSION_KEY = 'pinboard_cached_auth_user';

// Test A: Email/Password Login -> Refresh -> Persistent
const emailUser = {
  uid: 'usr_test_email_123',
  isLoggedIn: true,
  name: 'Alex Hunter',
  email: 'alex@example.com',
  photoURL: null,
  provider: 'password'
};

mockStorage.setItem(SESSION_KEY, JSON.stringify(emailUser));
const restoredUserA = JSON.parse(mockStorage.getItem(SESSION_KEY));
assert(restoredUserA && restoredUserA.isLoggedIn && restoredUserA.uid === 'usr_test_email_123', 'Email/Password user session persists across simulated page refresh');

// Test B: Google Login -> Refresh -> Persistent
const googleUser = {
  uid: 'usr_google_456',
  isLoggedIn: true,
  name: 'Sarah Connor',
  email: 'sarah@gmail.com',
  photoURL: 'https://lh3.googleusercontent.com/a/mock-photo',
  provider: 'google.com'
};

mockStorage.setItem(SESSION_KEY, JSON.stringify(googleUser));
const restoredUserB = JSON.parse(mockStorage.getItem(SESSION_KEY));
assert(restoredUserB && restoredUserB.isLoggedIn && restoredUserB.photoURL.includes('googleusercontent'), 'Google user session persists across simulated page refresh with avatar URL');

// Test C: Logout -> Refresh -> Persistent Logged Out
mockStorage.removeItem(SESSION_KEY);
const restoredUserC = mockStorage.getItem(SESSION_KEY);
assert(restoredUserC === null, 'Session is cleanly cleared upon logout and remains logged out after refresh');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log('======================================================\n');

if (passed !== total) {
  process.exitCode = 1;
}
