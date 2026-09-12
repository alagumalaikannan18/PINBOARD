require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { connectDB, getIsConnected } = require('../config/database');

function loadProductsFromFile() {
  const dataPath = path.resolve(__dirname, '../js/products-data.js');
  const content = fs.readFileSync(dataPath, 'utf8');
  const sandbox = {};
  const vm = require('vm');
  vm.runInNewContext(content, sandbox);
  return sandbox.PINBOARD_PRODUCTS || [];
}

async function seedDatabase(options = { verbose: true }) {
  const products = loadProductsFromFile();
  if (!products || products.length === 0) {
    if (options.verbose) console.warn('⚠️ No products found to seed.');
    return { count: 0 };
  }

  let seededCount = 0;
  for (const p of products) {
    const doc = {
      id: p.id,
      slug: p.slug || `poster-${p.id}`,
      title: p.title,
      subtitle: p.subtitle || `${p.category || 'Poster'} · Premium Poster`,
      category: p.category || 'Posters',
      collectionName: p.collection || p.category || 'Curated',
      artist: p.artist || 'Studio Pinboard',
      subject: p.subject || p.title,
      tags: Array.isArray(p.tags) ? p.tags : [],
      keywords: p.keywords || p.title,
      size: p.size || 'A3',
      badge: p.badge || null,
      images: (Array.isArray(p.images) && p.images.length > 0) ? p.images : ['New Project 22 [FA6B4A7].png'],
      regularPrice: p.regularPrice || 749,
      salePrice: p.salePrice || null,
      rating: p.rating || 4.8,
      reviewCount: p.reviewCount || 500,
      pieces: p.pieces || 1,
      material: p.material || '300 GSM Premium Matte Sheet',
      finish: p.finish || 'Smooth Matte Finish',
      frameIncluded: Boolean(p.frameIncluded),
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features : [],
      specifications: p.specifications || {},
      perfectFor: Array.isArray(p.perfectFor) ? p.perfectFor : [],
      relatedIds: Array.isArray(p.relatedIds) ? p.relatedIds : [],
      isActive: true
    };

    await Product.findOneAndUpdate(
      { id: p.id },
      { $set: doc },
      { upsert: true, new: true }
    );
    seededCount++;
  }

  if (options.verbose) {
    console.log(`✅ Successfully seeded/updated ${seededCount} products in MongoDB.`);
  }

  return { count: seededCount };
}

// Standalone execution
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      if (getIsConnected()) {
        await seedDatabase({ verbose: true });
      } else {
        console.warn('⚠️ Could not connect to MongoDB for seeding.');
      }
      process.exit(0);
    } catch (e) {
      console.error('❌ Error during seeding:', e);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedDatabase,
  loadProductsFromFile
};
