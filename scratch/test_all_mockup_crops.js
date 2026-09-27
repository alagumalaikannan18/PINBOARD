const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const vm = require('vm');

// Load products
const content = fs.readFileSync('js/products-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(content, sandbox);
const products = sandbox.PINBOARD_PRODUCTS;

// Gather all unique images referenced in products
const productImages = new Set();
products.forEach(p => {
  (p.images || []).forEach(img => productImages.add(img));
});

console.log(`Total unique product images referenced in PINBOARD_PRODUCTS: ${productImages.size}`);

// Create output preview directory
const PREVIEW_DIR = path.resolve(__dirname, 'crop_previews');
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

async function getCropBox(imgPath) {
  const absolutePath = path.resolve(__dirname, '..', imgPath);
  if (!fs.existsSync(absolutePath)) return null;

  const metadata = await sharp(absolutePath).metadata();
  const { width: w, height: h } = metadata;

  // Let's inspect borders using raw pixels
  const { data, info } = await sharp(absolutePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  function getPixel(x, y) {
    const idx = (y * info.width + x) * info.channels;
    return [data[idx], data[idx + 1], data[idx + 2]];
  }

  // Sample top-left, top-right, bottom-left, bottom-right corners
  const corners = [
    getPixel(10, 10),
    getPixel(w - 10, 10),
    getPixel(10, h - 10),
    getPixel(w - 10, h - 10)
  ];

  const avgR = corners.reduce((sum, c) => sum + c[0], 0) / 4;
  const avgG = corners.reduce((sum, c) => sum + c[1], 0) / 4;
  const avgB = corners.reduce((sum, c) => sum + c[2], 0) / 4;

  // Bottom center area (y = 90% h, x = 50% w)
  const bc = getPixel(Math.floor(w * 0.5), Math.floor(h * 0.9));

  // Warm beige wall detection
  const isWallBeige = (avgR > 130 && avgG > 130 && avgB > 110 && Math.abs(avgR - avgG) < 30);
  const isBottomWall = (bc[0] > 130 && bc[1] > 130 && bc[2] > 110);

  // Template A: 1200 x 1600 (e.g. New Project 22 [...])
  if (w === 1200 && h === 1600) {
    return {
      type: '1200x1600',
      isMockup: true,
      crop: { left: 255, top: 285, width: 690, height: 920 }
    };
  }

  // Template B: 1200 x 1697 (e.g. poster/opt/...)
  if (w === 1200 && h === 1697 && isWallBeige) {
    return {
      type: '1200x1697',
      isMockup: true,
      crop: { left: 255, top: 302, width: 690, height: 978 }
    };
  }

  // Template C: 800 x 1131 (scaled 2/3 of 1200x1697)
  if (w === 800 && h === 1131 && isWallBeige) {
    return {
      type: '800x1131',
      isMockup: true,
      crop: { left: 170, top: 201, width: 460, height: 652 }
    };
  }

  // Any other dimensions with warm beige wall & bottom wall
  if (isWallBeige && isBottomWall) {
    // Proportional crop relative to 1200x1600 or 1200x1697
    const left = Math.floor(w * (255 / 1200));
    const width = Math.floor(w * (690 / 1200));
    const top = Math.floor(h * (302 / 1697));
    const height = Math.floor(h * (978 / 1697));
    return {
      type: `${w}x${h}`,
      isMockup: true,
      crop: { left, top, width, height }
    };
  }

  return { type: `${w}x${h}`, isMockup: false, crop: null };
}

async function testAll() {
  const results = [];
  let mockupCount = 0;
  let cleanCount = 0;

  for (const imgPath of Array.from(productImages).sort()) {
    const info = await getCropBox(imgPath);
    if (!info) {
      results.push({ imgPath, status: 'MISSING' });
      continue;
    }

    if (info.isMockup) {
      mockupCount++;
      const absSrc = path.resolve(__dirname, '..', imgPath);
      const previewName = imgPath.replace(/[\/\\:]/g, '_') + '_preview.png';
      const previewPath = path.join(PREVIEW_DIR, previewName);

      await sharp(absSrc)
        .extract(info.crop)
        .toFile(previewPath);

      results.push({
        imgPath,
        status: 'MOCKUP',
        type: info.type,
        crop: info.crop,
        preview: previewPath
      });
    } else {
      cleanCount++;
      results.push({ imgPath, status: 'CLEAN', type: info.type });
    }
  }

  console.log(`Audit Results:`);
  console.log(`- Mockups detected: ${mockupCount}`);
  console.log(`- Clean images: ${cleanCount}`);

  fs.writeFileSync('scratch/crop_test_results.json', JSON.stringify(results, null, 2));
  console.log(`Saved crop test results to scratch/crop_test_results.json`);
}

testAll().catch(err => console.error(err));
