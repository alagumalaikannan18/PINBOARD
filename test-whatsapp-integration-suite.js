/**
 * =========================================================================
 * PINBOARD — WhatsApp Click-to-Chat Single-Recipient Order Integration Test Suite
 * Validates Configuration, URL Encoding, Formatting, Deduplication & Single Recipient Handoff
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Simple DOM Mock Environment for Node.js
class ElementMock {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.style = {};
    this.children = [];
    this._innerHTML = '';
    this._attributes = {};
  }

  set innerHTML(val) {
    this._innerHTML = val;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(k, v) {
    this._attributes[k] = String(v);
  }

  getAttribute(k) {
    return this._attributes[k] || null;
  }

  addEventListener(event, fn) {
    // mock event listener
  }
}

const mockElements = {};
const globalDocument = {
  body: new ElementMock('body', 'body'),
  createElement(tag) {
    return new ElementMock('', tag);
  },
  getElementById(id) {
    return mockElements[id] || null;
  }
};

global.document = globalDocument;
global.window = {
  document: globalDocument,
  location: { href: '' },
  open(url, target) {
    return { closed: false };
  }
};

// Require WhatsApp module
const PinboardWhatsApp = require('./js/whatsapp-order.js');
const {
  WHATSAPP_ORDER_NUMBER,
  WHATSAPP_ORDER_NUMBERS,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  openWhatsAppOrder,
  openWhatsAppOrderForAllRecipients,
  deduplicateOrderItems
} = PinboardWhatsApp;

console.log('--- RUNNING PINBOARD WHATSAPP CLICK-TO-CHAT TEST SUITE ---');

// TEST 1: Configuration Validation
console.log('\n--- TEST 1: Centralized WhatsApp Number Configuration ---');
assert.strictEqual(WHATSAPP_ORDER_NUMBER, '919342302872', 'Single WhatsApp number is 919342302872');
assert(Array.isArray(WHATSAPP_ORDER_NUMBERS), 'WHATSAPP_ORDER_NUMBERS is an array');
assert.strictEqual(WHATSAPP_ORDER_NUMBERS[0], '919342302872', 'First array number is 919342302872');
assert(!WHATSAPP_ORDER_NUMBER.includes('+'), 'Number does not include +');
assert(!WHATSAPP_ORDER_NUMBER.includes(' '), 'Number does not include spaces');
assert(!WHATSAPP_ORDER_NUMBER.includes('-'), 'Number does not include dashes');
assert(!WHATSAPP_ORDER_NUMBER.includes('(') && !WHATSAPP_ORDER_NUMBER.includes(')'), 'Number does not include brackets');
assert(/^\d+$/.test(WHATSAPP_ORDER_NUMBER), 'Number is digits only');
console.log('✅ PASS: Single WhatsApp configuration meets strict international formatting specifications');

// TEST 2: Product Detail → Single A4 Poster
console.log('\n--- TEST 2: Single A4 Poster Order Message ---');
const singleA4Order = {
  items: [{
    id: 1,
    title: 'Spider-Man | No Way Home',
    size: 'A4',
    quantity: 1,
    unitPrice: 60,
    total: 60
  }],
  grandTotal: 60
};
const msg1 = buildWhatsAppOrderMessage(singleA4Order);
assert(msg1.includes('Hello PINBOARD! 👋'), 'Includes header');
assert(msg1.includes('1. Spider-Man | No Way Home'), 'Includes product title');
assert(msg1.includes('Size: A4'), 'Includes size A4');
assert(msg1.includes('Quantity: 1'), 'Includes quantity 1');
assert(msg1.includes('Unit Price: ₹60'), 'Includes unit price ₹60');
assert(msg1.includes('Total: ₹60'), 'Includes line total ₹60');
assert(msg1.includes('Grand Total: ₹60'), 'Includes grand total ₹60');
assert(msg1.includes('Please confirm my order.'), 'Includes footer');
console.log('✅ PASS: Single A4 poster order message formatted correctly');

// TEST 3: Product Detail → 4 A4 Posters (Exact Specification Match)
console.log('\n--- TEST 3: Four A4 Posters Order Message ---');
const fourA4Order = {
  items: [{
    id: 1,
    title: 'Peter Parker | No Way Home NYC',
    size: 'A4',
    quantity: 4,
    unitPrice: 60,
    total: 240
  }],
  grandTotal: 240
};
const msg2 = buildWhatsAppOrderMessage(fourA4Order);
const expectedMsg2 = [
  'Hello PINBOARD! 👋',
  '',
  'I want to order:',
  '',
  '1. Peter Parker | No Way Home NYC',
  'Size: A4',
  'Quantity: 4',
  'Unit Price: ₹60',
  'Total: ₹240',
  '',
  'Grand Total: ₹240',
  '',
  'Please confirm my order.'
].join('\n');

assert.strictEqual(msg2.trim(), expectedMsg2.trim(), 'Four A4 posters message matches exact spec example');
console.log('✅ PASS: 4 A4 Posters order message matches exact prompt specification');

// TEST 4: A4 Combo (3 Posters for ₹150) & Custom A4 Set
console.log('\n--- TEST 4: A4 Combo & Custom Posters Message ---');
const comboOrder = {
  items: [{
    id: 'combo1',
    title: 'Minimalist Architecture Set',
    size: 'A4',
    quantity: 3,
    isCombo: true,
    comboText: '3 posters',
    total: 150
  }],
  grandTotal: 150
};
const comboMsg = buildWhatsAppOrderMessage(comboOrder);
assert(comboMsg.includes('Combo: 3 posters'), 'Contains Combo: 3 posters text');
assert(comboMsg.includes('Total: ₹150'), 'Contains Total: ₹150');

const customOrder = {
  items: [{
    title: 'Custom Poster Set (8 Prints)',
    size: 'A4',
    isCustom: true,
    customText: '8 posters',
    quantity: 1,
    unitPrice: 350,
    total: 350
  }],
  grandTotal: 350
};
const customMsg = buildWhatsAppOrderMessage(customOrder);
assert(customMsg.includes('Custom: 8 posters'), 'Contains Custom: 8 posters text');
assert(customMsg.includes('Grand Total: ₹350'), 'Contains Grand Total: ₹350');
console.log('✅ PASS: Combo & Custom selection messages formatted accurately');

// TEST 5: Cart with Multiple Items (Exact Specification Match)
console.log('\n--- TEST 5: Multi-Item Cart Order Message ---');
const multiCartOrder = {
  items: [
    { title: 'Peter Parker', size: 'A4', quantity: 2, unitPrice: 60, total: 120 },
    { title: 'Messi Inter Miami', size: 'A6', quantity: 1, unitPrice: 25, total: 25 },
    { title: 'John Wick', size: 'A4', quantity: 1, unitPrice: 60, total: 60 }
  ],
  grandTotal: 205
};
const cartMsg = buildWhatsAppOrderMessage(multiCartOrder);
const expectedCartMsg = [
  'Hello PINBOARD! 👋',
  '',
  'I want to order:',
  '',
  '1. Peter Parker',
  'Size: A4',
  'Quantity: 2',
  'Unit Price: ₹60',
  'Total: ₹120',
  '',
  '2. Messi Inter Miami',
  'Size: A6',
  'Quantity: 1',
  'Unit Price: ₹25',
  'Total: ₹25',
  '',
  '3. John Wick',
  'Size: A4',
  'Quantity: 1',
  'Unit Price: ₹60',
  'Total: ₹60',
  '',
  'Grand Total: ₹205',
  '',
  'Please confirm my order.'
].join('\n');

assert.strictEqual(cartMsg.trim(), expectedCartMsg.trim(), 'Multi-item cart message matches exact spec');
console.log('✅ PASS: Cart multi-item order message matches exact prompt specification');

// TEST 6: URL Encoding & Single Recipient URL Generation
console.log('\n--- TEST 6: URL Encoding & Single Recipient Handoff ---');
const url1 = buildWhatsAppOrderUrl(WHATSAPP_ORDER_NUMBER, multiCartOrder);
assert(url1.startsWith('https://wa.me/919342302872?text='), 'URL targets 919342302872');

const urlObj1 = new URL(url1);
const query1 = urlObj1.searchParams.get('text');
assert.strictEqual(query1, cartMsg, 'URL contains exact decoded order message');
console.log('✅ PASS: URL correctly generated with encoded order message for single destination 919342302872');

// TEST 7: Duplicate Prevention via Item Deduplication
console.log('\n--- TEST 7: Duplicate Prevention ---');
const duplicateInput = [
  { id: 10, title: 'Batman Dark Knight', size: 'A4', quantity: 1, unitPrice: 60, total: 60 },
  { id: 10, title: 'Batman Dark Knight', size: 'A4', quantity: 1, unitPrice: 60, total: 60 },
  { id: 10, title: 'Batman Dark Knight', size: 'A4', quantity: 2, unitPrice: 60, total: 120 }
];
const deduplicated = deduplicateOrderItems(duplicateInput);
assert.strictEqual(deduplicated.length, 1, 'Duplicate product entries merged into 1 item');
assert.strictEqual(deduplicated[0].quantity, 4, 'Quantities merged to 4');
assert.strictEqual(deduplicated[0].total, 240, 'Total updated to 240');

const dedupMsg = buildWhatsAppOrderMessage({ items: duplicateInput });
assert.strictEqual((dedupMsg.match(/Batman Dark Knight/g) || []).length, 1, 'Batman Dark Knight appears only ONCE in output message');
console.log('✅ PASS: Duplicate items successfully merged into single item line with total quantity');

// TEST 8: Special Characters, Emojis, Tamil & Unicode Support
console.log('\n--- TEST 8: Unicode, Emojis & Special Character Handling ---');
const unicodeOrder = {
  items: [{
    id: 99,
    title: 'அழகான ஓவியம் & Art / Poster #1 (Special & Special Edition?)',
    size: 'A4',
    quantity: 1,
    unitPrice: 60,
    total: 60
  }],
  grandTotal: 60
};
const uniUrl = buildWhatsAppOrderUrl(WHATSAPP_ORDER_NUMBER, unicodeOrder);
const decodedUni = decodeURIComponent(new URL(uniUrl).searchParams.get('text'));
assert(decodedUni.includes('அழகான ஓவியம்'), 'Tamil text preserved in decoded URL');
assert(decodedUni.includes('Art / Poster #1'), 'Slashes and hashes preserved');
assert(decodedUni.includes('(Special & Special Edition?)'), 'Ampersands and question marks preserved');
console.log('✅ PASS: Tamil, Unicode, Emojis and special characters safely encoded');

// TEST 9: Empty Cart & Invalid Config Safety
console.log('\n--- TEST 9: Empty Cart & Invalid Config Safety ---');
assert.strictEqual(openWhatsAppOrder(null), false, 'Returns false for null orderData');
assert.strictEqual(openWhatsAppOrder({ items: [] }), false, 'Returns false for empty items array');
assert.strictEqual(buildWhatsAppOrderUrl('', 'Test'), '', 'Returns empty string for blank phone number');
console.log('✅ PASS: Empty cart and invalid inputs handled safely without errors');

// TEST 10: openWhatsAppOrder Handoff Function
console.log('\n--- TEST 10: openWhatsAppOrder Function Execution ---');
assert.strictEqual(typeof openWhatsAppOrder, 'function', 'openWhatsAppOrder is defined as a function');
assert.strictEqual(typeof openWhatsAppOrderForAllRecipients, 'function', 'openWhatsAppOrderForAllRecipients alias is defined');
const res = openWhatsAppOrder(singleA4Order);
assert.strictEqual(res, true, 'openWhatsAppOrder returns true for valid orderData');
console.log('✅ PASS: openWhatsAppOrder executes cleanly for single recipient 919342302872');

console.log('\n🎉 ALL 10 WHATSAPP TEST SUITE SCENARIOS PASSED WITH ZERO ERRORS!');

