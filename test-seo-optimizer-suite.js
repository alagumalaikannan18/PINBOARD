const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PINBOARD KEYWORD OPTIMIZER & SEO SYSTEM TEST SUITE');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function assert(condition, description) {
  total++;
  if (condition) {
    console.log(`  ✔ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

try {
  // 1. Module Loading & Configuration
  const PinboardSEO = require('./js/seo-optimizer.js');
  assert(typeof PinboardSEO === 'object', 'js/seo-optimizer.js loaded cleanly as a module');
  assert(Array.isArray(PinboardSEO.SEO_KEYWORDS.primary), 'Primary keyword array configured');
  assert(Array.isArray(PinboardSEO.SEO_KEYWORDS.secondary), 'Secondary keyword array configured');
  assert(Array.isArray(PinboardSEO.SEO_KEYWORDS.longTail), 'Long-tail keyword array configured');
  assert(typeof PinboardSEO.SEO_KEYWORDS.intents.transactional !== 'undefined', 'Transactional intent group defined');
  assert(typeof PinboardSEO.SEO_KEYWORDS.categories.Movies !== 'undefined', 'Movies category keyword mapping defined');

  // 2. Keyword Normalization & Deduplication
  const norm = PinboardSEO.normalizeKeyword('  Aesthetic WALL Posters!  ');
  assert(norm === 'aesthetic wall posters', 'Keyword normalization strips spaces, punctuation, and converts to lowercase');

  const dedup = PinboardSEO.deduplicateKeywords(['wall poster', 'Wall Poster', 'WALL POSTER', 'movie poster']);
  assert(dedup.length === 2, 'Keyword deduplication handles case and whitespace variations');

  // 3. Product & Category Keyword Generation
  const productsData = require('./js/products-data.js');
  const sampleProduct = productsData.PINBOARD_PRODUCTS.find(p => p.id === 135) || productsData.PINBOARD_PRODUCTS[0];
  const prodKw = PinboardSEO.generateProductKeywords(sampleProduct);
  assert(prodKw.length >= 5, 'Dynamic product keywords generated for Product #' + sampleProduct.id);
  assert(prodKw.some(k => k.toLowerCase().includes('ronaldo') || k.toLowerCase().includes('poster')), 'Product keywords contain relevant title terms');

  const catKw = PinboardSEO.generateCategoryKeywords('Movies');
  assert(catKw.includes('movie posters'), 'Category keywords include primary category keyword');

  // 4. Page Metadata & JSON-LD Structured Data
  const homeSEO = PinboardSEO.getPageSEO('home');
  assert(homeSEO.title.includes('PINBOARD'), 'Home page SEO returns title');
  assert(Array.isArray(homeSEO.structuredData), 'Home page returns structured JSON-LD data');
  assert(homeSEO.structuredData.some(d => d['@type'] === 'Organization'), 'JSON-LD includes Organization schema');
  assert(homeSEO.structuredData.some(d => d['@type'] === 'WebSite'), 'JSON-LD includes WebSite schema');

  const prodSEO = PinboardSEO.getPageSEO('product', { product: sampleProduct });
  assert(prodSEO.title.includes(sampleProduct.title), 'Product page SEO title includes product name');
  assert(Array.isArray(prodSEO.structuredData), 'Product page returns structured JSON-LD data');
  assert(prodSEO.structuredData.some(d => d['@type'] === 'Product'), 'JSON-LD includes Product schema');
  assert(prodSEO.structuredData.some(d => d['@type'] === 'BreadcrumbList'), 'JSON-LD includes BreadcrumbList schema');

  // 5. Search Relevance & Alias Matching
  const relevance = PinboardSEO.calculateSearchRelevance('spiderman', sampleProduct);
  assert(typeof relevance === 'number', 'calculateSearchRelevance returns numeric score');

  const searchResults = productsData.PinboardSearch.search('spiderman');
  assert(searchResults.length >= 1, 'Enhanced search engine returns results for query alias "spiderman"');

  // 6. Sitemap & Robots.txt Verification
  assert(fs.existsSync('sitemap.xml'), 'sitemap.xml exists in project root');
  const sitemapContent = fs.readFileSync('sitemap.xml', 'utf8');
  assert(sitemapContent.includes('<loc>http://localhost:3000/</loc>'), 'sitemap.xml contains homepage URL');
  assert(!sitemapContent.includes('cart.html'), 'sitemap.xml excludes private cart page');

  assert(fs.existsSync('robots.txt'), 'robots.txt exists in project root');
  const robotsContent = fs.readFileSync('robots.txt', 'utf8');
  assert(robotsContent.includes('Sitemap: http://localhost:3000/sitemap.xml'), 'robots.txt points to sitemap.xml');
  assert(robotsContent.includes('Disallow: /cart.html'), 'robots.txt disallows private routes');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ Test execution error:', err.stack || err.message);
  process.exitCode = 1;
}
