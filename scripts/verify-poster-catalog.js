// =============================================
// PINBOARD — Centralized Poster Catalog Verification Suite
// Validates all 156 unique posters from all_new_poster_no_repeated_poster
// Exit Code: 0 on Success, 1 on Failure
// =============================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log("======================================================");
console.log("PINBOARD POSTER CATALOG VALIDATION SUITE");
console.log("======================================================\n");

let passed = true;
const rootDir = path.resolve(__dirname, '..');
const posterDir = path.join(rootDir, 'all_new_poster_no_repeated_poster');
const catalogPath = path.join(rootDir, 'js/poster-catalog.js');
const productsDataPath = path.join(rootDir, 'js/products-data.js');

// 1. Verify poster directory exists and contains files
if (!fs.existsSync(posterDir)) {
  console.error("❌ CRITICAL ERROR: Poster directory not found:", posterDir);
  process.exit(1);
}

const sourceFiles = fs.readdirSync(posterDir).filter(f => !f.startsWith('.'));
console.log(`1. SOURCE FILES CHECK`);
console.log(`   - Found ${sourceFiles.length} files in all_new_poster_no_repeated_poster`);

if (sourceFiles.length !== 156) {
  console.error(`   ❌ FAIL: Expected 156 source files, found ${sourceFiles.length}`);
  passed = false;
} else {
  console.log(`   ✔ PASS: Exactly 156 source files present`);
}

// 2. Check for duplicate source files via SHA-256 hash
console.log(`\n2. DUPLICATE FILE DETECTION (SHA-256)`);
const fileHashes = new Map();
let duplicateFileCount = 0;

sourceFiles.forEach(file => {
  const filePath = path.join(posterDir, file);
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (fileHashes.has(hash)) {
    console.error(`   ❌ DUPLICATE DETECTED: ${file} is identical to ${fileHashes.get(hash)}`);
    duplicateFileCount++;
  } else {
    fileHashes.set(hash, file);
  }
});

console.log(`   - Unique File Hashes: ${fileHashes.size}`);
console.log(`   - Duplicate File Count: ${duplicateFileCount}`);

if (duplicateFileCount > 0) {
  console.error(`   ❌ FAIL: Found ${duplicateFileCount} duplicate file(s)`);
  passed = false;
} else {
  console.log(`   ✔ PASS: 100% unique files — zero duplicates`);
}

// 3. Load Poster Catalog
console.log(`\n3. POSTER CATALOG INTEGRITY CHECK`);
if (!fs.existsSync(catalogPath)) {
  console.error("❌ CRITICAL ERROR: poster-catalog.js not found at:", catalogPath);
  process.exit(1);
}

let catalog = [];
try {
  const catalogContent = fs.readFileSync(catalogPath, 'utf8');
  const fn = new Function('module', 'exports', 'self', catalogContent + '; return self.PINBOARD_POSTER_CATALOG || (module && module.exports);');
  const catalogObj = fn({ exports: {} }, {}, {});
  catalog = catalogObj.getAll ? catalogObj.getAll() : catalogObj;
} catch (err) {
  console.error("❌ FAIL: Failed to parse poster-catalog.js:", err.message);
  process.exit(1);
}

console.log(`   - Catalog Record Count: ${catalog.length}`);
if (catalog.length !== 156) {
  console.error(`   ❌ FAIL: Catalog count expected 156, found ${catalog.length}`);
  passed = false;
} else {
  console.log(`   ✔ PASS: Catalog contains exactly 156 unique canonical records`);
}

// 4. Validate Catalog Records, IDs, and File Existence
console.log(`\n4. CATALOG DETAILS & FILE REFERENCES`);
const seenIds = new Set();
const seenImages = new Set();
let missingFiles = 0;
let brokenRefs = 0;
let duplicateIds = 0;
let duplicateImageRefs = 0;

catalog.forEach((item, idx) => {
  // Check ID uniqueness
  if (seenIds.has(item.id)) {
    console.error(`   ❌ Duplicate ID found: ${item.id}`);
    duplicateIds++;
  }
  seenIds.add(item.id);

  // Check image uniqueness
  if (seenImages.has(item.image)) {
    console.error(`   ❌ Duplicate image reference in catalog: ${item.image}`);
    duplicateImageRefs++;
  }
  seenImages.add(item.image);

  // Check physical file existence
  const physicalPath = path.join(rootDir, item.image);
  if (!fs.existsSync(physicalPath)) {
    console.error(`   ❌ Missing poster image file: ${item.image}`);
    missingFiles++;
  }
});

console.log(`   - Missing Files Count: ${missingFiles}`);
console.log(`   - Broken References Count: ${brokenRefs}`);
console.log(`   - Duplicate IDs Count: ${duplicateIds}`);
console.log(`   - Duplicate Image References: ${duplicateImageRefs}`);

if (missingFiles > 0 || brokenRefs > 0 || duplicateIds > 0 || duplicateImageRefs > 0) {
  console.error(`   ❌ FAIL: Catalog integrity errors detected`);
  passed = false;
} else {
  console.log(`   ✔ PASS: All 156 catalog entries map cleanly to unique physical files`);
}

// 5. Category Distribution Breakdown
console.log(`\n5. CATEGORY DISTRIBUTION BREAKDOWN`);
const catDistribution = {};
catalog.forEach(item => {
  const cat = item.category || 'Unassigned';
  catDistribution[cat] = (catDistribution[cat] || 0) + 1;
});

Object.keys(catDistribution).forEach(cat => {
  console.log(`   - ${cat.padEnd(12)}: ${catDistribution[cat]} posters`);
});

const requiredCategories = ['Movies', 'Cars', 'Gaming', 'Sports', 'Motivation'];
requiredCategories.forEach(cat => {
  if (!catDistribution[cat] || catDistribution[cat] === 0) {
    console.error(`   ❌ FAIL: Category ${cat} has 0 posters!`);
    passed = false;
  }
});

if (passed) {
  console.log(`   ✔ PASS: All 5 categories populated cleanly`);
}

// 6. Summary and Exit Code
console.log("\n======================================================");
console.log("SUMMARY REPORT");
console.log("======================================================");
console.log(`Total Source Posters      : ${sourceFiles.length}`);
console.log(`Unique Posters in Catalog : ${catalog.length}`);
console.log(`Duplicate Poster Count    : ${duplicateFileCount}`);
console.log(`Missing Files             : ${missingFiles}`);
console.log(`Broken References         : ${brokenRefs}`);
console.log(`Duplicate IDs             : ${duplicateIds}`);
console.log(`Duplicate Image References: ${duplicateImageRefs}`);
console.log("Category Distribution     :", JSON.stringify(catDistribution));
console.log("======================================================");

if (passed) {
  console.log("🎉 ALL POSTER CATALOG CHECKS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("❌ VERIFICATION FAILED: Fix the errors reported above.");
  process.exit(1);
}
