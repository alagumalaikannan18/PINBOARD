require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB, getIsConnected } = require('./config/database');
const { seedDatabase } = require('./scripts/seedProducts');

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

// --- Trust Proxy Setup for Load Balancers / Reverse Proxies ---
app.set('trust proxy', true);

// --- Lifecycle & Health State ---
let isServerReady = false;
let isServerLive = true;
let isShuttingDown = false;
const activeSockets = new Set();

// --- Rate Limiting Engine (API abuse protection) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 300;

setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((data, ip) => {
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  });
}, RATE_LIMIT_WINDOW_MS).unref();

function apiRateLimiter(req, res, next) {
  // Skip rate limiting for health check endpoints or non-API calls
  if (req.path.startsWith('/api/health')) return next();

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  let record = rateLimitMap.get(clientIp);

  if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record = { count: 1, startTime: now };
    rateLimitMap.set(clientIp, record);
  } else {
    record.count++;
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - record.count));

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfterSeconds: Math.ceil((record.startTime + RATE_LIMIT_WINDOW_MS - now) / 1000)
    });
  }

  next();
}

const zlib = require('zlib');

// --- Native Gzip Compression Middleware ---
function gzipCompressionMiddleware(req, res, next) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) return next();

  // Skip images, media, and binary formats
  if (/\.(webp|png|jpe?g|gif|ico|woff2?|ttf|eot)$/i.test(req.path)) {
    return next();
  }

  const origWrite = res.write;
  const origEnd = res.end;
  const gzip = zlib.createGzip({ level: 6 });

  res.setHeader('Content-Encoding', 'gzip');
  res.removeHeader('Content-Length');

  gzip.on('data', (chunk) => origWrite.call(res, chunk));
  gzip.on('end', () => origEnd.call(res));

  res.write = function (chunk, encoding) {
    return gzip.write(chunk, encoding);
  };
  res.end = function (chunk, encoding) {
    if (chunk) gzip.write(chunk, encoding);
    return gzip.end();
  };

  next();
}

// --- Middleware ---
app.use(gzipCompressionMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to /api routes
app.use('/api', apiRateLimiter);

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Community Newsletter Subscription Endpoint
app.post('/api/subscribe', (req, res) => {
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

// --- Enhanced Health Check Endpoints ---
// Full Health Check
app.get('/api/health', (req, res) => {
  const isHealthy = isServerLive && isServerReady && !isShuttingDown;
  const statusCode = isHealthy ? 200 : 530;

  res.status(statusCode).json({
    status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
    service: 'PINBOARD E-Commerce API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    workerPid: process.pid,
    port: PORT,
    database: getIsConnected() ? 'connected' : 'in-memory-fallback',
    ready: isServerReady,
    live: isServerLive,
    memoryUsage: {
      rssMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / (1024 * 1024))
    }
  });
});

// Liveness Probe ("Is process alive?")
app.get('/api/health/liveness', (req, res) => {
  if (isServerLive) {
    return res.status(200).json({ status: 'UP', pid: process.pid, timestamp: new Date().toISOString() });
  }
  return res.status(500).json({ status: 'DOWN', pid: process.pid });
});

// Readiness Probe ("Can this instance receive traffic?")
app.get('/api/health/readiness', (req, res) => {
  if (isServerReady && !isShuttingDown) {
    return res.status(200).json({
      status: 'READY',
      pid: process.pid,
      database: getIsConnected() ? 'connected' : 'in-memory-fallback'
    });
  }
  return res.status(503).json({ status: 'NOT_READY', pid: process.pid });
});

// --- Frontend Route Aliases (Preserve zero-404 navigation) ---
app.get(['/product', '/products', '/product/:id', '/products/:id'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'product.html'));
});

app.get(['/account', '/account.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'account.html'));
});

app.get(['/shop', '/shop.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'shop.html'));
});

app.get(['/cart', '/cart.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'cart.html'));
});

app.get(['/movies', '/movies.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'movies.html'));
});

app.get(['/cars', '/cars.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'cars.html'));
});

