const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// All cart routes support optional/verified auth
router.use(optionalAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
