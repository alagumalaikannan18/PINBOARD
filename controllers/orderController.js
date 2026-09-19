const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { getLocalProducts } = require('./productController');
const { getIsConnected } = require('../config/database');
const { sendOwnerNotification, sendCustomerThankYou } = require('../config/mailer');

// In-memory fallback order store
const inMemoryOrders = new Map();

function getMemoryOrders(userId) {
  if (!inMemoryOrders.has(userId)) {
    inMemoryOrders.set(userId, [
      {
        orderId: 'PB-2026-8941',
        userId,
        date: '02 Sep 2026',
        totalAmount: 1399,
        paymentStatus: 'Paid',
        orderStatus: 'In Transit ✈️',
        deliveryEstimate: '08 Sep 2026',
        items: [
          {
            productId: 7,
            title: 'Riso Retro — Set of 3',
            subtitle: 'Retro Collection · 3 Prints',
            quantity: 1,
            price: 1399,
            image: 'New Project 22 [D8D9C72].png'
          }
        ]
      }
    ]);
  }
  return inMemoryOrders.get(userId);
}

// Authoritative Custom Poster Pricing Engine
const CUSTOM_PRICING = {
  sizes: {
    A6: 199,
    A5: 299,
    A4: 399,
    A3: 549
  },
  templates: [5, 8, 10, 12]
};

function calculateVerifiedCustomPrice(item) {
  if (Array.isArray(item.posters) && item.posters.length > 0) {
    let sum = 0;
    item.posters.forEach(p => {
      const sizeKey = (p.size || 'A4').toUpperCase();
      sum += CUSTOM_PRICING.sizes[sizeKey] || CUSTOM_PRICING.sizes.A4;
    });
    return sum > 0 ? sum : 1499;
  }
  const templateCount = parseInt(item.template, 10) || 5;
  return templateCount * CUSTOM_PRICING.sizes.A4;
}

/**
 * GET /api/orders
 * Get orders for the logged-in user
 */
async function getOrders(req, res) {
  try {
    const userId = req.user ? req.user.uid : 'guest';

    if (getIsConnected()) {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    }

    const orders = getMemoryOrders(userId);
    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: err.message
    });
  }
}

/**
 * POST /api/orders
 * Create a new order request with strict server-side price validation and automated email notifications
 */
