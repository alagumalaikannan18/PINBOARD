const fs = require('fs');

const html = fs.readFileSync('scratch/gdrive_page.html', 'utf8');

const afDataMatches = [...html.matchAll(/AF_initDataCallback\s*\(\s*({[\s\S]*?})\s*\)\s*;/g)];

console.log('Found AF_initDataCallback blocks:', afDataMatches.length);

const items = [];

afDataMatches.forEach((m, idx) => {
  const block = m[1];
  // extract key, data
  const dataMatch = block.match(/data\s*:\s*([\s\S]*)}/);
  if (dataMatch) {
    try {
      // search for strings ending with .jpg, .jpeg, .png, .webp
      const filenames = [...block.matchAll(/"([^"]+\.(?:jpg|jpeg|png|webp|JPG|PNG))"/g)];
      if (filenames.length > 0) {
        console.log(`Block ${idx} has filenames:`, filenames.map(f => f[1]));
      }
    } catch(e){}
  }
});

// Also search for general file names and IDs in the raw HTML string
const rawFileMatches = [...html.matchAll(/\["([a-zA-Z0-9_-]{28,35})",\s*\[?"([^"]+\.(?:jpg|jpeg|png|webp|JPG|PNG))"/gi)];
console.log('Raw File + ID matches count:', rawFileMatches.length);
rawFileMatches.slice(0, 30).forEach(m => console.log('File:', m[2], '=> ID:', m[1]));

// Let's also regex search any filename with .jpg / .webp / .png in the file
const allFiles = [...new Set([...html.matchAll(/"([^"]+\.(?:jpg|jpeg|png|webp|JPG|PNG))"/gi)].map(m => m[1]))];
console.log('All image filenames in page:', allFiles);
