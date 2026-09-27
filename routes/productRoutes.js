const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductReviews,
  addProductReview,
  createProduct
} = require('../controllers/productController');

// Search endpoint (defined before /:id to prevent route shadowing)
router.get('/search', searchProducts);

// List all products / create product
router.get('/', getAllProducts);
router.post('/', createProduct);

// Reviews endpoints (defined before /:id)
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', addProductReview);

// Get single product by id or slug
router.get('/:id', getProductById);

module.exports = router;

