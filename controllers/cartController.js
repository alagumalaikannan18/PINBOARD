const Cart = require('../models/Cart');
const { getProductById, getLocalProducts } = require('./productController');
const { getIsConnected } = require('../config/database');

// In-memory fallback cart store by userId
const inMemoryCarts = new Map();

function getMemoryCart(userId) {
  if (!inMemoryCarts.has(userId)) {
    inMemoryCarts.set(userId, []);
  }
  return inMemoryCarts.get(userId);
}

/**
 * GET /api/cart
 * Retrieve current user's cart
 */
async function getCart(req, res) {
  try {
    const userId = req.user ? req.user.uid : 'guest';

    if (getIsConnected()) {
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = await Cart.create({ userId, items: [] });
      }
      return res.json({
        success: true,
        userId,
        count: cart.items.length,
        items: cart.items
      });
    }

    // Fallback store
    const items = getMemoryCart(userId);
    return res.json({
      success: true,
      userId,
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Error in getCart:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: err.message
    });
  }
}

/**
 * POST /api/cart
 * Add an item to cart (Strict duplicate prevention)
 */
async function addToCart(req, res) {
  try {
    const userId = req.user ? req.user.uid : (req.body.userId || 'guest');
    const { productId, quantity = 1, title, price, image } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    const pid = parseInt(productId, 10);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // Look up product metadata authoritatively from catalog
    const local = getLocalProducts();
    const isCustom = req.body.isCustom || String(productId).startsWith('custom-');
    let itemTitle = title;
    let itemPrice = 60;
    let itemImage = image || 'New Project 22 [FA6B4A7].png';

    if (isCustom) {
      itemTitle = title || 'Custom Poster Set';
      if (Array.isArray(req.body.posters) && req.body.posters.length > 0) {
        const sizeMap = { A6: 199, A5: 299, A4: 399, A3: 549 };
        itemPrice = req.body.posters.reduce((acc, cur) => acc + (sizeMap[(cur.size || 'A4').toUpperCase()] || 399), 0);
      } else {
        itemPrice = Number(price) > 0 ? Number(price) : 1499;
      }
    } else {
      const found = local.find(p => p.id === pid || String(p.id) === String(productId));
      if (found) {
        itemTitle = found.title;
        itemPrice = found.salePrice || found.regularPrice || 60;
        itemImage = (found.images && found.images[0]) ? found.images[0] : itemImage;
      } else {
        itemTitle = itemTitle || `Poster #${pid}`;
        itemPrice = 60;
      }
    }

    if (getIsConnected()) {
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      // Strict duplicate prevention check
      const alreadyExists = cart.items.some(item => item.productId === pid);
      if (alreadyExists) {
        return res.json({
          success: false,
          alreadyInCart: true,
          message: 'Product already in cart. Only one unique item per poster allowed.',
          count: cart.items.length,
          items: cart.items
        });
      }

      cart.items.push({
        productId: pid,
        title: itemTitle,
        quantity: qty,
        price: Number(itemPrice),
        image: itemImage
      });

      await cart.save();

      return res.status(201).json({
        success: true,
        alreadyInCart: false,
        message: 'Product added to cart successfully',
        count: cart.items.length,
        items: cart.items
      });
    }

    // In-memory fallback
    const items = getMemoryCart(userId);
    const existing = items.find(i => i.productId === pid);
    if (existing) {
      return res.json({
        success: false,
        alreadyInCart: true,
        message: 'Product already in cart. Only one unique item per poster allowed.',
        count: items.length,
        items
      });
    }

    items.push({
      productId: pid,
      title: itemTitle,
      quantity: qty,
      price: Number(itemPrice),
      image: itemImage
    });

    return res.status(201).json({
      success: true,
      alreadyInCart: false,
      message: 'Product added to cart successfully',
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Error in addToCart:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: err.message
    });
  }
}

/**
 * PATCH /api/cart/:productId
 * Update quantity of a cart item
 */
async function updateCartItem(req, res) {
  try {
    const userId = req.user ? req.user.uid : 'guest';
    const pid = parseInt(req.params.productId, 10);
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'quantity is required'
      });
    }

    const qty = parseInt(quantity, 10);

    if (getIsConnected()) {
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ success: false, message: 'Cart not found' });
      }

      if (qty <= 0) {
        cart.items = cart.items.filter(i => i.productId !== pid);
      } else {
        const item = cart.items.find(i => i.productId === pid);
        if (item) {
          item.quantity = qty;
        }
      }

      await cart.save();

      return res.json({
        success: true,
        count: cart.items.length,
        items: cart.items
      });
    }

    // In-memory fallback
    let items = getMemoryCart(userId);
    if (qty <= 0) {
      items = items.filter(i => i.productId !== pid);
      inMemoryCarts.set(userId, items);
    } else {
      const item = items.find(i => i.productId === pid);
      if (item) {
        item.quantity = qty;
      }
    }

    return res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Error in updateCartItem:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: err.message
    });
  }
}

/**
 * DELETE /api/cart/:productId
 * Remove a specific product from cart
 */
async function removeFromCart(req, res) {
  try {
    const userId = req.user ? req.user.uid : 'guest';
    const pid = parseInt(req.params.productId, 10);

    if (getIsConnected()) {
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.json({ success: true, count: 0, items: [] });
      }

      cart.items = cart.items.filter(i => i.productId !== pid);
      await cart.save();

      return res.json({
        success: true,
        message: 'Product removed from cart',
        count: cart.items.length,
        items: cart.items
      });
    }

    // In-memory fallback
    let items = getMemoryCart(userId);
    items = items.filter(i => i.productId !== pid);
    inMemoryCarts.set(userId, items);

    return res.json({
      success: true,
      message: 'Product removed from cart',
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Error in removeFromCart:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: err.message
    });
  }
}

/**
 * DELETE /api/cart
 * Clear entire user cart
 */
async function clearCart(req, res) {
  try {
    const userId = req.user ? req.user.uid : 'guest';

    if (getIsConnected()) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
      return res.json({ success: true, message: 'Cart cleared', count: 0, items: [] });
    }

    inMemoryCarts.set(userId, []);
    return res.json({ success: true, message: 'Cart cleared', count: 0, items: [] });
  } catch (err) {
    console.error('Error in clearCart:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: err.message
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
