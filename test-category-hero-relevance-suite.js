// ==========================================================================
// TEST SUITE: Collection Hero Poster Content Relevance
// ==========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n======================================================');
console.log('PINBOARD COLLECTION HERO RELEVANCE VERIFICATION');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    \x1b[33mError:\x1b[0m ${err.message}`);
  }
}

const carsHtml = fs.readFileSync(path.join(__dirname, 'cars.html'), 'utf8');
const moviesHtml = fs.readFileSync(path.join(__dirname, 'movies.html'), 'utf8');
const motivationHtml = fs.readFileSync(path.join(__dirname, 'motivation.html'), 'utf8');
const gamingHtml = fs.readFileSync(path.join(__dirname, 'gaming.html'), 'utf8');
const sportsHtml = fs.readFileSync(path.join(__dirname, 'sports.html'), 'utf8');
const categoryJs = fs.readFileSync(path.join(__dirname, 'js', 'category.js'), 'utf8');
const productsJs = fs.readFileSync(path.join(__dirname, 'js', 'products-data.js'), 'utf8');

function getHeroStageHtml(htmlStr) {
  const idx = htmlStr.indexOf('id="categoryHeroStage"');
  return idx !== -1 ? htmlStr.slice(idx, idx + 1200) : '';
}

// 1. CARS Hero Relevance
test('cars.html hero contains strictly automotive posters (no Messi/football/GTA)', () => {
  const hero = getHeroStageHtml(carsHtml);
  assert(!hero.includes('1555895.webp'), 'cars.html hero must not contain Messi poster 1555895');
  assert(!hero.includes('1555764.webp'), 'cars.html hero must not contain GTA poster 1555764');
  assert(hero.includes('1557527.webp') || hero.includes('cat_cars.webp'), 'cars.html hero must contain car poster 1557527 or cat_cars.webp');
  assert(hero.includes('1514085.webp'), 'cars.html hero must contain BMW car poster 1514085');
});

// 2. MOVIES Hero Relevance
test('movies.html hero contains strictly cinema/movie posters (no Ronaldo/football)', () => {
  const hero = getHeroStageHtml(moviesHtml);
  assert(!hero.includes('1551192'), 'movies.html hero must not contain Ronaldo poster');
  assert(hero.includes('cat_movies.webp'), 'movies.html hero must contain cat_movies.webp');
  assert(hero.includes('1513642.webp'), 'movies.html hero must contain Batman poster 1513642');
  assert(hero.includes('1553164.webp'), 'movies.html hero must contain Doctor Doom poster 1553164');
});

// 3. GAMING Hero Relevance
test('gaming.html hero contains strictly video game posters', () => {
  const hero = getHeroStageHtml(gamingHtml);
  assert(hero.includes('cat_gaming.webp'), 'gaming.html hero must contain cat_gaming.webp');
  assert(hero.includes('1555762.webp'), 'gaming.html hero must contain RDR2 Arthur Morgan poster 1555762');
  assert(hero.includes('1556993.webp'), 'gaming.html hero must contain RDR2 Sunset poster 1556993');
});

// 4. MOTIVATION Hero Relevance
test('motivation.html hero contains strictly motivational posters', () => {
  const hero = getHeroStageHtml(motivationHtml);
  assert(hero.includes('cat_motivation.webp'), 'motivation.html hero must contain cat_motivation.webp');
  assert(hero.includes('1551532.webp'), 'motivation.html hero must contain CR7 Discipline quote poster 1551532');
  assert(hero.includes('1514166.webp'), 'motivation.html hero must contain What If It Works poster 1514166');
});

// 5. SPORTS Hero Relevance
test('sports.html hero contains strictly sports/football posters', () => {
  const hero = getHeroStageHtml(sportsHtml);
  assert(hero.includes('cat_sports.webp'), 'sports.html hero must contain cat_sports.webp');
  assert(hero.includes('cat_football.webp'), 'sports.html hero must contain cat_football.webp');
  assert(hero.includes('1554016.webp'), 'sports.html hero must contain Leo Messi 10 poster 1554016');
});

// 6. Dynamic Hero Filtering in js/category.js
test('js/category.js defines updateHeroCollageVisuals to enforce category-level filtering', () => {
  assert(categoryJs.includes('function updateHeroCollageVisuals()'), 'js/category.js must define updateHeroCollageVisuals');
  assert(categoryJs.includes('currentCategory === \'cars\''), 'js/category.js must check cars category');
  assert(categoryJs.includes('currentCategory === \'movies\''), 'js/category.js must check movies category');
});

// 7. Products Dataset Integrity & Relevance
test('js/products-data.js has clean image mappings matching content (GTA 9 & Messi 19)', () => {
  eval(productsJs);
  const prod9 = PINBOARD_PRODUCTS.find(p => p.id === 9);
  const prod19 = PINBOARD_PRODUCTS.find(p => p.id === 19);

  assert(prod9 && prod9.category === 'Gaming' && prod9.images[0] === 'poster/opt/1555764.webp', 'Product 9 must be Gaming GTA 1555764');
  assert(prod19 && prod19.category === 'Sports' && prod19.images[0] === 'poster/opt/1555895.webp', 'Product 19 must be Sports Messi 1555895');
});

console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
