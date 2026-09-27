const http = require('http');

http.get('http://localhost:3000/api/products', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    console.log('API Success:', json.success);
    console.log('API Count:', json.count);

    const ids = new Set();
    const imgs = new Set();
    let dupCount = 0;

    function normImg(src) {
      if (!src) return '';
      return String(src).split('?')[0].split('#')[0].replace(/^.*[\\\/]/, '').replace(/\.(png|jpe?g|webp|avif|gif|svg)$/i, '').replace(/\.jpg\.jpeg$/i, '').replace(/-thumb$/i, '').replace(/_p\d+$/i, '').replace(/_\d+$/i, '').replace(/\s*\(\d+\)$/i, '').toLowerCase().trim();
    }

    json.data.forEach(p => {
      if (ids.has(p.id)) {
        console.error('Duplicate ID in API:', p.id);
        dupCount++;
      }
      ids.add(p.id);

      const base = normImg(p.images ? p.images[0] : '');
      if (imgs.has(base)) {
        console.error('Duplicate image in API:', base, p.id, p.title);
        dupCount++;
      }
      imgs.add(base);
    });

    if (dupCount === 0) {
      console.log('✅ ZERO DUPLICATES FOUND IN API RESPONSE!');
    }
  });
});
