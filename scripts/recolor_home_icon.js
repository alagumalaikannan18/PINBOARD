const sharp = require('sharp');
const path = require('path');

async function recolorHomeIcon() {
  const inputPath = path.resolve(__dirname, '../1789812334468.png');
  const outputPath = path.resolve(__dirname, '../images/mob-menu-home.png');

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;

  const outBuf = Buffer.alloc(w * h * 4); // RGBA output

  // Target background color: Soft warm cream/beige #ECE8E1 (RGB 236, 232, 225)
  const targetBg = [236, 232, 225];

  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];

    const brightness = (r + g + b) / 3;

    if (brightness < 60) {
      // Dark line art -> keep crisp dark house icon
      outBuf[i * 4] = r;
      outBuf[i * 4 + 1] = g;
      outBuf[i * 4 + 2] = b;
      outBuf[i * 4 + 3] = 255;
    } else {
      // Blend factor t (0 = line art, 1 = full background)
      const t = Math.min(1, Math.max(0, (brightness - 60) / 120));
      
      const newR = Math.round(r * (1 - t) + targetBg[0] * t);
      const newG = Math.round(g * (1 - t) + targetBg[1] * t);
      const newB = Math.round(b * (1 - t) + targetBg[2] * t);

      outBuf[i * 4] = newR;
      outBuf[i * 4 + 1] = newG;
      outBuf[i * 4 + 2] = newB;
      outBuf[i * 4 + 3] = 255;
    }
  }

  await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log('Successfully created images/mob-menu-home.png with soft warm cream background!');
}

recolorHomeIcon().catch(console.error);
