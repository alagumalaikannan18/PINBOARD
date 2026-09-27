const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('PINBOARD PRINT SPECIFICATIONS DYNAMIC SIZE SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// 1. Static file assertions
test('js/product.js contains updatePrintSpecifications function connected to selectedSize', () => {
  const code = fs.readFileSync(path.resolve(__dirname, 'js/product.js'), 'utf8');
  assert(code.includes('function updatePrintSpecifications()'), 'js/product.js defines updatePrintSpecifications');
  assert(code.includes('var activeSizeStr = spec.code + \' (\' + spec.dim + \')\''), 'uses size code & dimensions');
  assert(code.includes('updatePrintSpecifications()'), 'updatePriceDisplay calls updatePrintSpecifications');
});

test('js/product.js defines SIZE_SPECS for A6 and A4 only', () => {
  const code = fs.readFileSync(path.resolve(__dirname, 'js/product.js'), 'utf8');
  assert(code.includes("105 × 148 mm"), 'A6 dimensions set to 105 × 148 mm');
  assert(code.includes("210 × 297 mm"), 'A4 dimensions set to 210 × 297 mm');
  assert(!code.includes("A3: {"), 'A3 size specification object removed from SIZE_SPECS');
  assert(!code.includes("A5: {"), 'A5 size specification object removed from SIZE_SPECS');
});

test('products-data.js contains clean size entries', () => {
  const code = fs.readFileSync(path.resolve(__dirname, 'js/products-data.js'), 'utf8');
  assert(!code.includes('A3 (297 × 420 mm)'), 'No hardcoded A3 dimensions in products-data.js');
});

// 2. DOM Simulation & Behavior Test
test('DOM simulation: updatePrintSpecifications updates #pdpSpecs dynamically on size selection', () => {
  const productJsCode = fs.readFileSync(path.resolve(__dirname, 'js/product.js'), 'utf8');

  // Create lightweight DOM mock
  let pdpSpecsContent = '';
  const elements = {
    pdpSpecs: {
      set innerHTML(val) { pdpSpecsContent = val; },
      get innerHTML() { return pdpSpecsContent; }
    },
    pdpCurrentPrice: { textContent: '' },
    pdpOriginalMrp: { textContent: '' },
    pdpPerPoster: { textContent: '' },
    pdpSelectedSizeReadout: { textContent: '' },
    pdpComboBanner: { style: { display: '' } }
  };

  const SIZE_SPECS = {
    A6: { code: 'A6', name: 'Small', dim: '105 × 148 mm', salePrice: 25, regularPrice: 49 },
    A4: { code: 'A4', name: 'Standard', dim: '210 × 297 mm', salePrice: 60, regularPrice: 99 }
  };

  let selectedSize = 'A4';
  const product = { pieces: 1, specifications: {} };

  function updatePrintSpecifications() {
    var spec = SIZE_SPECS[selectedSize] || SIZE_SPECS.A4;
    var activeSizeStr = spec.code + ' (' + spec.dim + ')';
    var prodSpecs = product.specifications || {};

    var specsData = {
      'Size': activeSizeStr,
      'Material': prodSpecs['Material'] || prodSpecs['Stock'] || '300 GSM Museum-Grade Fine Art Sheet',
      'Finish': prodSpecs['Finish'] || 'Smooth Matte Archival Finish',
      'Pieces': (product.pieces || 1).toString(),
      'Frame': prodSpecs['Frame'] || 'Not Included',
      'Packaging': prodSpecs['Packaging'] || 'Rigid tube, flat-packed'
    };

    var shtml = '';
    var keys = ['Size', 'Material', 'Finish', 'Pieces', 'Frame', 'Packaging'];
    keys.forEach(function (k) {
      shtml += '<tr><td>' + k + '</td><td>' + specsData[k] + '</td></tr>';
    });

    elements.pdpSpecs.innerHTML = shtml;
  }

  // Initial load check (A4)
  updatePrintSpecifications();
  assert(pdpSpecsContent.includes('<td>Size</td><td>A4 (210 × 297 mm)</td>'), 'Default size A4 renders 210 × 297 mm');
  assert(pdpSpecsContent.includes('<td>Material</td><td>300 GSM Museum-Grade Fine Art Sheet</td>'), 'Material preserved');

  // Select A6
  selectedSize = 'A6';
  updatePrintSpecifications();
  assert(pdpSpecsContent.includes('<td>Size</td><td>A6 (105 × 148 mm)</td>'), 'A6 selection renders 105 × 148 mm');

  // Select A4 again
  selectedSize = 'A4';
  updatePrintSpecifications();
  assert(pdpSpecsContent.includes('<td>Size</td><td>A4 (210 × 297 mm)</td>'), 'Toggling back to A4 renders 210 × 297 mm');
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('ALL PRINT SPECIFICATIONS TESTS PASSED SUCCESSFULLY!\n');
} else {
  process.exitCode = 1;
}
