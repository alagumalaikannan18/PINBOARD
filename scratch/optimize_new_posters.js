const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const newPostersDir = path.join(__dirname, '..', 'new_posters');
const optDir = path.join(__dirname, '..', 'poster', 'opt');

const items = [
  { file: '1557587.png', base: '1557587' },
  { file: '1557713.png', base: '1557713' },
  { file: '1557718.png', base: '1557718' },
  { file: '1557733.png', base: '1557733' },
  { file: '1557749.png', base: '1557749' },
  { file: '1557750.png', base: '1557750' },
  { file: '1557751.png', base: 'stay-hard' },
  { file: '1557751.png', base: '1557751' }
];

async function processImages() {
  for (const item of items) {
    const srcPath = path.join(newPostersDir, item.file);
    const destMain = path.join(optDir, `${item.base}.webp`);
    const destThumb = path.join(optDir, `${item.base}-thumb.webp`);

    console.log(`Processing ${item.file} -> ${item.base}.webp & -thumb.webp ...`);
    
    // Read source buffer first to avoid file lock issues on Windows
    const srcBuffer = fs.readFileSync(srcPath);

    await sharp(srcBuffer)
      .webp({ quality: 90 })
      .toFile(destMain);

    await sharp(srcBuffer)
      .resize({ width: 600 })
      .webp({ quality: 85 })
      .toFile(destThumb);

    console.log(`✔ Created ${item.base}.webp and ${item.base}-thumb.webp`);
  }
}

processImages().catch(err => {
  console.error('Error processing images:', err);
  process.exit(1);
});
