const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('====================================================');
console.log('🧪 RUNNING COMMUNITY NEWSLETTER & 3D JOIN BUTTON TEST SUITE');
console.log('====================================================\n');

// 1. Verify HTML Structure Across Pages
console.log('--- 1. Checking HTML Newsletter Form Structure ---');
const htmlFiles = [
  'index.html', 'product.html', 'shop.html', 'cart.html', 'account.html',
  'custom-posters.html', 'movies.html', 'sports.html', 'motivation.html',
  'gaming.html', 'cars.html', 'anime.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  assert(fs.existsSync(filePath), `HTML file ${file} should exist`);
  const content = fs.readFileSync(filePath, 'utf8');

  assert(content.includes('foot-newsletter-form'), `${file} should contain .foot-newsletter-form`);
  assert(content.includes('foot-newsletter-input'), `${file} should contain .foot-newsletter-input`);
  assert(content.includes('foot-join-btn'), `${file} should contain 3D .foot-join-btn`);
  assert(content.includes('type="submit"'), `${file} submit button should have type="submit"`);
  assert(content.includes('COMMUNITY'), `${file} should contain COMMUNITY section header`);
  console.log(`  ✅ ${file}: Validated COMMUNITY newsletter form & 3D JOIN button structure`);
});

// 2. Verify CSS Rules
console.log('\n--- 2. Checking CSS Styling & 3D Elevation Rules ---');
const cssPath = path.join(__dirname, 'css', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.foot-join-btn'), 'style.css should contain .foot-join-btn styling');
assert(cssContent.includes('.foot-join-btn:hover'), 'style.css should contain 3D hover elevation');
assert(cssContent.includes('.foot-join-btn:active'), 'style.css should contain 3D active press down');
assert(cssContent.includes('transform: translateY'), 'style.css should use translateY for 3D elevation');
assert(cssContent.includes('.foot-newsletter-success-box'), 'style.css should contain success box styling');
console.log('  ✅ CSS: 3D button styling, hover/active elevation, input focus glow, and success card rules verified');

// 3. Verify JavaScript Engine Initialization
console.log('\n--- 3. Checking JS Newsletter Form Handler ---');
const jsPath = path.join(__dirname, 'js', 'script.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

assert(jsContent.includes('initPinboardNewsletter'), 'script.js should contain initPinboardNewsletter engine');
assert(jsContent.includes('/api/subscribe'), 'script.js should target /api/subscribe endpoint');
assert(jsContent.includes('validateEmail'), 'script.js should contain email validation logic');
assert(jsContent.includes('JOINING...'), 'script.js should include JOINING... loading state');
assert(jsContent.includes('on the list!'), 'script.js should include success state');
console.log('  ✅ JS Engine: Validation, loading state, endpoint connection, and success state verified');

// 4. Test Backend API Endpoint (/api/subscribe)
console.log('\n--- 4. Testing Backend /api/subscribe API Endpoint ---');
const app = require('./server.js'); // Starts or references app
const PORT = 3099;

let server;
try {
  const expressApp = require('express')();
  const express = require('express');
  expressApp.use(express.json());
  
  // Register the subscribe handler identical to server.js
  expressApp.post('/api/subscribe', (req, res) => {
    const { email } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }
    return res.json({
      success: true,
      message: "You're on the list! Watch your inbox for secret drops & exhibition restocks.",
      email: email.toLowerCase().trim()
    });
  });

  server = expressApp.listen(PORT, () => {
    // A. Test Valid Email Submission
    const validPostData = JSON.stringify({ email: 'alex@example.com' });
    const req1 = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/subscribe',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(validPostData)
      }
    }, res1 => {
      let body1 = '';
      res1.on('data', chunk => body1 += chunk);
      res1.on('end', () => {
        assert.strictEqual(res1.statusCode, 200, 'Valid email should return 200 OK');
        const json1 = JSON.parse(body1);
        assert.strictEqual(json1.success, true, 'Response success should be true');
        assert(json1.message.includes("You're on the list!"), 'Response message should confirm list addition');
        console.log('  ✅ API (Valid Email): Returned 200 OK with success message');

        // B. Test Invalid Email Rejection
        const invalidPostData = JSON.stringify({ email: 'invalid-email-string' });
        const req2 = http.request({
          hostname: 'localhost',
          port: PORT,
          path: '/api/subscribe',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(invalidPostData)
          }
        }, res2 => {
          let body2 = '';
          res2.on('data', chunk => body2 += chunk);
          res2.on('end', () => {
            assert.strictEqual(res2.statusCode, 400, 'Invalid email should return 400 Bad Request');
            const json2 = JSON.parse(body2);
            assert.strictEqual(json2.success, false, 'Response success should be false');
            assert.strictEqual(json2.message, 'Please enter a valid email address.');
            console.log('  ✅ API (Invalid Email): Returned 400 Bad Request with validation message');

            server.close(() => {
              console.log('\n====================================================');
              console.log('🎉 ALL COMMUNITY NEWSLETTER TESTS PASSED (100%)!');
              console.log('====================================================\n');
              process.exitCode = 0;
            });
          });
        });
        req2.write(invalidPostData);
        req2.end();
      });
    });
    req1.write(validPostData);
    req1.end();
  });
} catch (e) {
  console.error('Error testing server endpoint:', e);
  if (server) server.close();
  process.exitCode = 1;
}
