const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const {
  getOrders,
  createOrder,
  getOrderById
} = require('../controllers/orderController');

router.use(optionalAuth);

router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);

module.exports = router;
