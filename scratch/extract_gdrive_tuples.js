const fs = require('fs');

const html = fs.readFileSync('scratch/gdrive_page.html', 'utf8');

// Google Drive embeds arrays like: ["<fileID>", "<filename>", ...] or in AF_initDataCallback
// Let's parse AF_initDataCallback block 4 or find all substrings matching file items

const filenames = [
  '1555891.png',
  '1562655.png',
  '1562656.png',
  '1562657.png',
  '1562658.png',
  '1562659.png',
  '1562660.png',
  '1562661.png',
  '1562662.png',
  '1562663.png',
  '1562664.png',
  '1562810.png',
  '1562818.png',
  '1562819.png',
  '1562820.png',
  '1562826.jpg',
  '1562840.png',
  '1562841.png',
  '1562842.png'
];

const fileMap = {};

filenames.forEach(fname => {
  // Find occurrence of fname in html and look for nearby ID string (28-35 alphanumeric chars)
  const idx = html.indexOf(fname);
  if (idx !== -1) {
    const chunk = html.substring(Math.max(0, idx - 400), Math.min(html.length, idx + 400));
    const idMatch = chunk.match(/"([a-zA-Z0-9_-]{28,35})"/g);
    if (idMatch) {
      // Pick IDs that are not folder ID 1zmrpH28QH0KQ5gtg7OwmmCT_eW94RW1D
      const validIds = idMatch.map(m => m.replace(/"/g, '')).filter(id => id !== '1zmrpH28QH0KQ5gtg7OwmmCT_eW94RW1D');
      fileMap[fname] = validIds;
    }
  }
});

console.log('File Map:', JSON.stringify(fileMap, null, 2));
