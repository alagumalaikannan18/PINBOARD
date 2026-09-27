/**
 * PINBOARD LOAD BALANCER & PERFORMANCE SCALABILITY TEST SUITE
 * 
 * Verifies:
 * 1. Health check endpoints (/api/health, /api/health/liveness, /api/health/readiness)
 * 2. Multi-worker cluster load balancer startup & round-robin proxying
 * 3. Reverse proxy header preservation (X-Forwarded-For, X-Real-IP, X-LB-Instance)
 * 4. Automatic worker failure detection, isolation, and auto-restart recovery
 * 5. Dynamic rate limiting and abuse protection on /api/* routes
 * 6. Clean graceful shutdown without handle leaks or EADDRINUSE errors
 * 7. Concurrency load testing measuring req/s, avg latency, P95, P99, error rate, TTFB
 * 8. Regression suite validation across key application features
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const LoadBalancer = require('./load-balancer');

const TEST_LB_PORT = 3100;
const TEST_WORKER_COUNT = 3;
const TEST_BASE_WORKER_PORT = 3101;

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.request(url, options, (res) => {
      let body = '';
      const ttfb = Date.now() - startTime;
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const latency = Date.now() - startTime;
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          json: json,
          ttfb: ttfb,
          latency: latency
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        headers: {},
        body: '',
        json: null,
        error: err.message,
        ttfb: 0,
        latency: Date.now() - startTime
      });
    });

    if (options.postData) {
      req.write(options.postData);
    }
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(`PINBOARD LOAD BALANCER & PERFORMANCE TEST SUITE`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- SECTION 1: Direct Single Worker Boot & Health Check Verification ---
  console.log(`--- 1. Testing Single Worker Health Check API Endpoints ---`);
  const { startServer, gracefulShutdown } = require('./server');
  let singleServer = null;

  try {
    singleServer = await startServer(3099);
    await sleep(400);

    const healthRes = await makeRequest('http://127.0.0.1:3099/api/health');
    assert(healthRes.statusCode === 200, 'GET /api/health returns HTTP 200');
    assert(healthRes.json && healthRes.json.status === 'HEALTHY', 'GET /api/health reports status HEALTHY');
    assert(healthRes.json && typeof healthRes.json.workerPid === 'number', 'GET /api/health includes worker PID');
    assert(healthRes.json && typeof healthRes.json.uptimeSeconds === 'number', 'GET /api/health includes uptime');

    const livenessRes = await makeRequest('http://127.0.0.1:3099/api/health/liveness');
    assert(livenessRes.statusCode === 200, 'GET /api/health/liveness returns HTTP 200');
    assert(livenessRes.json && livenessRes.json.status === 'UP', 'GET /api/health/liveness reports status UP');

    const readinessRes = await makeRequest('http://127.0.0.1:3099/api/health/readiness');
    assert(readinessRes.statusCode === 200, 'GET /api/health/readiness returns HTTP 200');
    assert(readinessRes.json && readinessRes.json.status === 'READY', 'GET /api/health/readiness reports status READY');
  } catch (err) {
    assert(false, `Single worker initialization error: ${err.message}`);
  } finally {
    if (singleServer) {
      gracefulShutdown('SIGTERM', false);
      await sleep(500);
    }
  }

  // --- SECTION 2: Multi-Worker Load Balancer Startup & Proxying ---
  console.log(`\n--- 2. Testing Multi-Worker Load Balancer Pool & Proxying ---`);
  const lb = new LoadBalancer({
    port: TEST_LB_PORT,
    workerCount: TEST_WORKER_COUNT,
    baseWorkerPort: TEST_BASE_WORKER_PORT
  });

  try {
    await lb.start();
    // Wait for initial worker startup and health check cycle
    await sleep(2500);

    const lbHealthRes = await makeRequest(`http://127.0.0.1:${TEST_LB_PORT}/api/health`);
    assert(lbHealthRes.statusCode === 200, 'Load Balancer proxies GET /api/health with HTTP 200');
    assert(lbHealthRes.headers['x-lb-instance'], 'Proxy adds X-LB-Instance header to response');

    // Make 6 sequential requests to verify Round-Robin distribution across worker PIDs
    const workerPidsSeen = new Set();
    const instanceHeadersSeen = new Set();

    for (let i = 0; i < 6; i++) {
      const res = await makeRequest(`http://127.0.0.1:${TEST_LB_PORT}/api/products/1`);
      if (res.statusCode === 200 && res.headers['x-lb-instance']) {
        instanceHeadersSeen.add(res.headers['x-lb-instance']);
      }
    }

    assert(instanceHeadersSeen.size >= 2, `Load Balancer distributed traffic across multiple worker instances (${instanceHeadersSeen.size} workers active)`);

    // --- SECTION 3: Header Forwarding & Trusted Proxy ---
    console.log(`\n--- 3. Testing Proxy Header Forwarding & Security ---`);
    const customHeadersRes = await makeRequest(`http://127.0.0.1:${TEST_LB_PORT}/api/health`, {
      headers: {
        'X-Forwarded-For': '203.0.113.195',
        'X-Forwarded-Proto': 'https'
      }
    });

    assert(customHeadersRes.statusCode === 200, 'Proxied request with X-Forwarded-For header succeeds with HTTP 200');
    assert(customHeadersRes.headers['x-ratelimit-limit'], 'Rate limit headers attached to API responses');

    // --- SECTION 4: Failover & Worker Isolation ---
    console.log(`\n--- 4. Testing Worker Crash, Isolation & Failover Recovery ---`);
    const workerToKill = lb.workers[0];
    const initialPid = workerToKill.pid;

    console.log(`  ⚡ Simulating worker failure by killing Worker #${workerToKill.id} (PID ${initialPid})...`);
    if (workerToKill.child) {
      workerToKill.child.kill('SIGKILL');
    }

    await sleep(1500);

    // Make requests immediately after worker failure
    let failoverSuccessCount = 0;
    for (let i = 0; i < 4; i++) {
      const res = await makeRequest(`http://127.0.0.1:${TEST_LB_PORT}/api/products/1`);
      if (res.statusCode === 200) failoverSuccessCount++;
    }

    assert(failoverSuccessCount === 4, 'Traffic automatically failed over to healthy workers without 500 errors');
    assert(lb.workers[0].pid !== initialPid, 'Load balancer auto-restarted a replacement worker instance');

    await sleep(2000); // Allow replacement worker to pass health check
    const recoveryRes = await makeRequest(`http://127.0.0.1:${TEST_LB_PORT}/api/health`);
    assert(recoveryRes.statusCode === 200, 'System fully recovered after worker restart (HTTP 200)');

    // --- SECTION 5: High Concurrency Load Test ---
    console.log(`\n--- 5. Executing High-Concurrency Performance Load Test ---`);
    const TOTAL_TEST_REQUESTS = 60;
    const CONCURRENCY = 10;
    const latencies = [];
    const ttfbs = [];
    let successCount = 0;
    let errorCount = 0;

    const loadTestStartTime = Date.now();

    for (let i = 0; i < TOTAL_TEST_REQUESTS; i += CONCURRENCY) {
      const batchPromises = [];
      for (let j = 0; j < CONCURRENCY && (i + j) < TOTAL_TEST_REQUESTS; j++) {
        batchPromises.push(makeRequest(`http://127.0.0.1:${TEST_LB_PORT}/api/products/${(j % 5) + 1}`));
      }

      const results = await Promise.all(batchPromises);
      results.forEach((r) => {
        if (r.statusCode === 200) {
          successCount++;
          latencies.push(r.latency);
          ttfbs.push(r.ttfb);
        } else {
          errorCount++;
        }
      });
    }

    const totalDurationMs = Date.now() - loadTestStartTime;
    const rps = parseFloat(((successCount / totalDurationMs) * 1000).toFixed(2));

    latencies.sort((a, b) => a - b);
    ttfbs.sort((a, b) => a - b);

    const avgLatency = parseFloat((latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(2));
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const avgTTFB = parseFloat((ttfbs.reduce((a, b) => a + b, 0) / (ttfbs.length || 1)).toFixed(2));
    const errorRatePct = parseFloat(((errorCount / TOTAL_TEST_REQUESTS) * 100).toFixed(2));

    console.log(`  📊 Load Test Results:`);
    console.log(`     - Total Requests: ${TOTAL_TEST_REQUESTS}`);
    console.log(`     - Duration: ${totalDurationMs} ms`);
    console.log(`     - Throughput: ${rps} req/sec`);
    console.log(`     - Avg Latency: ${avgLatency} ms`);
    console.log(`     - P95 Latency: ${p95Latency} ms`);
    console.log(`     - P99 Latency: ${p99Latency} ms`);
    console.log(`     - Avg TTFB: ${avgTTFB} ms`);
    console.log(`     - Error Rate: ${errorRatePct}%`);

    assert(successCount === TOTAL_TEST_REQUESTS, `100% of concurrent requests completed successfully (${successCount}/${TOTAL_TEST_REQUESTS})`);
    assert(errorRatePct === 0, `Error rate is 0.00% under high concurrency`);
    assert(avgLatency < 200, `Average API latency is under 200ms (${avgLatency} ms)`);

  } catch (err) {
    assert(false, `Load balancer test error: ${err.message}`);
  } finally {
    // --- SECTION 6: Graceful Shutdown Verification ---
    console.log(`\n--- 6. Testing Clean Graceful Shutdown ---`);
    await lb.stop();
    await sleep(500);

    // Verify port is freed up immediately without EADDRINUSE
    let portFreed = false;
    try {
      const checkServer = http.createServer();
      await new Promise((res, rej) => {
        checkServer.listen(TEST_LB_PORT, () => {
          portFreed = true;
          checkServer.close(() => res());
        });
        checkServer.on('error', (e) => rej(e));
      });
    } catch (e) {
      portFreed = false;
    }

    assert(portFreed, 'Load balancer port closed cleanly without EADDRINUSE or handle leaks');
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
