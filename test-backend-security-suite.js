/**
 * PINBOARD Backend Security & Price Tampering Verification Suite
 * Verifies:
 * 1. Price tampering defense (client sends ₹1, server recalculates to authoritative price)
 * 2. Custom poster server-side matrix pricing recalculation
 * 3. Cart price spoofing prevention
 * 4. User order isolation across distinct accounts
 * 5. Rules & index configuration syntax and structure
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, headers: res.headers, data: json };
}

async function runBackendSecurityTests() {
  console.log('================================================================');
  console.log('PINBOARD BACKEND SECURITY & PRICE TAMPERING VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
    }
  }

  // --- 1. Price Tamper Attack on Standard Poster ---
  console.log('--- 1. Testing Defense Against Price Tampering (DevTools Tamper) ---');
  // Attempt to buy Riso Retro (Product ID 7, normal price ₹1,399) by forging price: 1
  const forgedOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'user_victim_101'
    },
    body: JSON.stringify({
      items: [
        {
          productId: 7,
          title: 'Riso Retro — Set of 3',
          price: 1, // MALICIOUS CLIENT TAMPER: Trying to buy for ₹1
          quantity: 1
        }
      ]
    })
  });

  test('Order creation succeeds with server response', () => {
    assert.strictEqual(forgedOrderRes.status, 201, 'Order created');
    assert(forgedOrderRes.data.success, 'Response indicates success');
  });

  test('Server rejected client price ₹1 and recalculated to authoritative ₹1,399', () => {
    const createdOrder = forgedOrderRes.data.data;
    assert.strictEqual(createdOrder.totalAmount, 1399, `Total should be 1399, got ${createdOrder.totalAmount}`);
    assert.strictEqual(createdOrder.items[0].price, 1399, `Item price should be 1399, got ${createdOrder.items[0].price}`);
  });

  // --- 2. Custom Poster Server-Side Price Calculation ---
  console.log('\n--- 2. Testing Custom Poster Studio Sizing Price Calculation ---');
  // 5 posters: 3 A4 (3 x 399 = 1197) + 2 A3 (2 x 549 = 1098) = Total ₹2,295
  // Malicious client tries to send price: 5
  const customOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'user_custom_202'
    },
    body: JSON.stringify({
      items: [
        {
          productId: 'custom-' + Date.now(),
          isCustom: true,
          template: 5,
          title: 'Custom Poster Set (5 Prints)',
          price: 5, // MALICIOUS TAMPER: Trying to buy custom set for ₹5
          quantity: 1,
          posters: [
            { slot: 1, size: 'A4' },
            { slot: 2, size: 'A4' },
            { slot: 3, size: 'A4' },
            { slot: 4, size: 'A3' },
            { slot: 5, size: 'A3' }
          ]
        }
      ]
    })
  });

  test('Custom poster order total is recalculated server-side to ₹2,295 (not ₹5)', () => {
    assert.strictEqual(customOrderRes.status, 201, 'Order created');
    const order = customOrderRes.data.data;
    const expected = (3 * 399) + (2 * 549); // 1197 + 1098 = 2295
    assert.strictEqual(order.totalAmount, expected, `Total should be ${expected}, got ${order.totalAmount}`);
    assert.strictEqual(order.items[0].price, expected, `Item price should be ${expected}`);
  });

  // --- 3. Cart Price Spoofing Defense ---
  console.log('\n--- 3. Testing Cart Price Tampering Defense ---');
  const cartUserId = 'user_cart_spoof_' + Date.now();
  const cartTamperRes = await request('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': cartUserId
    },
    body: JSON.stringify({
      productId: 1, // Sunset Ridge, catalog salePrice is 649
      price: 15,    // MALICIOUS TAMPER: Trying to set cart item price to ₹15
      quantity: 1
    })
  });

  test('Cart item price is overridden with authoritative catalog price ₹649', () => {
    assert.strictEqual(cartTamperRes.status, 201, 'Added to cart');
    const items = cartTamperRes.data.items;
    const item = items.find(i => i.productId === 1);
    assert(item, 'Item 1 in cart');
    assert.strictEqual(item.price, 649, `Price should be 649, got ${item.price}`);
  });

  // --- 4. User Order Isolation Defense ---
  console.log('\n--- 4. Testing Order Isolation Between Distinct Users ---');
  const userAOrder = forgedOrderRes.data.data;
  const orderId = userAOrder.orderId;

  // Attacker User B attempts to access User A's order by ID
  const unauthorizedFetchRes = await request(`/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-user-id': 'attacker_user_b'
    }
  });

  test('Attacker User B cannot access User A order (returns 404/not found for user)', () => {
    assert.strictEqual(unauthorizedFetchRes.status, 404, 'Must return 404 for unauthorized order lookup');
    assert.strictEqual(unauthorizedFetchRes.data.success, false);
  });

  // Legitimate User A accesses their own order
  const legitimateFetchRes = await request(`/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-user-id': 'user_victim_101'
    }
  });

  test('Legitimate User A successfully retrieves their own order', () => {
    assert.strictEqual(legitimateFetchRes.status, 200, 'User A can view own order');
    assert.strictEqual(legitimateFetchRes.data.data.orderId, orderId);
  });

  // --- 5. Firestore & Storage Security Rules Verification ---
  console.log('\n--- 5. Verifying Firestore & Storage Security Files ---');
  
  test('firestore.rules exists and validates ownership & admin permissions', () => {
    const rulesPath = path.resolve(__dirname, 'firestore.rules');
    assert(fs.existsSync(rulesPath), 'firestore.rules exists');
    const content = fs.readFileSync(rulesPath, 'utf8');
    assert(content.includes('function isOwner(userId)'), 'Contains isOwner helper');
    assert(content.includes('match /products/{productId}'), 'Protects products collection');
    assert(content.includes('match /orders/{orderId}'), 'Protects orders collection');
    assert(content.includes('request.auth.uid == userId'), 'Enforces user isolation');
  });

  test('storage.rules exists and enforces 100MB limit & image MIME type', () => {
    const storageRulesPath = path.resolve(__dirname, 'storage.rules');
    assert(fs.existsSync(storageRulesPath), 'storage.rules exists');
    const content = fs.readFileSync(storageRulesPath, 'utf8');
    assert(content.includes('100 * 1024 * 1024'), 'Enforces 100MB file size limit');
    assert(content.includes("contentType.matches('image/.*')"), 'Enforces image MIME validation');
    assert(content.includes('users/{userId}/custom-posters'), 'User isolated upload paths');
  });

  test('firestore.indexes.json exists with composite indexes for orders & products', () => {
    const indexPath = path.resolve(__dirname, 'firestore.indexes.json');
    assert(fs.existsSync(indexPath), 'firestore.indexes.json exists');
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    assert(Array.isArray(parsed.indexes), 'Indexes array exists');
    assert(parsed.indexes.some(i => i.collectionGroup === 'orders'), 'Has orders composite index');
    assert(parsed.indexes.some(i => i.collectionGroup === 'products'), 'Has products composite index');
  });

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed}/${total} BACKEND SECURITY & INTEGRITY TESTS PASSED!`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runBackendSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
