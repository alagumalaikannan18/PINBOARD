const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('d:/PINBOARD-GIT/scripts/buildCatalogData.js', 'utf8');

// Parse posterCatalog array
let posterCatalog = [];
try {
  const fn = new Function(content + '; return posterCatalog;');
  posterCatalog = fn();
} catch (e) {
  console.error("Error parsing posterCatalog from buildCatalogData.js:", e.message);
}

console.log("Total curated poster entries in buildCatalogData.js:", posterCatalog.length);

const catCounts = {};
posterCatalog.forEach(p => {
  catCounts[p.category] = (catCounts[p.category] || 0) + 1;
});
console.log("Category breakdown in buildCatalogData.js:", catCounts);

// Let's check matching between posterCatalog file names and all_new_poster_no_repeated_poster directory!
const posterDir = 'd:/PINBOARD-GIT/all_new_poster_no_repeated_poster';
const physicalFiles = fs.readdirSync(posterDir);

console.log("Total physical files in all_new_poster_no_repeated_poster:", physicalFiles.length);

const catalogFileSet = new Set(posterCatalog.map(p => p.file));
const missingInDir = posterCatalog.filter(p => !physicalFiles.includes(p.file));
const missingInCatalog = physicalFiles.filter(f => !catalogFileSet.has(f));

console.log(`Poster files missing in physical directory: ${missingInDir.length}`);
if (missingInDir.length > 0) {
  console.log("Missing files:", missingInDir.map(p => p.file));
}

console.log(`Physical files missing in catalog: ${missingInCatalog.length}`);
if (missingInCatalog.length > 0) {
  console.log("Missing catalog entries for physical files:", missingInCatalog);
}
