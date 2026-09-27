/**
 * PINBOARD — Production-Ready HTTP Load Balancer & Cluster Manager
 * 
 * Features:
 * - Round-robin API traffic distribution across worker backend processes
 * - Active periodic health checking (/api/health) with automatic failure isolation
 * - Automatic worker recovery & auto-restart on worker crash
 * - Reverse proxy header preservation (X-Forwarded-For, X-Forwarded-Proto, X-Real-IP)
 * - Connection keep-alive, request timeouts, and stateless backend routing
 * - Clean graceful shutdown handling (zero leak of sockets or handles)
 */

const http = require('http');
const { fork } = require('child_process');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.env.PORT || '3000', 10);
const WORKER_COUNT = parseInt(process.env.WORKER_COUNT || '3', 10);
const BASE_WORKER_PORT = parseInt(process.env.BASE_WORKER_PORT || '3001', 10);
const HEALTH_CHECK_INTERVAL_MS = 2000;
const HEALTH_CHECK_TIMEOUT_MS = 1500;
const PROXY_REQUEST_TIMEOUT_MS = 10000;

class LoadBalancer {
  constructor(options = {}) {
    this.port = options.port || PORT;
    this.workerCount = options.workerCount || WORKER_COUNT;
    this.baseWorkerPort = options.baseWorkerPort || BASE_WORKER_PORT;

    this.workers = []; // Array of worker objects
    this.rrIndex = 0;   // Round-Robin index
    this.server = null;
    this.healthCheckTimer = null;
    this.isShuttingDown = false;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      activeRequests: 0,
      startTime: Date.now()
    };
  }

  startWorker(workerIndex, port) {
    const serverPath = path.resolve(__dirname, 'server.js');
    const childEnv = { ...process.env, PORT: port.toString(), IS_WORKER: 'true' };

    const child = fork(serverPath, [], {
      env: childEnv,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    });

    const workerObj = {
      id: workerIndex + 1,
      port: port,
      pid: child.pid,
      child: child,
      isHealthy: false, // Initially false until first health check passes
      lastCheck: null,
      consecutiveFailures: 0,
      activeRequests: 0,
      totalRequests: 0,
      errors: 0
    };

    child.on('exit', (code, signal) => {
      console.warn(`⚠️ Worker #${workerObj.id} (PID ${child.pid}) on port ${port} exited (code: ${code}, signal: ${signal}).`);
      workerObj.isHealthy = false;

      if (!this.isShuttingDown) {
        console.log(`🔄 Auto-restarting replacement for Worker #${workerObj.id}...`);
        setTimeout(() => {
          this.replaceWorker(workerIndex, port);
        }, 1000);
      }
    });

    this.workers[workerIndex] = workerObj;
    console.log(`🚀 Spawned Worker #${workerObj.id} (PID ${child.pid}) on port ${port}`);
    return workerObj;
  }

  replaceWorker(workerIndex, port) {
    this.startWorker(workerIndex, port);
    // Perform immediate health check
    setTimeout(() => {
      this.checkWorkerHealth(this.workers[workerIndex]);
    }, 500);
  }

  async checkWorkerHealth(worker) {
    if (!worker || !worker.child || worker.child.killed) {
      if (worker) worker.isHealthy = false;
      return;
    }

    return new Promise((resolve) => {
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port: worker.port,
          path: '/api/health',
          timeout: HEALTH_CHECK_TIMEOUT_MS
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            const wasHealthy = worker.isHealthy;
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(body);
                worker.isHealthy = data.status === 'HEALTHY' || data.status === 'ok';
              } catch (e) {
                worker.isHealthy = true;
              }
              worker.consecutiveFailures = 0;
            } else {
              worker.consecutiveFailures++;
              if (worker.consecutiveFailures >= 2) worker.isHealthy = false;
            }

            if (!wasHealthy && worker.isHealthy) {
              console.log(`✅ Worker #${worker.id} (PID ${worker.pid}) RECOVERED and is now HEALTHY for traffic.`);
            } else if (wasHealthy && !worker.isHealthy) {
              console.warn(`❌ Worker #${worker.id} (PID ${worker.pid}) failed health check (HTTP ${res.statusCode}). Isolated from traffic.`);
            }

            worker.lastCheck = Date.now();
            resolve();
          });
        }
      );

      req.on('error', (err) => {
        const wasHealthy = worker.isHealthy;
        worker.consecutiveFailures++;
        worker.isHealthy = false;
        worker.lastCheck = Date.now();

        if (wasHealthy) {
          console.warn(`❌ Worker #${worker.id} (PID ${worker.pid}) health check error (${err.message}). Isolated from traffic.`);
        }
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        worker.consecutiveFailures++;
        worker.isHealthy = false;
        resolve();
      });
    });
  }

  startHealthCheckLoop() {
    this.healthCheckTimer = setInterval(async () => {
      if (this.isShuttingDown) return;
      await Promise.all(this.workers.map((w) => this.checkWorkerHealth(w)));
    }, HEALTH_CHECK_INTERVAL_MS);

    // Perform initial health checks
    setTimeout(() => {
      this.workers.forEach((w) => this.checkWorkerHealth(w));
    }, 800);
  }

  getNextHealthyWorker() {
    const healthyWorkers = this.workers.filter((w) => w && w.isHealthy);
    if (healthyWorkers.length === 0) return null;

    const selected = healthyWorkers[this.rrIndex % healthyWorkers.length];
    this.rrIndex = (this.rrIndex + 1) % healthyWorkers.length;
    return selected;
  }

  proxyRequest(req, res) {
    this.metrics.totalRequests++;
    this.metrics.activeRequests++;

    const worker = this.getNextHealthyWorker();
    if (!worker) {
      this.metrics.failedRequests++;
      this.metrics.activeRequests--;
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Service Unavailable — No healthy backend instances active.',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    worker.activeRequests++;
    worker.totalRequests++;

    const clientIp = req.socket.remoteAddress || '127.0.0.1';
    const forwardedFor = req.headers['x-forwarded-for']
      ? `${req.headers['x-forwarded-for']}, ${clientIp}`
      : clientIp;

    const proxyHeaders = {
      ...req.headers,
      'x-forwarded-for': forwardedFor,
      'x-forwarded-proto': req.socket.encrypted ? 'https' : 'http',
      'x-real-ip': clientIp,
      'x-lb-instance': `worker-${worker.id}-pid-${worker.pid}`,
      host: `127.0.0.1:${worker.port}`
    };

    const options = {
      hostname: '127.0.0.1',
      port: worker.port,
      path: req.url,
      method: req.method,
      headers: proxyHeaders,
      timeout: PROXY_REQUEST_TIMEOUT_MS
    };

    const proxyReq = http.request(options, (proxyRes) => {
      const outHeaders = {
        ...proxyRes.headers,
        'x-lb-instance': `worker-${worker.id}-pid-${worker.pid}`
      };
      res.writeHead(proxyRes.statusCode, outHeaders);
      proxyRes.pipe(res);

      proxyRes.on('end', () => {
        worker.activeRequests = Math.max(0, worker.activeRequests - 1);
        this.metrics.activeRequests = Math.max(0, this.metrics.activeRequests - 1);
        if (proxyRes.statusCode < 500) {
          this.metrics.successfulRequests++;
        } else {
          this.metrics.failedRequests++;
          worker.errors++;
        }
      });
    });

    proxyReq.on('error', (err) => {
      worker.activeRequests = Math.max(0, worker.activeRequests - 1);
      this.metrics.activeRequests = Math.max(0, this.metrics.activeRequests - 1);
      this.metrics.failedRequests++;
      worker.errors++;

      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Bad Gateway — Proxy error reaching backend worker.',
          error: err.message
        }));
      }
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
    });

    req.pipe(proxyReq);
  }

  async start() {
    console.log(`\n======================================================`);
    console.log(`PINBOARD LOAD BALANCER STARTING ON PORT ${this.port}`);
    console.log(`Worker Pool Size: ${this.workerCount} instances`);
    console.log(`======================================================\n`);

    // 1. Boot Worker Pool
    for (let i = 0; i < this.workerCount; i++) {
      const workerPort = this.baseWorkerPort + i;
      this.startWorker(i, workerPort);
    }

    // 2. Start Health Check Polling
    this.startHealthCheckLoop();

    // 3. Start Load Balancer Proxy Server
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.proxyRequest(req, res);
      });

      this.server.listen(this.port, () => {
        console.log(`✅ PINBOARD Load Balancer active at http://localhost:${this.port}/`);
        console.log(`   Distributing traffic to ${this.workerCount} backend worker instances.`);
        resolve(this.server);
      });

      this.server.on('error', (err) => {
        console.error(`❌ Load Balancer master error on port ${this.port}:`, err.message);
        reject(err);
      });
    });
  }

  async stop() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`\n🛑 Shutting down PINBOARD Load Balancer...`);

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Terminate all worker processes gracefully
    const killPromises = this.workers.map((worker) => {
      return new Promise((res) => {
        if (!worker || !worker.child || worker.child.killed) return res();
        
        worker.child.once('exit', () => res());
        try {
          worker.child.kill('SIGTERM');
        } catch (e) {
          res();
        }

        // Force kill after 2 seconds if still alive
        setTimeout(() => {
          try {
            if (worker.child && !worker.child.killed) worker.child.kill('SIGKILL');
          } catch (e) {}
          res();
        }, 2000).unref();
      });
    });

    await Promise.all(killPromises);

    // Close proxy server
    if (this.server) {
      await new Promise((res) => this.server.close(() => res()));
    }

    console.log(`✅ PINBOARD Load Balancer stopped cleanly.`);
  }

  getMetrics() {
    return {
      metrics: this.metrics,
      workers: this.workers.map((w) => ({
        id: w.id,
        port: w.port,
        pid: w.pid,
        isHealthy: w.isHealthy,
        activeRequests: w.activeRequests,
        totalRequests: w.totalRequests,
        errors: w.errors,
        lastCheck: w.lastCheck
      }))
    };
  }
}

if (require.main === module) {
  const lb = new LoadBalancer();
  lb.start();

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down load balancer...`);
    await lb.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = LoadBalancer;
