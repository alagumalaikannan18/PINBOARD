const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('d:/PINBOARD-GIT/index.html', 'utf8');
const navigationJs = fs.readFileSync('d:/PINBOARD-GIT/js/navigation.js', 'utf8');
const scriptJs = fs.readFileSync('d:/PINBOARD-GIT/js/script.js', 'utf8');
const posterConfigJs = fs.readFileSync('d:/PINBOARD-GIT/js/poster-config.js', 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost:3000/index.html',
  runScripts: 'dangerously',
  resources: 'usable'
});

const { window } = dom;
const { document } = window;

// Inject scripts manually if needed or eval
try {
  window.eval(posterConfigJs);
  window.eval(navigationJs);
  window.eval(scriptJs);
} catch (e) {
  console.error("Eval error:", e);
}

// Fire DOMContentLoaded
const evt = new window.Event('DOMContentLoaded');
document.dispatchEvent(evt);

console.log("=== BEFORE CLICK ===");
const catOverlay = document.getElementById('catOverlay');
console.log("catOverlay has 'open' class:", catOverlay.classList.contains('open'));

// Find Collections link in nav
const collectionsLink = document.querySelector('nav a[href="#collections"]');
console.log("Collections link found:", !!collectionsLink, collectionsLink ? collectionsLink.outerHTML : '');

if (collectionsLink) {
  console.log("--- Simulating Click on Collections link ---");
  const clickEvt = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  collectionsLink.dispatchEvent(clickEvt);

  console.log("=== AFTER CLICK ===");
  console.log("catOverlay has 'open' class:", catOverlay.classList.contains('open'));
}
