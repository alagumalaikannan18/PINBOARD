const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const fileMap = {
  "1555891.png": "1s7TKYhqYKH_FCFb1hMcFw931ItdHRfq5",
  "1562655.png": "1Al41IApqZuDDiAtVtnrj3kpuQhaG6KiX",
  "1562656.png": "1vUKvJ41I_l20V1R3EFQFWFvnZXLLHesN",
  "1562657.png": "1yUl3vC-yzWKMbvC0821QQmmqHg71ERao",
  "1562658.png": "1LLCqxKxzE3xS5KL7E5oKzU4OS0au4pSC",
  "1562659.png": "1UBG1My4zPbQPku5_bfCQSE1NlqNA3oXX",
  "1562660.png": "1WF7uHvMBsJtkaOVEQOpAypZT0ShvMmJn",
  "1562661.png": "1UltDKC8y7c90K_O0x1Xvjh2rV7Bcjdy6",
  "1562662.png": "1ER_wcPZY2hvDnmPKxpGihENcNA3vshcW",
  "1562663.png": "1oijIhrvfF2QKPHccufK4rb5h16c3h6zR",
  "1562664.png": "1fqLa_AwyepSuIMdBgwYXZ8st2TD0DaAB",
  "1562810.png": "1-sndhCgD8IQlRRW8inhrFlHGtLZMuYjl",
  "1562818.png": "1JP3k94wmw9MfaccWmIH0-59O9h4hF91i",
  "1562819.png": "1Pajyfrv9e4I90Plcf1ClIiuU3nq6eZ9b",
  "1562820.png": "1ucOPzyWVZOE1le1-EKTy1fJ9NkexO-BY",
  "1562826.jpg": "1o2w9vDBB9W0Pmnz5F5tD2Ogstd_G2Wri",
  "1562840.png": "1X-14YCx7cl-1mxDxdhmoIR8NZI0nFB72",
  "1562841.png": "12mv0DmzyEUB4PIwT2W1h08r0zeR9xM4y",
  "1562842.png": "1r7T4rgCLFmL5c_rvF_kJNtv_0wW-12dX"
};

const outputDir = path.join(__dirname, '../poster/drive');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      const client = targetUrl.startsWith('https') ? https : http;
      client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed with status code ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
      }).on('error', (err) => {
        reject(err);
      });
    };
    request(url);
  });
}

async function run() {
  console.log('Downloading Google Drive posters...');
  for (const [fname, id] of Object.entries(fileMap)) {
    const dest = path.join(outputDir, fname);
    // Googleusercontent direct image URL: https://lh3.googleusercontent.com/d/<FILE_ID>
    const directUrl = `https://lh3.googleusercontent.com/d/${id}`;
    try {
      await downloadFile(directUrl, dest);
      const stat = fs.statSync(dest);
      console.log(`✓ Downloaded ${fname} (${stat.size} bytes)`);
    } catch (e) {
      console.error(`✗ Failed ${fname}:`, e.message);
      // Fallback export URL
      try {
        const fallbackUrl = `https://drive.google.com/uc?export=download&id=${id}`;
        await downloadFile(fallbackUrl, dest);
        console.log(`✓ Downloaded ${fname} via fallback (${fs.statSync(dest).size} bytes)`);
      } catch (err) {
        console.error(`✗ Fallback failed ${fname}:`, err.message);
      }
    }
  }
}

run();
