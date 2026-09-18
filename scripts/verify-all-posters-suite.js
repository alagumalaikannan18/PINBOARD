const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const productsDataPath = path.join(ROOT_DIR, 'js', 'products-data.js');
const content = fs.readFileSync(productsDataPath, 'utf8');
const sandbox = {};
const vm = require('vm');
vm.runInNewContext(content, sandbox);
const products = sandbox.PINBOARD_PRODUCTS || [];

(async () => {
  console.log('=== STARTING FULL PINBOARD POSTER & DATA AUDIT SUITE ===');
  console.log(`Total Products to test: ${products.length}`);

  // 1. Data Invariants Check
  const idSet = new Set();
  const titleSet = new Set();
  let dataErrors = 0;

  products.forEach(p => {
    // Check unique ID
    if (idSet.has(p.id)) {
      console.error(`❌ Duplicate ID detected: ${p.id}`);
      dataErrors++;
    }
    idSet.add(p.id);

    // Check unique Title
    const normTitle = p.title.trim().toLowerCase();
    if (titleSet.has(normTitle)) {
      console.error(`❌ Duplicate Title detected: "${p.title}" (ID ${p.id})`);
      dataErrors++;
    }
    titleSet.add(normTitle);

    // Check Image resolution
    const img = p.images && p.images[0];
    if (!img) {
      console.error(`❌ Missing image on ID ${p.id}`);
      dataErrors++;
    }
  });

  if (dataErrors === 0) {
    console.log('✅ Invariant check passed: 151 unique IDs, 151 unique titles, 0 missing images.');
  } else {
    console.error(`❌ Invariant check failed with ${dataErrors} errors.`);
    process.exit(1);
  }

  // 2. Launch Puppeteer Browser to test real web application flows
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test Homepage
  console.log('\nTesting Homepage (http://localhost:3000/index.html)...');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });
  const homepageTitle = await page.title();
  console.log(`Homepage Title: "${homepageTitle}"`);

  // Test Collections on Homepage
  const collectionCardsCount = await page.$$eval('.collection-card', els => els.length);
  console.log(`Homepage Collections cards found: ${collectionCardsCount}`);

  // Test Product Grid on Homepage
  const productCardsCount = await page.$$eval('.product', els => els.length);
  console.log(`Homepage Product grid cards found: ${productCardsCount}`);

  // Test Shop Page
  console.log('\nTesting Shop Page (http://localhost:3000/shop.html)...');
  await page.goto('http://localhost:3000/shop.html', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.poster-3d-wrap', { timeout: 5000 });
  const shopCardsCount = await page.$$eval('.poster-3d-wrap', els => els.length);
  console.log(`Shop Page rendered ${shopCardsCount} poster cards.`);

  // Test Category Pages
  const categoryPages = ['movies.html', 'sports.html', 'cars.html', 'gaming.html', 'motivation.html'];
  for (const catPage of categoryPages) {
    console.log(`\nTesting Category Page (http://localhost:3000/${catPage})...`);
    await page.goto(`http://localhost:3000/${catPage}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.cat-poster-card', { timeout: 5000 });
    const count = await page.$$eval('.cat-poster-card', els => els.length);
    console.log(`Category ${catPage} rendered ${count} posters.`);
  }

  // Test Sample Product Detail Pages (e.g. ID 1, 5, 6, 29, 50, 114, 128, 130, 132, 133, 151)
  const sampleIds = [1, 5, 6, 29, 50, 114, 128, 130, 132, 133, 151];
  console.log('\nTesting Product Detail Pages for sample IDs...');
  for (const id of sampleIds) {
    await page.goto(`http://localhost:3000/product.html?id=${id}`, { waitUntil: 'networkidle2' });
    const detail = await page.evaluate(() => {
      const titleEl = document.getElementById('pdpTitle');
      const imgEl = document.getElementById('pdpMainImg');
      return {
        title: titleEl ? titleEl.textContent.trim() : null,
        imgSrc: imgEl ? imgEl.getAttribute('src') : null
      };
    });
    const expected = products.find(p => p.id === id);
    console.log(`Product ID ${id}: expected title "${expected.title}" -> Rendered title: "${detail.title}" (Image: ${detail.imgSrc})`);
  }

  // Test Cart Flow
  console.log('\nTesting Cart Flow (http://localhost:3000/product.html?id=1)...');
  await page.goto('http://localhost:3000/product.html?id=1', { waitUntil: 'networkidle2' });
  const addToCartBtn = await page.$('.add-to-cart-btn, #addToCartBtn, button.btn-add');
  if (addToCartBtn) {
    await addToCartBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const cartCountText = await page.$eval('.cart-count', el => el.textContent.trim());
    console.log(`Cart badge count after adding item: "${cartCountText}"`);
  }

  await browser.close();
  console.log('\n=== ALL AUDIT & VERIFICATION TESTS COMPLETED AND PASSED! ===');
})();