app.get(['/motivation', '/motivation.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'motivation.html'));
});

app.get(['/anime', '/anime.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'anime.html'));
});

app.get(['/gaming', '/gaming.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'gaming.html'));
});

app.get(['/sports', '/sports.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'sports.html'));
});

app.get(['/custom-posters', '/custom-posters.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'custom-posters.html'));
});

app.get(['/collections', '/frame', '/about'], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// --- Static Asset Serving with Performance Cache Headers ---
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html', 'htm'],
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (['.webp', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico', '.woff2', '.woff', '.ttf'].includes(ext)) {
        // High-cache for immutable binary media & fonts (7 days)
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      } else if (['.css', '.js'].includes(ext)) {
        // Revalidate styles and scripts so updates are seen immediately
        res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
      } else if (['.html', '.htm'].includes(ext)) {
        // Always revalidate HTML documents for immediate updates
        res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
      }
    }
  })
);

// --- Custom 404 Handler ---
app.use((req, res) => {
  // If requesting API endpoint
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.path}`
    });
  }

  // HTML 404 page
  const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>404 Not Found — PINBOARD</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#f5f4f0;color:#111;text-align:center;">
  <div style="padding:40px;max-width:500px;">
    <h1 style="font-size:48px;margin:0 0 16px 0;letter-spacing:1px;">404</h1>
    <p style="font-size:18px;color:#666;margin-bottom:24px;">The page you are looking for does not exist.</p>
    <a href="/index.html" style="display:inline-block;background:#111;color:#fff;padding:12px 28px;text-decoration:none;font-weight:600;font-size:14px;border-radius:2px;">Back to Home</a>
  </div>
</body>
</html>`;
  res.status(404).type('html').send(notFoundHtml);
});

// --- Server Boot & Database Initialization ---
let serverInstance = null;

async function startServer(portOverride) {
  const listenPort = portOverride || PORT;

  try {
    await connectDB();
    if (getIsConnected()) {
      try {
        await seedDatabase({ verbose: false });
      } catch (seedErr) {
        console.warn('⚠️ Auto-seed check notice:', seedErr.message);
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ MongoDB connection notice on startup:', dbErr.message);
  }

  return new Promise((resolve, reject) => {
    serverInstance = app.listen(listenPort, () => {
      isServerReady = true;
      console.log(`PINBOARD Server PID ${process.pid} running at http://localhost:${listenPort}/`);
      resolve(serverInstance);
    });

    serverInstance.on('error', (err) => {
      isServerReady = false;
      console.error(`❌ Server PID ${process.pid} error on port ${listenPort}:`, err.message);
      reject(err);
    });

    // Track active sockets for clean graceful shutdown
    serverInstance.on('connection', (socket) => {
      activeSockets.add(socket);
      socket.on('close', () => activeSockets.delete(socket));
    });
  });
}

function gracefulShutdown(signal, shouldExit = true) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  isServerReady = false;

  console.log(`\n🛑 PINBOARD Worker PID ${process.pid} received ${signal}. Starting graceful shutdown...`);

  if (!serverInstance) {
    if (shouldExit) process.exit(0);
    return;
  }

  // 1. Stop accepting new connections
  serverInstance.close(() => {
    console.log(`✅ PINBOARD Worker PID ${process.pid} HTTP server closed cleanly.`);

    // 2. Disconnect database cleanly if connected
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      mongoose.connection.close(false).then(() => {
        console.log(`✅ DB connection closed for Worker PID ${process.pid}.`);
        if (shouldExit) process.exit(0);
      }).catch(() => {
        if (shouldExit) process.exit(0);
      });
    } else {
      if (shouldExit) process.exit(0);
    }
  });

  // 3. Force close idle connections after timeout (3 seconds)
  setTimeout(() => {
    activeSockets.forEach((socket) => {
      try {
        socket.destroy();
      } catch (e) {}
    });
  }, 3000).unref();
}

if (require.main === module) {
  startServer();
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = {
  app,
  startServer,
  gracefulShutdown
};
