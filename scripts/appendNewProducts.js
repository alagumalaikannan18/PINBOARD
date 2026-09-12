const fs = require('fs');
const path = require('path');
const { posterCatalog, generateSlug } = require('./buildCatalogData');

const ROOT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_DATA_PATH = path.join(ROOT_DIR, 'js', 'products-data.js');

// 1. Read existing products-data.js
const originalContent = fs.readFileSync(PRODUCTS_DATA_PATH, 'utf8');

// Use VM to load existing PINBOARD_PRODUCTS array to strictly preserve 1-20
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(originalContent, sandbox);
const existingProducts = sandbox.PINBOARD_PRODUCTS || [];

if (existingProducts.length < 20) {
  console.error('❌ Expected at least 20 existing products!');
  process.exit(1);
}

const preserved20 = existingProducts.slice(0, 20);
console.log(`Preserved ${preserved20.length} original products (IDs 1-20).`);

// 2. Generate new product objects starting at ID 21
let nextId = 21;
const newProducts = [];
const usedSlugs = new Set(preserved20.map(p => p.slug));

posterCatalog.forEach((item) => {
  const baseName = path.parse(item.file).name;
  let slug = generateSlug(item.title);
  if (usedSlugs.has(slug)) {
    slug = `${slug}-${nextId}`;
  }
  usedSlugs.add(slug);

  // Pick 3 related IDs from the same category or adjacent IDs
  const relatedIds = [
    nextId > 21 ? nextId - 1 : 12,
    nextId + 1 <= 151 ? nextId + 1 : 13,
    ((nextId + 7) % 130) + 21
  ];

  const prod = {
    id: nextId,
    slug: slug,
    title: item.title,
    subtitle: item.subtitle,
    category: item.category,
    collection: item.collection,
    artist: item.artist || 'Studio PINBOARD',
    subject: item.subject || item.title,
    tags: item.tags || [item.category.toLowerCase()],
    keywords: item.keywords || item.title.toLowerCase(),
    size: item.size || 'A3',
    badge: item.badge || null,
    images: [
      `poster/opt/${baseName}.webp`,
      `poster/Posters/${item.file}`
    ],
    regularPrice: item.regularPrice || 849,
    salePrice: item.salePrice || 649,
    rating: item.rating || 4.9,
    reviewCount: item.reviewCount || 420,
    pieces: 1,
    material: '300 GSM Museum-Grade Fine Art Sheet',
    finish: 'Smooth Matte Archival Finish',
    frameIncluded: false,
    description: `Museum-quality print of ${item.title}. Captured with ultra-crisp archival pigments on heavy 300 GSM smooth matte stock for deep contrast, non-reflective clarity, and timeless elegance.`,
    features: [
      'Archival-grade giclée print with deep blacks and rich tones',
      'Heavyweight 300 GSM premium matte art paper',
      'Anti-glare surface ideal for all indoor lighting conditions',
      'Packed flat in reinforced protective packaging with moisture barrier',
      'Ready to pin, magnetic-hang, or display in standard A3/A2 frames'
    ],
    specifications: {
      'Size': 'A3 (297 × 420 mm)',
      'Material': '300 GSM Museum-Grade Fine Art Sheet',
      'Finish': 'Smooth Matte Archival Finish',
      'Pieces': '1',
      'Frame': 'Not Included',
      'Packaging': 'Rigid tube, flat-packed'
    },
    perfectFor: item.category === 'Gaming' ? ['Gaming setups', 'Battle stations', 'Bedrooms', 'Studios']
      : item.category === 'Cars' ? ['Garages', 'Modern living rooms', 'Offices', 'Man caves']
      : item.category === 'Sports' ? ['Gym spaces', 'Bedrooms', 'Game rooms', 'Offices']
      : item.category === 'Motivation' ? ['Home gym', 'Workspaces', 'Study rooms', 'Offices']
      : ['Living rooms', 'Bedrooms', 'Home theater', 'Creative studios'],
    relatedIds: relatedIds
  };

  newProducts.push(prod);
  nextId++;
});

console.log(`Generated ${newProducts.length} new products (IDs 21 to ${nextId - 1}).`);
const totalProducts = [...preserved20, ...newProducts];
console.log(`Total catalogue size: ${totalProducts.length} products.`);

// 3. Create the new file content with preserved PinboardSearch & PinboardRouter
// We find where PINBOARD_PRODUCTS array is defined and replace it cleanly
const header = `// =============================================
// PINBOARD — Product Data & Search Engine
// Shared between homepage, product pages, and search
// =============================================

var PINBOARD_PRODUCTS = `;

// Find search engine index in original file
const searchEngineMarker = '// =============================================\n// PINBOARD SEARCH ENGINE';
const searchEngineIdx = originalContent.indexOf(searchEngineMarker);

if (searchEngineIdx === -1) {
  console.error('❌ Could not find PinboardSearch marker in products-data.js');
  process.exit(1);
}

const restOfFile = originalContent.slice(searchEngineIdx);

// Format total products JSON nicely
const formattedProducts = JSON.stringify(totalProducts, null, 2);
const updatedContent = `${header}${formattedProducts};\n\n${restOfFile}`;

// 4. Update getOptimizedImageUrl in restOfFile to handle poster/Posters and poster/opt
let finalContent = updatedContent;

const oldGetOpt = `  getOptimizedImageUrl: function (src, isThumb) {
    if (!src || typeof src !== 'string') return 'New Project 22 [FA6B4A7]-thumb.webp';
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    
    // Remove extension
    var base = src.replace(/\\.(png|jpe?g|webp|avif)$/i, '').replace(/\\.jpg\\.jpeg$/i, '');
    if (isThumb) {
      return base + '-thumb.webp';
    }
    return base + '.webp';
  },`;

const newGetOpt = `  getOptimizedImageUrl: function (src, isThumb) {
    if (!src || typeof src !== 'string') return 'New Project 22 [FA6B4A7]-thumb.webp';
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    
    // Normalize path to optimized WebP in poster/opt
    var cleanSrc = src;
    if (cleanSrc.startsWith('poster/Posters/')) {
      cleanSrc = cleanSrc.replace('poster/Posters/', 'poster/opt/');
    }
    // Remove extension
    var base = cleanSrc.replace(/\\.(png|jpe?g|webp|avif)$/i, '').replace(/\\.jpg\\.jpeg$/i, '');
    if (isThumb) {
      return base + '-thumb.webp';
    }
    return base + '.webp';
  },`;

if (finalContent.includes(oldGetOpt)) {
  finalContent = finalContent.replace(oldGetOpt, newGetOpt);
  console.log('✅ Updated getOptimizedImageUrl with poster/opt normalization.');
} else {
  console.warn('⚠️ oldGetOpt pattern not found verbatim, checking regex replace...');
  finalContent = finalContent.replace(
    /getOptimizedImageUrl:\s*function\s*\(src,\s*isThumb\)\s*\{[\s\S]*?return base \+ '\.webp';\s*\},/,
    newGetOpt
  );
}

fs.writeFileSync(PRODUCTS_DATA_PATH, finalContent, 'utf8');
console.log(`🎉 Successfully wrote ${totalProducts.length} products to ${PRODUCTS_DATA_PATH}!`);
