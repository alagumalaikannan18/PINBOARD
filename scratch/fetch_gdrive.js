const https = require('https');
const fs = require('fs');

const url = 'https://drive.google.com/drive/folders/1zmrpH28QH0KQ5gtg7OwmmCT_eW94RW1D';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('scratch/gdrive_page.html', data);
    console.log('Saved gdrive_page.html, size:', data.length);

    // Look for initial data / file IDs
    const matches = [...data.matchAll(/\["([^"]+)",\["([^"]+)"/g)];
    console.log('Matches count:', matches.length);
    
    // Extract drive file items
    const driveItems = [];
    const idRegex = /"([a-zA-Z0-9_-]{28,35})"/g;
    let match;
    const foundIds = new Set();
    while ((match = idRegex.exec(data)) !== null) {
      if (match[1] !== '1zmrpH28QH0KQ5gtg7OwmmCT_eW94RW1D') {
        foundIds.add(match[1]);
      }
    }
    console.log('Unique ID count found:', foundIds.size);
    console.log('Sample IDs:', Array.from(foundIds).slice(0, 20));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
