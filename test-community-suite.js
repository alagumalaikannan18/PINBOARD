const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('PINBOARD CUSTOMER WALL GALLERY, LIGHTBOX & 3D BUTTONS QA SUITE');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${e.message}`);
  }
}

// 1. Verify Image Assets
const expectedImages = [
  'customer-wall-1.jpg',
  'customer-wall-2.jpg',
  'customer-wall-3.jpg',
  'customer-wall-4.jpg'
];

expectedImages.forEach(imgName => {
  test(`Image asset images/community/${imgName} exists and has content`, () => {
    const p = path.resolve(__dirname, 'images/community', imgName);
    assert(fs.existsSync(p), `Missing file ${imgName}`);
    const stat = fs.statSync(p);
    assert(stat.size > 10000, `File ${imgName} is too small (${stat.size} bytes)`);
  });
});

// 2. Verify HTML Placement, Typography and Controls
const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

test('index.html contains #community section with exact heading and labels', () => {
  assert(html.includes('id="community"'), 'Missing id="community"');
  assert(html.includes('PINBOARD COMMUNITY'), 'Missing PINBOARD COMMUNITY label');
  assert(html.includes('REAL WALLS. REAL STORIES.'), 'Missing heading REAL WALLS. REAL STORIES.');
  assert(html.includes('Your walls, your style. See how our community brings their spaces to life.'), 'Missing subtitle');
});

test('#community is placed immediately above footer#about', () => {
  const commIdx = html.indexOf('id="community"');
  const footerIdx = html.indexOf('<footer');
  assert(commIdx !== -1, '#community must exist');
  assert(footerIdx !== -1, 'footer must exist');
  assert(commIdx < footerIdx, '#community must be above footer');
});

test('index.html includes horizontal slider navigation arrows and dots', () => {
  assert(html.includes('id="comm-slider-prev"'), 'Missing prev button');
  assert(html.includes('id="comm-slider-next"'), 'Missing next button');
  assert(html.includes('id="comm-slider-dots"'), 'Missing dots container');
  assert(html.includes('id="community-slider"'), 'Missing community slider track');
});

test('All 4 customer photos are rendered in community gallery cards', () => {
  expectedImages.forEach(imgName => {
    assert(html.includes(`images/community/${imgName}`), `Missing img tag for ${imgName}`);
  });
});

test('Community cards have stylish minimal captions', () => {
  assert(html.includes('“Made it mine.”'), 'Missing caption "Made it mine."');
  assert(html.includes('“A little more personality on my wall.”'), 'Missing caption "A little more personality on my wall."');
  assert(html.includes('“Curated space that feels like home.”'), 'Missing caption 3');
  assert(html.includes('“Every poster tells a story.”'), 'Missing caption 4');
});

test('index.html includes Customer Photo Lightbox Modal markup with full controls', () => {
  assert(html.includes('id="comm-lightbox"'), 'Missing #comm-lightbox modal');
  assert(html.includes('id="comm-lightbox-overlay"'), 'Missing #comm-lightbox-overlay');
  assert(html.includes('id="comm-lightbox-close"'), 'Missing #comm-lightbox-close');
  assert(html.includes('id="comm-lightbox-prev"'), 'Missing #comm-lightbox-prev');
  assert(html.includes('id="comm-lightbox-next"'), 'Missing #comm-lightbox-next');
  assert(html.includes('id="comm-lightbox-img"'), 'Missing #comm-lightbox-img');
  assert(html.includes('id="comm-lightbox-caption"'), 'Missing #comm-lightbox-caption');
});

test('index.html contains 3D buttons for Create Your Wall and Shop All Posters', () => {
  assert(html.includes('id="btn-create-wall-3d"'), 'Missing 3D Create Your Wall button');
  assert(html.includes('href="custom-posters.html"'), 'Create Your Wall must link to custom-posters.html');
  assert(html.includes('id="btn-shop-posters-3d"'), 'Missing 3D Shop All Posters button');
  assert(html.includes('href="shop.html"'), 'Shop All Posters must link to shop.html');
});

test('index.html references js/community-slider.js with modal and 3D logic', () => {
  assert(html.includes('src="js/community-slider.js"'), 'Missing script tag for community-slider.js');
  const scriptContent = fs.readFileSync(path.resolve(__dirname, 'js/community-slider.js'), 'utf8');
  assert(scriptContent.includes('openLightbox'), 'Script must have openLightbox function');
  assert(scriptContent.includes('closeLightbox'), 'Script must have closeLightbox function');
  assert(scriptContent.includes('Escape'), 'Script must handle Escape key');
  assert(scriptContent.includes('mousemove'), 'Script must have 3D tilt interaction');
});

// 3. Verify CSS styling in style.css
const css = fs.readFileSync(path.resolve(__dirname, 'css/style.css'), 'utf8');

test('css/style.css defines compact slider, Lightbox modal, and 3D button styles', () => {
  assert(css.includes('.community-section'), 'Missing .community-section');
  assert(css.includes('.community-slider'), 'Missing .community-slider');
  assert(css.includes('.comm-lightbox'), 'Missing .comm-lightbox');
  assert(css.includes('.comm-lightbox.is-active'), 'Missing .comm-lightbox.is-active');
  assert(css.includes('body.lightbox-locked'), 'Missing body.lightbox-locked');
  assert(css.includes('.comm-btn-3d'), 'Missing .comm-btn-3d');
  assert(css.includes('.comm-btn-primary-3d'), 'Missing .comm-btn-primary-3d');
  assert(css.includes('.comm-btn-secondary-3d'), 'Missing .comm-btn-secondary-3d');
  assert(css.includes('prefers-reduced-motion'), 'Missing prefers-reduced-motion rules');
});

console.log(`\n================================================================`);
console.log(`RESULTS: ${passed}/${total} TESTS PASSED!`);
console.log(`================================================================\n`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
