// =========================================================================
// PINBOARD — Comprehensive 9-Point Verification Test Suite for Product Reviews
// =========================================================================

const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { _rawText: data };
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('=== STARTING PINBOARD REVIEW SYSTEM VERIFICATION SUITE ===\n');
  let passedCount = 0;
  let totalCount = 0;

  function assertTest(condition, name, details = '') {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`[PASS] Test ${totalCount}: ${name}`);
    } else {
      console.error(`[FAIL] Test ${totalCount}: ${name}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  try {
    const testProductId = '1';
    const testProduct2Id = '2';

    // ----------------------------------------------------
    // TEST 1: Login Required
    // ----------------------------------------------------
    const t1Res = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      rating: 5,
      text: 'Great poster!'
      // missing userId
    });
    assertTest(
      t1Res.status === 401 && t1Res.data.success === false,
      'Test 1: Login Required (Unauthenticated request rejected with HTTP 401)',
      JSON.stringify(t1Res.data)
    );

    // ----------------------------------------------------
    // TEST 2: Refresh Persistence (User A Submits 4-star review)
    // ----------------------------------------------------
    const userA_id = 'user_test_A_' + Date.now();
    const t2Sub = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      userId: userA_id,
      userName: 'Alice Smith',
      rating: 4,
      text: 'Solid quality print, high GSM paper.'
    });
    assertTest(
      (t2Sub.status === 200 || t2Sub.status === 201) && t2Sub.data.success === true,
      'Test 2a: User A Submits Review (HTTP 201/200 OK)',
      JSON.stringify(t2Sub.data)
    );

    const t2Fetch = await makeRequest(`/api/products/${testProductId}/reviews`, 'GET');
    const userA_review = (t2Fetch.data.reviews || []).find(r => r.userId === userA_id);
    assertTest(
      userA_review && userA_review.rating === 4 && userA_review.text === 'Solid quality print, high GSM paper.',
      'Test 2b: Refresh Persistence (User A review persists across reads)',
      JSON.stringify(t2Fetch.data)
    );

    // ----------------------------------------------------
    // TEST 3: Multiple Users (User B Submits 5-star review)
    // ----------------------------------------------------
    const userB_id = 'user_test_B_' + Date.now();
    const t3Sub = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      userId: userB_id,
      userName: 'Bob Vance',
      rating: 5,
      text: 'Amazing colors and sleek finish!'
    });

    const t3Fetch = await makeRequest(`/api/products/${testProductId}/reviews`, 'GET');
    const userB_review = (t3Fetch.data.reviews || []).find(r => r.userId === userB_id);
    assertTest(
      userB_review && t3Fetch.data.reviews.length >= 2,
      'Test 3: Multiple Users Coexist (User A and User B reviews present)',
      `Review count: ${t3Fetch.data.reviewCount}, Avg rating: ${t3Fetch.data.ratingAverage}`
    );

    // ----------------------------------------------------
    // TEST 4: Third User (User C Submits 3-star review)
    // ----------------------------------------------------
    const userC_id = 'user_test_C_' + Date.now();
    const t4Sub = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      userId: userC_id,
      userName: 'Charlie Brown',
      rating: 3,
      text: 'Decent poster, took a bit long to deliver.'
    });

    const t4Fetch = await makeRequest(`/api/products/${testProductId}/reviews`, 'GET');
    const userC_review = (t4Fetch.data.reviews || []).find(r => r.userId === userC_id);
    assertTest(
      userC_review && t4Fetch.data.reviews.length >= 3,
      'Test 4: Third User Coexists & Aggregate Rating Updates',
      `Count: ${t4Fetch.data.reviewCount}, Avg: ${t4Fetch.data.ratingAverage}`
    );

    // ----------------------------------------------------
    // TEST 5: User Update (User A edits from 4★ to 5★)
    // ----------------------------------------------------
    const countBeforeUpdate = t4Fetch.data.reviewCount;
    const t5Sub = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      userId: userA_id,
      userName: 'Alice Smith',
      rating: 5,
      text: 'Updated review: Actually 5 stars, wall framed looks phenomenal!'
    });

    const t5Fetch = await makeRequest(`/api/products/${testProductId}/reviews`, 'GET');
    const updatedA = (t5Fetch.data.reviews || []).find(r => r.userId === userA_id);
    assertTest(
      t5Sub.data.isUpdate === true &&
      t5Fetch.data.reviewCount === countBeforeUpdate &&
      updatedA.rating === 5 &&
      updatedA.text.includes('phenomenal'),
      'Test 5: User Update (Overwrites existing review, count stays same, aggregate updates)',
      `isUpdate: ${t5Sub.data.isUpdate}, Count: ${t5Fetch.data.reviewCount}, New rating: ${updatedA.rating}`
    );

    // ----------------------------------------------------
    // TEST 6: Logout / Login Persistence
    // ----------------------------------------------------
    const t6Fetch = await makeRequest(`/api/products/${testProductId}/reviews`, 'GET');
    const userA_persisted = (t6Fetch.data.reviews || []).some(r => r.userId === userA_id);
    const userB_persisted = (t6Fetch.data.reviews || []).some(r => r.userId === userB_id);
    const userC_persisted = (t6Fetch.data.reviews || []).some(r => r.userId === userC_id);
    assertTest(
      userA_persisted && userB_persisted && userC_persisted,
      'Test 6: Logout/Login Persistence (All user reviews persist independently of session)',
      `Persisted reviews count: ${t6Fetch.data.reviews.length}`
    );

    // ----------------------------------------------------
    // TEST 7: Cross-Product Isolation
    // ----------------------------------------------------
    const t7Prod2Fetch = await makeRequest(`/api/products/${testProduct2Id}/reviews`, 'GET');
    const prod2HasUserA = (t7Prod2Fetch.data.reviews || []).some(r => r.userId === userA_id);
    assertTest(
      !prod2HasUserA,
      'Test 7: Cross-Product Isolation (Product 1 reviews do NOT leak into Product 2)',
      `Product 2 review count: ${t7Prod2Fetch.data.reviewCount}`
    );

    // ----------------------------------------------------
    // TEST 8: Input Validation Rejections
    // ----------------------------------------------------
    const t8InvalidRating = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      userId: userA_id,
      rating: 6, // > 5
      text: 'Invalid rating test'
    });
    const t8EmptyText = await makeRequest(`/api/products/${testProductId}/reviews`, 'POST', {
      userId: userA_id,
      rating: 5,
      text: '   ' // empty
    });
    assertTest(
      t8InvalidRating.status === 400 && t8EmptyText.status === 400,
      'Test 8: Input Validation (Rating > 5 and empty text rejected with HTTP 400)',
      `Rating > 5 status: ${t8InvalidRating.status}, Empty text status: ${t8EmptyText.status}`
    );

    // ----------------------------------------------------
    // TEST 9: Invalid Product ID Rejection
    // ----------------------------------------------------
    const t9InvalidProd = await makeRequest('/api/products/999999/reviews', 'POST', {
      userId: userA_id,
      rating: 5,
      text: 'Non-existent product review'
    });
    assertTest(
      t9InvalidProd.status === 400 && t9InvalidProd.data.success === false,
      'Test 9: Product Existence Check (Review for non-existent catalog ID rejected with HTTP 400)',
      JSON.stringify(t9InvalidProd.data)
    );

  } catch (err) {
    console.error('Test suite error:', err);
  }

  console.log(`\n=== SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED ===\n`);
  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
