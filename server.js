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

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: getIsConnected() ? 'connected' : 'in-memory-fallback',
    service: 'PINBOARD E-Commerce API'
  });
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
  res.redirect(301, '/motivation.html');
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
async function startServer() {
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

  app.listen(PORT, () => {
    console.log(`PINBOARD Server running at http://localhost:${PORT}/`);
    console.log(`API endpoints active at http://localhost:${PORT}/api/`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
