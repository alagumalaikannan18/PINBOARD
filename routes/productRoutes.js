const express = require('express');
const router = express.Router();
const { getAllProducts, searchProducts, getProductById } = require('../controllers/productController');

// Search endpoint (defined before /:id to prevent route shadowing)
router.get('/search', searchProducts);

// List all products
router.get('/', getAllProducts);

// Get single product by id or slug
router.get('/:id', getProductById);

module.exports = router;
