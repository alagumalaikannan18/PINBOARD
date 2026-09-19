// ==========================================================================
// TEST SUITE: PINBOARD Order Request & Email Automation Verification
// ==========================================================================

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    \x1b[33mError:\x1b[0m ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    \x1b[33mError:\x1b[0m ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('PINBOARD ORDER REQUEST & EMAIL AUTOMATION TEST SUITE');
console.log('======================================================\n');

// 1. Mailer Module Verification
console.log('--- 1. Mailer Module Unit Verification ---');

const mailer = require('./config/mailer');

test('config/mailer.js exports sendOwnerNotification and sendCustomerThankYou', () => {
  assert.strictEqual(typeof mailer.sendOwnerNotification, 'function');
  assert.strictEqual(typeof mailer.sendCustomerThankYou, 'function');
});

asyncTest('sendOwnerNotification creates valid email payload without error', async () => {
  const sampleOrder = {
    orderId: 'PB-2026-TEST-999',
    customerName: 'Aravind Kumar',
    customerEmail: 'aravind@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      street: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001'
    },
    items: [
      { productId: 1, title: 'Bauhaus No.1', size: 'A3', quantity: 2, price: 549 }
    ],
    totalAmount: 1098,
    orderStatus: 'Pending Confirmation',
    paymentStatus: 'Pending'
  };

  const res = await mailer.sendOwnerNotification(sampleOrder);
  assert(res.success === true, 'sendOwnerNotification must return success: true');
});

asyncTest('sendCustomerThankYou creates valid email payload without error', async () => {
  const sampleOrder = {
    orderId: 'PB-2026-TEST-999',
    customerName: 'Aravind Kumar',
    customerEmail: 'aravind@example.com',
    customerPhone: '9876543210',
    items: [
      { productId: 1, title: 'Bauhaus No.1', size: 'A3', quantity: 2, price: 549 }
    ],
    totalAmount: 1098,
    orderStatus: 'Pending Confirmation',
    paymentStatus: 'Pending'
  };

  const res = await mailer.sendCustomerThankYou(sampleOrder);
  assert(res.success === true, 'sendCustomerThankYou must return success: true');
});

// 2. Order Controller API Integration Verification
console.log('\n--- 2. Order Request API Integration ---');

const http = require('http');

function postOrder(payload) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

asyncTest('POST /api/orders creates Order Request with Pending Confirmation status', async () => {
  const payload = {
    productId: 2,
    size: 'A4',
    quantity: 1,
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@gmail.com',
    customerPhone: '9876543210',
    shippingAddress: {
      street: 'Flat 402, Sunset Heights',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    orderNotes: 'Please call before delivery',
    isRequest: true
  };

  const res = await postOrder(payload);
  assert.strictEqual(res.status, 201, `Expected 201 status code, got ${res.status}`);
  assert.strictEqual(res.body.success, true, 'Response body success must be true');
  assert(res.body.data.orderId.startsWith('PB-2026-'), 'Order ID must start with PB-2026-');
  assert.strictEqual(res.body.data.orderStatus, 'Pending Confirmation', 'Order status must be Pending Confirmation');
  assert.strictEqual(res.body.data.paymentStatus, 'Pending', 'Payment status must be Pending');
  assert.strictEqual(res.body.data.customerName, 'Priya Sharma', 'Customer name must match');
  assert.strictEqual(res.body.data.customerEmail, 'priya.sharma@gmail.com', 'Customer email must match');
});

// 3. Frontend Order Request Modal Markup Verification
console.log('\n--- 3. Frontend Markup & Modal Integration ---');

test('product.html contains Order Request Modal and Success Modal', () => {
  const html = fs.readFileSync(path.join(__dirname, 'product.html'), 'utf8');
  assert(html.includes('id="orderRequestModal"'), 'product.html must contain orderRequestModal');
  assert(html.includes('id="orderSuccessModal"'), 'product.html must contain orderSuccessModal');
  assert(html.includes('id="orderRequestForm"'), 'product.html must contain orderRequestForm');
  assert(html.includes('id="orderCustName"'), 'product.html must contain Full Name input');
  assert(html.includes('id="orderCustEmail"'), 'product.html must contain Email input');
  assert(html.includes('id="orderCustPhone"'), 'product.html must contain Phone input');
  assert(html.includes('id="orderCustAddress"'), 'product.html must contain Address input');
  assert(html.includes('id="orderCustCity"'), 'product.html must contain City input');
  assert(html.includes('id="orderCustState"'), 'product.html must contain State input');
  assert(html.includes('id="orderCustPincode"'), 'product.html must contain PIN code input');
  assert(html.includes('No payment is collected online'), 'product.html must contain non-payment notice');
});

test('css/style.css contains responsive modal layout rules', () => {
  const css = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');
  assert(css.includes('.order-modal-backdrop'), 'style.css must contain .order-modal-backdrop');
  assert(css.includes('.order-modal-card'), 'style.css must contain .order-modal-card');
  assert(css.includes('.order-form-grid'), 'style.css must contain .order-form-grid');
  assert(css.includes('.btn-submit-order'), 'style.css must contain .btn-submit-order');
  assert(css.includes('.success-card'), 'style.css must contain .success-card');
});

(async () => {
  // Allow async tests to complete
  await new Promise(r => setTimeout(r, 1000));

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log(`======================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
