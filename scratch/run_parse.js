
const fs = require('fs');
const path = require('path');
const content = fs.readFileSync('d:/PINBOARD-GIT/scripts/buildCatalogData.js', 'utf8');
const fn = new Function('require', '__dirname', 'module', 'exports', content + '; return posterCatalog;');
const catalog = fn(require, 'd:/PINBOARD-GIT/scripts', { exports: {} }, {});
fs.writeFileSync('d:/PINBOARD-GIT/scratch/parsed_build_catalog.json', JSON.stringify(catalog, null, 2));
console.log(`Parsed ${catalog.length} curated poster entries from buildCatalogData.js`);
