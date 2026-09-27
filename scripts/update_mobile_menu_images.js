const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'shop.html',
  'product.html',
  'custom-posters.html',
  'cart.html',
  'account.html',
  'movies.html',
  'sports.html',
  'motivation.html',
  'gaming.html',
  'cars.html',
  'anime.html'
];

let updatedCount = 0;

htmlFiles.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Home image replacement with soft warm cream background
  content = content.replace(
    /<img src="1789812334468\.png" onerror="this\.onerror=null;this\.src='poster\/opt\/1551192\.webp'"\s*alt="Home Showcase"\s*loading="lazy"\s*\/>/g,
    '<img src="images/mob-menu-home.png" onerror="this.onerror=null;this.src=\'1789812334468.png\'" alt="Home Showcase" loading="lazy" />'
  );

  // 2. Create Your Wall image replacement with 10-poster arrangement reference
  content = content.replace(
    /<img src="1553031\.webp" onerror="this\.onerror=null;this\.src='poster\/opt\/1553031\.webp'"\s*alt="Create Your Wall"\s*loading="lazy"\s*\/>/g,
    '<img src="images/mob-menu-create.png" onerror="this.onerror=null;this.src=\'1553031.webp\'" alt="Create Your Wall" loading="lazy" />'
  );

  // 3. View Cart image replacement with black shopping cart icon reference
  content = content.replace(
    /<img src="New Project 29 \[00F2D3A\]\.png" onerror="this\.onerror=null;this\.src='1551192-thumb\.webp'"\s*alt="View Cart"\s*loading="lazy"\s*\/>/g,
    '<img src="images/mob-menu-cart.png" onerror="this.onerror=null;this.src=\'New Project 29 [00F2D3A].png\'" alt="View Cart" loading="lazy" />'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated mobile menu images in ${file}`);
  }
});

console.log(`Successfully updated ${updatedCount} HTML files.`);
