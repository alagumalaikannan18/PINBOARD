const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../js/products-data.js');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  content = content.replace(/"Size":\s*"A3[^"]*"/gi, '"Size": "A4 (210 × 297 mm)"');
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Cleaned all remaining A3 size entries in products-data.js');
}
