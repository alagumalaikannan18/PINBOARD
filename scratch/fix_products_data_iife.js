const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'js', 'products-data.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find where PinboardSearch starts
const searchStart = content.indexOf('var PinboardSearch = {');
if (searchStart !== -1) {
  const productsPart = content.substring(0, searchStart).trim();
  const searchPart = content.substring(searchStart);

  const cleanSearchIIFE = `
(function () {
  ${searchPart}
`;
  // Check if ending matches correctly
  fs.writeFileSync(filePath, productsPart + '\n\n' + cleanSearchIIFE, 'utf8');
  console.log('Fixed PinboardSearch IIFE in js/products-data.js');
} else {
  console.log('PinboardSearch start not found');
}
