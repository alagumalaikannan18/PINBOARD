const fs = require('fs');
const path = require('path');

const rootDir = 'd:/PINBOARD-GIT';
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('poster-config.js') && !content.includes('poster-catalog.js')) {
    content = content.replace(
      '<script src="js/poster-config.js"></script>',
      '<script src="js/poster-config.js"></script>\n  <script src="js/poster-catalog.js"></script>'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file} with poster-catalog.js script tag`);
  }
});
