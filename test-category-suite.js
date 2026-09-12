const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PINBOARD DEDICATED 3D CATEGORY PAGES TEST SUITE');
console.log('====================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runCategoryTests() {
  try {
    const categories = [
      {
        slug: 'movies',
        title: 'MOVIES',
        tagline: 'Iconic stories. Legendary characters. Posters made for your wall.',
        filters: ['ALL', 'MARVEL', 'DC', 'TAMIL', 'HOLLYWOOD', 'BOLLYWOOD', 'ANIMATION', 'ACTION', 'SCI-FI']
      },
      {
        slug: 'cars',
        title: 'CARS',
        tagline: 'Performance. Design. Machines worth displaying.',
        filters: ['ALL', 'LAMBORGHINI', 'FERRARI', 'PORSCHE', 'BMW', 'MERCEDES', 'JDM', 'SUPERCARS', 'HYPERCARS']
      },
      {
        slug: 'motivation',
        title: 'MOTIVATION',
        tagline: 'Discipline equals freedom. Elevate your standard.',
        filters: ['ALL', 'DISCIPLINE', 'GYM & FITNESS', 'HUSTLE', 'MINDFULNESS', 'LEADERSHIP', 'LEGENDS', 'SUCCESS']
      },
      {
        slug: 'gaming',
        title: 'GAMING',
        tagline: 'Level up your wall.',
        filters: ['ALL', 'GTA', 'MINECRAFT', 'CALL OF DUTY', 'FORTNITE', 'CYBERPUNK', 'VALORANT', 'PUBG', 'PLAYSTATION', 'XBOX']
      },
      {
        slug: 'sports',
        title: 'SPORTS',
        tagline: 'Icons. Moments. Legends.',
        filters: ['ALL', 'FOOTBALL', 'CRICKET', 'BASKETBALL', 'F1', 'TENNIS', 'NBA', 'CHAMPIONS LEAGUE', 'PREMIER LEAGUE']
      }
    ];

    console.log('--- 1. HTTP Endpoint & File Verification ---');
    for (const cat of categories) {
      const resClean = await fetch(`http://localhost:3000/${cat.slug}`);
      const resHtml = await fetch(`http://localhost:3000/${cat.slug}.html`);

      assert(resClean.status === 200, `GET /${cat.slug} responded with 200 OK`);
      assert(resHtml.status === 200, `GET /${cat.slug}.html responded with 200 OK`);

      const html = await resHtml.text();
      assert(html.includes(cat.title), `${cat.slug}.html contains title "${cat.title}"`);
      assert(html.includes(cat.tagline), `${cat.slug}.html contains tagline "${cat.tagline}"`);
      assert(html.includes('id="categoryPosterGrid"'), `${cat.slug}.html contains #categoryPosterGrid`);
      assert(html.includes('id="categoryHeroStage"'), `${cat.slug}.html contains #categoryHeroStage for 3D hero`);
      assert(html.includes('id="categoryFilterTrack"'), `${cat.slug}.html contains #categoryFilterTrack`);
      assert(html.includes('id="catSearchInput"'), `${cat.slug}.html contains in-category search input`);
      assert(html.includes('id="catSortSelect"'), `${cat.slug}.html contains sort dropdown`);
      assert(html.includes('Back to Collections'), `${cat.slug}.html contains "Back to Collections" button`);
      assert(html.includes('css/category.css'), `${cat.slug}.html includes css/category.css`);
      assert(html.includes('js/category.js'), `${cat.slug}.html includes js/category.js`);

      // Verify each subcategory filter button is present
      for (const filter of cat.filters) {
        assert(html.toLowerCase().includes(filter.toLowerCase()), `${cat.slug}.html contains filter pill "${filter}"`);
      }
    }

    console.log('\n--- 1b. Backward Compatibility Route Verification (/anime -> motivation) ---');
    const animeRes = await fetch('http://localhost:3000/anime', { redirect: 'manual' });
    assert(animeRes.status === 301 || animeRes.status === 200, `GET /anime returns 301 redirect or 200`);

    console.log('\n--- 2. Collections Overlay Cross-Page Navigation Verification ---');
    const pagesToCheck = ['index.html', 'shop.html', 'account.html'];
    for (const pageName of pagesToCheck) {
      const pageRes = await fetch(`http://localhost:3000/${pageName}`);
      const pageHtml = await pageRes.text();

      assert(pageHtml.includes('href="movies.html"'), `${pageName} Collections overlay links to movies.html`);
      assert(pageHtml.includes('href="cars.html"'), `${pageName} Collections overlay links to cars.html`);
      assert(pageHtml.includes('href="motivation.html"'), `${pageName} Collections overlay links to motivation.html`);
      assert(pageHtml.includes('href="gaming.html"'), `${pageName} Collections overlay links to gaming.html`);
      assert(pageHtml.includes('href="sports.html"'), `${pageName} Collections overlay links to sports.html`);
    }

    console.log('\n--- 3. Category Logic & Poster Categorization Simulation ---');
    const productsData = require('./js/products-data.js');
    const allProducts = productsData.PINBOARD_PRODUCTS;
    assert(Array.isArray(allProducts) && allProducts.length > 0, `Catalog contains ${allProducts.length} posters`);

    // Verify existing movies posters
    const moviePosters = allProducts.filter(p => {
      const tags = (p.tags || []).join(' ').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return cat.includes('movie') || cat.includes('film') || cat.includes('comic') || tags.includes('marvel') || tags.includes('spiderman');
    });
    assert(moviePosters.length > 0, `Existing Movie posters detected: ${moviePosters.map(p => p.title).join(', ')}`);

    // Verify existing sports posters
    const sportsPosters = allProducts.filter(p => {
      const tags = (p.tags || []).join(' ').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return cat.includes('football') || cat.includes('sports') || tags.includes('messi');
    });
    assert(sportsPosters.length > 0, `Existing Sports posters detected: ${sportsPosters.map(p => p.title).join(', ')}`);

    // Verify motivation posters
    const motivationPosters = allProducts.filter(p => {
      const tags = (p.tags || []).join(' ').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return cat === 'motivation' || tags.includes('discipline') || tags.includes('hustle') || tags.includes('mindfulness');
    });
    assert(motivationPosters.length >= 6, `At least 6 Motivation posters detected: ${motivationPosters.map(p => p.title).join(', ')}`);

    console.log('\n====================================================');
    console.log('🎉 ALL 3D CATEGORY SYSTEM TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runCategoryTests();
