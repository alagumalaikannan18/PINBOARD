const http = require('http');

console.log('====================================================');
console.log('PINBOARD FULL-STACK BACKEND & API VERIFICATION SUITE');
console.log('====================================================\n');

async function request(urlPath, options = {}) {
  const url = `http://localhost:3000${urlPath}`;
  const headers = Object.assign({
    'Content-Type': 'application/json',
    'x-user-id': 'test_user_123'
  }, options.headers || {});

  const fetchOptions = {
    method: options.method || 'GET',
    headers: headers
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  try {
    // 1. Health check
    console.log('--- 1. Health Endpoint ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'GET /api/health returned 200 OK');
    assert(health.data.status === 'ok', 'Health status is ok');

    // 2. Products List
    console.log('\n--- 2. Products Catalog API ---');
    const productsRes = await request('/api/products');
    assert(productsRes.status === 200, 'GET /api/products returned 200 OK');
    assert(productsRes.data.success === true, 'Products API returned success: true');
    assert(Array.isArray(productsRes.data.data) && productsRes.data.data.length >= 14, 'All 14 catalog products available');

    // 3. Single Product API
    console.log('\n--- 3. Single Product Lookup ---');
    const prod1 = await request('/api/products/1');
    assert(prod1.status === 200, 'GET /api/products/1 returned 200 OK');
    assert(prod1.data.data.id === 1 && (prod1.data.data.slug === 'sunset-ridge' || prod1.data.data.title.includes('DISCIPLINE') || prod1.data.data.title === 'Sunset Ridge'), 'Product 1 lookup verified');

    const prodSpider = await request('/api/products/rebirth-spiderman');
    assert(prodSpider.status === 200, 'GET /api/products/rebirth-spiderman returned 200 OK');
    assert(prodSpider.data.data.id === 12, 'Product slug mapped to ID 12');

    // 4. Search API
    console.log('\n--- 4. Search API ---');
    const searchMessi = await request('/api/products/search?q=messi');
    assert(searchMessi.status === 200, 'GET /api/products/search?q=messi returned 200');
    assert(searchMessi.data.data.length >= 1, 'Found Messi poster');
    assert(searchMessi.data.data.some(p => (p.title || '').toLowerCase().includes('messi') || (p.keywords || '').toLowerCase().includes('messi')), 'Messi poster verified');

    const searchSpider = await request('/api/products/search?q=spider-man');
    assert(searchSpider.status === 200, 'GET /api/products/search?q=spider-man returned 200');
    assert(searchSpider.data.data.length >= 1, 'Found Spider-Man poster');

    // 5. Cart Management & Strict Duplicate Prevention
    console.log('\n--- 5. Cart API & Duplicate Prevention ---');
    // Clear cart first
    await request('/api/cart', { method: 'DELETE' });

    const emptyCart = await request('/api/cart');
    assert(emptyCart.data.count === 0, 'Cart starts empty');

    // First add of Product 1
    const add1 = await request('/api/cart', {
      method: 'POST',
      body: { productId: 1, quantity: 2 }
    });
    assert(add1.status === 201, 'POST /api/cart added Product 1');
    assert(add1.data.alreadyInCart === false, 'Product 1 was not previously in cart');
    assert(add1.data.count === 1, 'Cart count is 1 after first addition');

    // Second add of Product 1 (Duplicate Attempt)
    const addDuplicate = await request('/api/cart', {
      method: 'POST',
      body: { productId: 1, quantity: 1 }
    });
    assert(addDuplicate.data.alreadyInCart === true, 'Duplicate addition returned alreadyInCart: true');
    assert(addDuplicate.data.count === 1, 'Cart count strictly remained 1 after duplicate attempt');

    // Add Product 2 (Unique)
    const add2 = await request('/api/cart', {
      method: 'POST',
      body: { productId: 2, quantity: 1 }
    });
    assert(add2.data.count === 2, 'Cart count increased to 2 after adding Product 2');

    // Update Quantity
    const updateQty = await request('/api/cart/1', {
      method: 'PATCH',
      body: { quantity: 3 }
    });
    assert(updateQty.status === 200, 'PATCH /api/cart/1 updated quantity');
    assert(updateQty.data.items.find(i => i.productId === 1).quantity === 3, 'Quantity updated to 3');

    // Remove Product 1
    const remove1 = await request('/api/cart/1', { method: 'DELETE' });
    assert(remove1.status === 200, 'DELETE /api/cart/1 removed product 1');
    assert(remove1.data.count === 1, 'Cart count decreased to 1');

    // 6. Orders API
    console.log('\n--- 6. Orders API ---');
    const createOrd = await request('/api/orders', {
      method: 'POST',
      body: {
        productId: 2,
        quantity: 2
      }
    });
    assert(createOrd.status === 201, 'POST /api/orders created order');
    assert(createOrd.data.data.orderId.startsWith('PB-2026-'), 'Order ID generated with format PB-2026-XXXX');

    const ordersList = await request('/api/orders');
    assert(ordersList.status === 200, 'GET /api/orders returned user orders');
    assert(ordersList.data.data.length >= 1, 'User has order history');

    // 7. Frontend HTML & Routing Aliases (No 404s)
    console.log('\n--- 7. Frontend Routing Aliases ---');
    const home = await request('/');
    assert(home.status === 200, 'GET / returned 200');

    const productPage = await request('/product?id=1');
    assert(productPage.status === 200, 'GET /product?id=1 returned 200');

    const productDetail = await request('/product/1');
    assert(productDetail.status === 200, 'GET /product/1 route alias returned 200');

    const accountPage = await request('/account');
    assert(accountPage.status === 200, 'GET /account route alias returned 200');

    const shopPage = await request('/shop');
    assert(shopPage.status === 200, 'GET /shop route alias returned 200');

    console.log('\n====================================================');
    console.log('🎉 ALL FULL-STACK BACKEND VERIFICATION TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test suite execution error:', err);
    process.exit(1);
  }
}

runTests();
