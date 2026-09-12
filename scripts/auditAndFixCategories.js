const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_DATA_PATH = path.join(ROOT_DIR, 'js', 'products-data.js');

const rawContent = fs.readFileSync(PRODUCTS_DATA_PATH, 'utf8');
const sandbox = {};
vm.runInNewContext(rawContent, sandbox);
const products = sandbox.PINBOARD_PRODUCTS || [];

console.log(`Starting audit on ${products.length} products...`);

const auditLog = [];

products.forEach(p => {
  const oldCat = p.category;
  let newCat = oldCat;
  let changed = false;

  // Audit Product 1: Cristiano Ronaldo "Talent can make you noticed, Discipline makes you unforgettable"
  if (p.id === 1) {
    p.title = 'DISCIPLINE MAKES YOU UNFORGETTABLE | Cristiano Ronaldo';
    p.subtitle = 'Athletic Drive · Cristiano Ronaldo Quote';
    newCat = 'Motivation';
    p.collection = 'Mindset & Stoicism';
    p.tags = ['motivation', 'discipline', 'gym & fitness', 'fitness', 'gym', 'cristiano ronaldo', 'cr7', 'talent', 'unforgettable', 'mindset', 'quote'];
    p.keywords = 'discipline makes you unforgettable talent can make you noticed cristiano ronaldo cr7 quote motivation gym fitness';
    p.subject = 'Cristiano Ronaldo shouting in stadium rain with discipline quote';
    p.description = 'Talent can make you noticed. Discipline makes you unforgettable. Archival print of Cristiano Ronaldo on 300 GSM museum-grade matte art paper.';
    changed = true;
  }

  // Audit Product 2: "Be Yourself"
  if (p.id === 2) {
    p.title = 'BE YOURSELF | Mindset Print';
    p.subtitle = 'Mindset & Courage · True Identity';
    newCat = 'Motivation';
    p.collection = 'Mindset & Stoicism';
    p.tags = ['motivation', 'mindfulness', 'authenticity', 'be yourself', 'courage', 'mindset', 'leadership', 'focus'];
    p.keywords = 'be yourself stage spotlight authenticity courage confidence leadership self belief mindset poster';
    p.subject = 'Musician performing on stage with Be Yourself typography';
    p.description = 'Be yourself — confidence and self-mastery visual print. Deep blacks and fine typographic detail on premium 300 GSM matte stock.';
    changed = true;
  }

  // Audit Product 3: "Parasite" (Bong Joon-ho)
  if (p.id === 3) {
    p.title = 'PARASITE | Bong Joon-ho Oscar Winner';
    p.subtitle = 'World Cinema · Palme d\'Or Print';
    newCat = 'Movies';
    p.collection = 'Cult Cinema';
    p.tags = ['movies', 'parasite', 'bong joon ho', 'oscar', 'palme dor', 'korean cinema', 'hollywood', 'thriller', 'black comedy'];
    p.keywords = 'parasite bong joon-ho academy award best picture palme dor korean movie park family kim family modern classic cinema';
    p.subject = 'Parasite lawn garden party with eye bar censor';
    p.description = 'Academy Award Best Picture winner Parasite directed by Bong Joon-ho. Museum-quality giclée print on 300 GSM archival stock.';
    changed = true;
  }

  // Audit Product 4: Cristiano Ronaldo 7 Portugal
  if (p.id === 4) {
    p.title = 'CRISTIANO RONALDO | Portugal #7';
    p.subtitle = 'Football Legends · Seleção Captain';
    newCat = 'Sports';
    p.collection = 'Football Legends';
    p.tags = ['sports', 'football', 'ronaldo', 'cristiano ronaldo', 'cr7', 'portugal', 'champions', 'goat', 'athlete'];
    p.keywords = 'cristiano ronaldo cr7 portugal national team captain 7 selecao goat football legend jersey sports';
    p.subject = 'Cristiano Ronaldo back jersey pointing to his name';
    p.description = 'Cristiano Ronaldo captaining Portugal in the iconic #7 jersey. Archival sports art print on 300 GSM heavyweight matte sheet.';
    changed = true;
  }

  // Audit Product 5: "Men Are Brave" Batman
  if (p.id === 5) {
    p.title = 'MEN ARE BRAVE | The Dark Knight Emblem';
    p.subtitle = 'DC Universe · Heavy Shadow Print';
    newCat = 'Movies';
    p.collection = 'DC & Gotham';
    p.tags = ['movies', 'dc', 'batman', 'the dark knight', 'bruce wayne', 'gotham', 'superhero', 'action', 'men are brave'];
    p.keywords = 'batman dc comics the dark knight bruce wayne gotham city men are brave superhero silhouette vigilante movie';
    p.subject = 'Batman Dark Knight silhouette with Men Are Brave typography';
    p.description = 'Minimalist Batman Dark Knight silhouette with Men Are Brave typography. Printed on 300 GSM premium matte art stock.';
    changed = true;
  }

  // Audit Product 6: Spider-Man Suit Reveal
  if (p.id === 6) {
    p.title = 'SPIDER-MAN | The Suit Reveal';
    p.subtitle = 'Marvel Cinema · Classic Webbed Suit';
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    p.tags = ['movies', 'marvel', 'spiderman', 'spider-man', 'peter parker', 'suit', 'superhero', 'comic', 'action'];
    p.keywords = 'spider-man peter parker unzipping jacket suit reveal classic red webbing marvel superhero cinema';
    p.subject = 'Peter Parker unzipping jacket revealing red Spider-Man suit';
    p.description = 'Peter Parker revealing the red webbed Spider-Man suit. Vibrant archival inks on museum-grade 300 GSM matte paper.';
    changed = true;
  }

  // Audit Product 7: Tom Holland Peter Parker No Way Home
  if (p.id === 7) {
    p.title = 'PETER PARKER | No Way Home Crowd';
    p.subtitle = 'Marvel Cinema · Metro General Fleece';
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    p.tags = ['movies', 'marvel', 'spiderman', 'spider-man', 'peter parker', 'no way home', 'tom holland', 'superhero'];
    p.keywords = 'peter parker tom holland no way home metro general hospital green jacket crowd marvel superhero cinema';
    p.subject = 'Tom Holland as Peter Parker standing in crowd with bruised cheek';
    p.description = 'Tom Holland as Peter Parker navigating NYC crowds in Spider-Man: No Way Home. Printed on 300 GSM fine art paper.';
    changed = true;
  }

  // Audit Product 8: "Answers to Hell Me" Doctor Doom
  if (p.id === 8) {
    p.title = 'ANSWERS TO HELL ME | Doctor Doom Latveria';
    p.subtitle = 'Marvel Cinema · Latverian Sovereign';
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    p.tags = ['movies', 'marvel', 'doctor doom', 'victor von doom', 'latveria', 'supervillain', 'captain america', 'iron man'];
    p.keywords = 'doctor doom victor von doom answers to hell me latveria iron man helmet captain america shield marvel villain';
    p.subject = 'Doctor Doom standing atop Captain America broken shield holding Iron Man helmet';
    p.description = 'Doctor Doom sovereign of Latveria holding Iron Man\'s helmet over Captain America\'s broken shield. Printed on 300 GSM matte stock.';
    changed = true;
  }

  // Audit Product 9: Porsche 911 GT3 RS
  if (p.id === 9) {
    p.title = 'PORSCHE 911 GT3 RS | Monochrome Racecar';
    p.subtitle = 'Stuttgart Precision · Silver & Carbon';
    newCat = 'Cars';
    p.collection = 'Supercars & Speed';
    p.tags = ['cars', 'porsche', 'porsche 911 gt3 rs', 'gt3 rs', 'weissach', 'supercars', 'hypercars', 'germany', 'speed'];
    p.keywords = 'porsche 911 gt3 rs racecar stuttgart vertical typography monochrome black silver supercar cars speed';
    p.subject = 'Porsche 911 GT3 RS on vertical black and silver canvas';
    p.description = 'High-downforce Porsche 911 GT3 RS displayed against bold typographic backdrop. Archival automotive art on 300 GSM matte sheet.';
    changed = true;
  }

  // Audit Product 10: Messi 10 Greatest of All Time
  if (p.id === 10) {
    p.title = 'THE GREATEST PLAYER OF ALL TIME | Leo Messi 10';
    p.subtitle = 'Football Legends · Pitch Ball Mastery';
    newCat = 'Sports';
    p.collection = 'Football Legends';
    p.tags = ['sports', 'football', 'messi', 'lionel messi', 'goat', 'argentina', 'number 10', 'athlete', 'fifa'];
    p.keywords = 'the greatest player of all time lionel messi goat football ball control pitch legend champions sports';
    p.subject = 'Lionel Messi looking over shoulder in #10 jersey holding football';
    p.description = 'Lionel Messi looking back in the iconic #10 jersey holding football. Printed on museum-grade 300 GSM matte paper.';
    changed = true;
  }

  // Audit Product 11: Messi Barca Crest Kiss (was Football)
  if (p.id === 11) {
    newCat = 'Sports';
    p.collection = 'Football Legends';
    changed = true;
  }

  // Audit Product 13: Doctor Doom (was Comics)
  if (p.id === 13) {
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    changed = true;
  }

  // Audit Product 14: Messi World Cup (was Football)
  if (p.id === 14) {
    newCat = 'Sports';
    p.collection = 'Football Legends';
    changed = true;
  }

  // Audit Product 16: CR7 Portugal 7 (was Motivation)
  if (p.id === 16) {
    p.title = 'CRISTIANO RONALDO | Portugal Crest #7';
    p.subtitle = 'Football Legends · Seleção das Quinas';
    newCat = 'Sports';
    p.collection = 'Football Legends';
    p.tags = ['sports', 'football', 'ronaldo', 'cristiano ronaldo', 'cr7', 'portugal', 'champions', 'goat'];
    p.keywords = 'cristiano ronaldo cr7 portugal national team captain 7 selecao goat football legend jersey sports';
    p.subject = 'Cristiano Ronaldo back jersey pointing to his name';
    p.description = 'Cristiano Ronaldo in Portugal national team jersey. High-impact sports print on 300 GSM matte stock.';
    changed = true;
  }

  // Audit Product 17: Miles Morales Spider-Man (was Motivation)
  if (p.id === 17) {
    p.title = 'MILES MORALES | Skyline Sunset';
    p.subtitle = 'Marvel Cinema · Archival Print';
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    p.tags = ['movies', 'marvel', 'spiderman', 'spider-man', 'miles morales', 'into the spiderverse', 'brooklyn', 'superhero'];
    p.keywords = 'miles morales spider-man spiderman marvel superhero into the spider-verse brooklyn sunset skyline cinema';
    p.subject = 'Miles Morales sitting on high rise ledge looking at sunset skyline';
    p.description = 'Miles Morales overlooking Brooklyn skyline at sunset. Vibrant archival Marvel art print on 300 GSM matte stock.';
    changed = true;
  }

  // Audit Product 18: Spider-Man Rebirth (was Motivation)
  if (p.id === 18) {
    p.title = 'SPIDER-MAN | Rebirth Suit';
    p.subtitle = 'Marvel Cinema · Integrated Suit Print';
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    p.tags = ['movies', 'marvel', 'spiderman', 'spider-man', 'tom holland', 'rebirth', 'queens', 'superhero'];
    p.keywords = 'spider-man rebirth tom holland integrated suit queens nyc marvel cinematic universe movie';
    p.subject = 'Tom Holland Spider-Man shooting web gesture through fingers';
    p.description = 'Spider-Man in combat stance in front of glowing fire backdrop. Printed on 300 GSM premium matte art paper.';
    changed = true;
  }

  // Audit Product 19: Lightning McQueen (was Motivation)
  if (p.id === 19) {
    p.title = 'LIGHTNING McQUEEN | Skyfall Flight';
    p.subtitle = 'Automotive Animation · #95 Racing Print';
    newCat = 'Cars';
    p.collection = 'Supercars & Speed';
    p.tags = ['cars', 'lightning mcqueen', 'cars movie', 'pixar', 'piston cup', 'rust-eze', 'racing', 'supercars', 'speed'];
    p.keywords = 'lightning mcqueen 95 cars movie pixar rust-eze racing skyfall clouds red racecar speed automotive';
    p.subject = 'Lightning McQueen #95 freefalling through clouds';
    p.description = 'Lightning McQueen #95 diving through cinematic clouds. High-definition automotive print on 300 GSM matte stock.';
    changed = true;
  }

  // Audit Product 20: Doctor Doom (was Motivation)
  if (p.id === 20) {
    p.title = 'DOOM | Monarch of Latveria';
    p.subtitle = 'Marvel Comics · Sovereign Stone Edition';
    newCat = 'Movies';
    p.collection = 'Marvel & Cinema';
    p.tags = ['movies', 'marvel', 'doctor doom', 'victor von doom', 'fantastic four', 'latveria', 'comic', 'supervillain'];
    p.keywords = 'doctor doom victor von doom monarch sovereign latveria iron mask marvel fantastic four comic movie art';
    p.subject = 'Doctor Doom walking towards massive stone cathedral DOOM typography';
    p.description = 'Doctor Doom standing before the monolithic Latverian citadel with archangels and Earth. Printed on 300 GSM archival stock.';
    changed = true;
  }

  // Audit Product 111: Into The Wild ("EIN FILM VON SEAN PENN") (was Motivation)
  if (p.id === 111) {
    newCat = 'Movies';
    p.collection = 'Cult Cinema';
    p.tags = ['movies', 'into the wild', 'sean penn', 'alexander supertramp', 'magic bus 142', 'cinema', 'hollywood', 'adventure'];
    changed = true;
  }

  // Audit Product 123: Cigarettes After Sex Apocalypse (was Motivation)
  if (p.id === 123) {
    newCat = 'Movies';
    p.collection = 'Cult Cinema';
    p.tags = ['movies', 'cigarettes after sex', 'apocalypse', 'music', 'cinematic', 'pop culture', 'aesthetic', 'vintage'];
    changed = true;
  }

  // Audit Product 129: Sarpatta Parambarai (was Sports)
  if (p.id === 129) {
    p.title = 'SARPATTA PARAMBARAI | Kabilan The Comeback';
    p.subtitle = 'Tamil Cinema Legends · Pa. Ranjith Masterpiece';
    newCat = 'Movies';
    p.collection = 'Tamil Cinema Legends';
    p.tags = ['movies', 'tamil', 'sarpatta parambarai', 'arya', 'pa ranjith', 'kabilan', 'boxing', 'kollywood', 'cinema', 'comeback'];
    p.keywords = 'sarpatta parambarai arya kabilan pa ranjith boxing comeback kollywood tamil cinema comeback';
    p.subject = 'Arya as Kabilan standing victorious in boxing ring Sarpatta Parambarai';
    p.description = 'Arya as Kabilan in Pa. Ranjith\'s acclaimed boxing drama Sarpatta Parambarai. Museum-quality print on 300 GSM matte art paper.';
    changed = true;
  }

  if (changed) {
    p.category = newCat;
    auditLog.push({
      id: p.id,
      title: p.title,
      oldCategory: oldCat,
      newCategory: newCat
    });
  }
});

console.log(`Audited all products. Moved/Updated ${auditLog.length} products:`);
auditLog.forEach(item => {
  console.log(`  • [#${item.id}] "${item.title}": ${item.oldCategory} ➔ ${item.newCategory}`);
});

// Category Distribution after audit
const finalCounts = {};
products.forEach(p => {
  finalCounts[p.category] = (finalCounts[p.category] || 0) + 1;
});
console.log('\nFinal Category Distribution:');
console.log(finalCounts);

// Format and write back to js/products-data.js
const header = `// =============================================
// PINBOARD — Product Data & Search Engine
// Shared between homepage, product pages, and search
// =============================================

var PINBOARD_PRODUCTS = `;

const searchEngineMarker = '// =============================================\n// PINBOARD SEARCH ENGINE';
const searchEngineIdx = rawContent.indexOf(searchEngineMarker);
const restOfFile = rawContent.slice(searchEngineIdx);

const formatted = JSON.stringify(products, null, 2);
const updatedFile = `${header}${formatted};\n\n${restOfFile}`;

fs.writeFileSync(PRODUCTS_DATA_PATH, updatedFile, 'utf8');
console.log(`\n🎉 Successfully saved updated product dataset to ${PRODUCTS_DATA_PATH}!`);
