const fs = require('fs');

const code = fs.readFileSync('js/products-data.js', 'utf8');

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id": 151') || lines[i].includes('151')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
