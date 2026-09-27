/**
 * =========================================================================
 * PINBOARD — Centralized WhatsApp Order Integration Module
 * Single Source of Truth for WhatsApp Click-to-Chat Single-Recipient Order Handoff
 * =========================================================================
 */

(function (window, document) {
  'use strict';

  // 1. CENTRALIZED WHATSAPP DESTINATION NUMBER
  // Formatted strictly as digits without +, spaces, brackets, or dashes
  const WHATSAPP_ORDER_NUMBER = "919342302872";
  const WHATSAPP_ORDER_NUMBERS = [WHATSAPP_ORDER_NUMBER];

  // Click Debounce Lock to prevent double-click issues
  let isProcessingWhatsAppClick = false;

  /**
   * Helper to clean phone numbers into strict international digits
   * @param {string} phone 
   * @returns {string}
   */
  function sanitizePhoneNumber(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '');
  }

  /**
   * Deduplicates line items by canonical product identity (id/productId + size + isCustom)
   * Merges quantities and recalculates line totals to prevent duplicate entries.
   * @param {Array} items 
   * @returns {Array}
   */
  function deduplicateOrderItems(items) {
    if (!Array.isArray(items)) return [];

    const map = new Map();

    items.forEach(function (item) {
      if (!item) return;

      const rawId = item.id || item.productId || item.title || 'poster';
      const sizeKey = (item.size || 'A4').toUpperCase();
      const isCustomKey = item.isCustom ? 'custom' : 'standard';
      const key = `${rawId}_${sizeKey}_${isCustomKey}`;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.unitPrice) || Number(item.price) || (sizeKey === 'A6' ? 25 : 60);

      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity += qty;
        existing.total = existing.quantity * existing.unitPrice;
      } else {
        const copy = Object.assign({}, item, {
          title: item.title || 'Premium Art Poster',
          size: sizeKey,
          quantity: qty,
          unitPrice: unitPrice,
          total: Number(item.total) || (qty * unitPrice)
        });
        map.set(key, copy);
      }
    });

    return Array.from(map.values());
  }

  /**
   * Build clean, structured plain text WhatsApp Order Message
   * @param {Object} orderData 
   * @returns {string}
   */
  function buildWhatsAppOrderMessage(orderData) {
    if (!orderData) return '';

    const rawItems = Array.isArray(orderData.items) ? orderData.items : (orderData ? [orderData] : []);
    const items = deduplicateOrderItems(rawItems);

    if (items.length === 0) return '';

    let messageLines = [
      'Hello PINBOARD! 👋',
      '',
      'I want to order:',
      ''
    ];

    let calculatedGrandTotal = 0;

    items.forEach(function (item, index) {
      const itemNum = index + 1;
      const title = item.title || 'Premium Art Poster';
      const size = (item.size || 'A4').toUpperCase();
      const qty = item.quantity || 1;
      const unitPrice = item.unitPrice || (size === 'A6' ? 25 : 60);
      const lineTotal = item.total !== undefined ? Number(item.total) : (qty * unitPrice);

      calculatedGrandTotal += lineTotal;

      messageLines.push(`${itemNum}. ${title}`);
      messageLines.push(`Size: ${size}`);

      if (item.comboText) {
        messageLines.push(`Combo: ${item.comboText}`);
      } else if (item.isCombo) {
        messageLines.push(`Combo: ${qty} poster${qty > 1 ? 's' : ''}`);
      } else if (item.customText) {
        messageLines.push(`Custom: ${item.customText}`);
      } else if (item.isCustom) {
        messageLines.push(`Custom: ${qty} poster${qty > 1 ? 's' : ''}`);
      } else {
        messageLines.push(`Quantity: ${qty}`);
        messageLines.push(`Unit Price: ₹${unitPrice}`);
      }

      messageLines.push(`Total: ₹${lineTotal}`);
      messageLines.push('');
    });

    const finalGrandTotal = (orderData.grandTotal !== undefined && !isNaN(Number(orderData.grandTotal)))
      ? Number(orderData.grandTotal)
      : calculatedGrandTotal;

    messageLines.push(`Grand Total: ₹${finalGrandTotal}`);
    messageLines.push('');

    const cust = orderData.customer || orderData.customerDetails;
    if (cust && typeof cust === 'object') {
      const name = cust.name || cust.fullName;
      const phone = cust.phone || cust.phoneNumber;
      const address = cust.address || cust.deliveryAddress;
      const city = cust.city;
      const state = cust.state;
      const pincode = cust.pincode || cust.pinCode;
      const notes = cust.notes || cust.orderNotes;

      if (name || cust.email || phone || address || city || state || pincode || notes) {
        messageLines.push('Customer Details:');
        if (name) messageLines.push(`Name: ${name}`);
        if (cust.email) messageLines.push(`Email: ${cust.email}`);
        if (phone) messageLines.push(`Phone: ${phone}`);
        if (address) messageLines.push(`Address: ${address}`);
        if (city) messageLines.push(`City: ${city}`);
        if (state) messageLines.push(`State: ${state}`);
        if (pincode) messageLines.push(`PIN Code: ${pincode}`);
        if (notes) messageLines.push(`Notes: ${notes}`);
        messageLines.push('');
      }
    }

    messageLines.push('Please confirm my order.');

    return messageLines.join('\n');
  }

  /**
   * Constructs a safe, URL-encoded WhatsApp Click-to-Chat URL
   * @param {string} phoneNumber 
   * @param {string|Object} messageOrOrderData 
   * @returns {string}
   */
  function buildWhatsAppOrderUrl(phoneNumber, messageOrOrderData) {
    const phoneToSanitize = (phoneNumber === undefined || phoneNumber === null) ? WHATSAPP_ORDER_NUMBER : phoneNumber;
    const cleanedPhone = sanitizePhoneNumber(phoneToSanitize);
    if (!cleanedPhone) return '';

    let textMessage = '';
    if (typeof messageOrOrderData === 'string') {
      textMessage = messageOrOrderData;
    } else if (typeof messageOrOrderData === 'object') {
      textMessage = buildWhatsAppOrderMessage(messageOrOrderData);
    }

    if (!textMessage) return '';

    const encodedMessage = encodeURIComponent(textMessage);
    return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  }

  /**
   * Main function to trigger the WhatsApp Order Flow for single destination number 919342302872
   * @param {Object} orderData 
   * @returns {boolean}
   */
  function openWhatsAppOrder(orderData) {
    if (isProcessingWhatsAppClick) return false;

    if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      if (typeof alert === 'function') {
        alert("Your order is empty. Please select a poster before proceeding.");
      }
      return false;
    }

    isProcessingWhatsAppClick = true;
    setTimeout(function () {
      isProcessingWhatsAppClick = false;
    }, 1500);

    const message = buildWhatsAppOrderMessage(orderData);
    if (!message) {
      isProcessingWhatsAppClick = false;
      return false;
    }

    const whatsappUrl = buildWhatsAppOrderUrl(WHATSAPP_ORDER_NUMBER, message);
    if (!whatsappUrl) {
      console.error("Failed to generate WhatsApp order URL.");
      isProcessingWhatsAppClick = false;
      return false;
    }

    let win = null;
    try {
      win = window.open(whatsappUrl, '_blank');
    } catch (e) {
      win = null;
    }

    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }

    return true;
  }

  // Alias for backward compatibility
  function openWhatsAppOrderForAllRecipients(orderData) {
    return openWhatsAppOrder(orderData);
  }

  // EXPORT TO GLOBAL WINDOW SCOPE & COMMONJS FOR TESTING
  const PinboardWhatsApp = {
    WHATSAPP_ORDER_NUMBER: WHATSAPP_ORDER_NUMBER,
    WHATSAPP_ORDER_NUMBERS: WHATSAPP_ORDER_NUMBERS,
    buildWhatsAppOrderMessage: buildWhatsAppOrderMessage,
    buildWhatsAppOrderUrl: buildWhatsAppOrderUrl,
    openWhatsAppOrder: openWhatsAppOrder,
    openWhatsAppOrderForAllRecipients: openWhatsAppOrderForAllRecipients,
    deduplicateOrderItems: deduplicateOrderItems
  };

  if (typeof window !== 'undefined') {
    window.WHATSAPP_ORDER_NUMBER = WHATSAPP_ORDER_NUMBER;
    window.WHATSAPP_ORDER_NUMBERS = WHATSAPP_ORDER_NUMBERS;
    window.buildWhatsAppOrderMessage = buildWhatsAppOrderMessage;
    window.buildWhatsAppOrderUrl = buildWhatsAppOrderUrl;
    window.openWhatsAppOrder = openWhatsAppOrder;
    window.openWhatsAppOrderForAllRecipients = openWhatsAppOrderForAllRecipients;
    window.PinboardWhatsApp = PinboardWhatsApp;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PinboardWhatsApp;
  }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});

