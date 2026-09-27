const fs = require('fs');
const path = require('path');

const posterDir = 'd:/PINBOARD-GIT/all_new_poster_no_repeated_poster';
const files = fs.readdirSync(posterDir);

console.log("Total files in folder:", files.length);

// Let's inspect file sizes and names
files.forEach((f, i) => {
  console.log(`${String(i+1).padStart(3, '0')}: ${f}`);
});