async function createOrder(req, res) {
  try {
    const userId = req.user ? req.user.uid : (req.body.userId || 'guest');
    const {
      productId,
      quantity = 1,
      size,
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      orderNotes
    } = req.body;

    let orderItems = [];
    let totalAmount = 0;
    const localProducts = getLocalProducts();

    let standardPosterQty = 0;
    let customTotal = 0;

    if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items.map(item => {
        const q = Math.max(1, parseInt(item.quantity, 10) || 1);
        const rawId = item.productId || item.id;
        const isCustom = item.isCustom || String(rawId).startsWith('custom-') || !!item.posters;

        let verifiedPrice = 60;
        let verifiedTitle = item.title;
        let verifiedSubtitle = item.subtitle || 'Premium Poster';
        let verifiedImage = item.image || 'New Project 22 [FA6B4A7].png';
        let verifiedPid = rawId;

        if (isCustom) {
          verifiedPrice = calculateVerifiedCustomPrice(item);
          verifiedTitle = item.title || `Custom Poster Set (${item.template || 5} Prints)`;
          verifiedSubtitle = item.subtitle || 'Personalized Wall Collection';
          verifiedImage = item.coverImage || item.image || 'New Project 22 [FA6B4A7].png';
          customTotal += verifiedPrice * q;
        } else {
          const numId = parseInt(rawId, 10);
          verifiedPid = isNaN(numId) ? rawId : numId;
          const product = localProducts.find(p => p.id === numId || String(p.id) === String(rawId));
          if (product) {
            verifiedPrice = product.salePrice || product.regularPrice || 60;
            verifiedTitle = product.title;
            verifiedSubtitle = product.subtitle || product.category || 'Premium Poster';
            verifiedImage = (product.images && product.images[0]) ? product.images[0] : verifiedImage;
          } else {
            verifiedPrice = 60;
          }
          standardPosterQty += q;
        }

        return {
          productId: verifiedPid,
          title: verifiedTitle,
          subtitle: verifiedSubtitle,
          quantity: q,
          price: verifiedPrice,
          size: item.size || size || 'A4',
          image: verifiedImage,
          isCustom: !!isCustom
        };
      });

      const comboSets = Math.floor(standardPosterQty / 3);
      const comboRem = standardPosterQty % 3;
      totalAmount = (comboSets * 150) + (comboRem * 60) + customTotal;
    } else if (productId) {
      const pid = parseInt(productId, 10);
      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const product = localProducts.find(p => p.id === pid || String(p.id) === String(productId));
      const price = product ? (product.salePrice || product.regularPrice) : 60;
      totalAmount = (Math.floor(qty / 3) * 150) + ((qty % 3) * price);
      orderItems.push({
        productId: isNaN(pid) ? productId : pid,
        title: product ? product.title : `Poster #${productId}`,
        subtitle: product ? (product.subtitle || product.category) : 'Premium Matte Poster',
        quantity: qty,
        size: size || 'A4',
        price,
        image: (product && product.images && product.images[0]) ? product.images[0] : 'New Project 22 [FA6B4A7].png'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Order requires either items array or productId'
      });
    }

    const now = new Date();
    const est = new Date();
    est.setDate(now.getDate() + 4);
    const estFormatted = est.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const orderId = 'PB-2026-' + Math.floor(1000 + Math.random() * 9000);

    const isOrderRequest = Boolean(customerEmail || customerName || req.body.isRequest);
    const initialStatus = isOrderRequest ? 'Pending Confirmation' : 'Confirmed ⚡';
    const initialPayment = isOrderRequest ? 'Pending' : 'Paid';

    const orderData = {
      orderId,
      userId,
      items: orderItems,
      totalAmount,
      paymentStatus: initialPayment,
      orderStatus: initialStatus,
      deliveryEstimate: estFormatted,
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || (req.user ? req.user.email : ''),
      customerPhone: customerPhone || '',
      shippingAddress: shippingAddress || {},
      orderNotes: orderNotes || ''
    };

    if (getIsConnected()) {
      const newOrder = await Order.create(orderData);

      // Clear purchased items from Cart if applicable
      try {
        const cart = await Cart.findOne({ userId });
        if (cart) {
          const purchasedIds = new Set(orderItems.map(i => i.productId));
          cart.items = cart.items.filter(i => !purchasedIds.has(i.productId));
          await cart.save();
        }
      } catch (e) {}

      // Asynchronously trigger automated emails without blocking response
      if (orderData.customerEmail) {
        Promise.allSettled([
          sendOwnerNotification(orderData),
          sendCustomerThankYou(orderData)
        ]).catch(e => console.error('Error firing email notifications:', e));
      }

      return res.status(201).json({
        success: true,
        message: 'Order request submitted successfully',
        data: newOrder
      });
    }

    // Fallback store
    const fallbackOrder = {
      ...orderData,
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: now.toISOString()
    };

    const userOrders = getMemoryOrders(userId);
    userOrders.unshift(fallbackOrder);

    // Asynchronously trigger automated emails
    if (orderData.customerEmail) {
      Promise.allSettled([
        sendOwnerNotification(fallbackOrder),
        sendCustomerThankYou(fallbackOrder)
      ]).catch(e => console.error('Error firing email notifications:', e));
    }

    return res.status(201).json({
      success: true,
      message: 'Order request submitted successfully',
      data: fallbackOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: err.message
    });
  }
}

/**
 * GET /api/orders/:id
 * Get order details by orderId (Strict user isolation)
 */
async function getOrderById(req, res) {
  try {
    const rawId = req.params.id;
    const userId = req.user ? req.user.uid : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view order details'
      });
    }

    if (getIsConnected()) {
      const query = { orderId: rawId, userId };
      const order = await Order.findOne(query).lean();
      if (order) {
        return res.json({ success: true, data: order });
      }
    }

    const localList = getMemoryOrders(userId);
    const found = localList.find(o => o.orderId === rawId && o.userId === userId);
    if (found) {
      return res.json({ success: true, data: found });
    }

    return res.status(404).json({
      success: false,
      message: `Order not found with ID: ${rawId}`
    });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: err.message
    });
  }
}

module.exports = {
  getOrders,
  createOrder,
  getOrderById
};
