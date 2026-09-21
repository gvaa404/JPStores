"use strict";

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// User catalog routes
router.get('/products', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/products/:id', productController.getProductById);

// Admin product management routes
router.get('/admin/products', auth, admin, productController.getAdminProducts);
router.post('/products', auth, admin, upload.single('image'), productController.createProduct);
router.put('/products/:id', auth, admin, upload.single('image'), productController.updateProduct);
router.patch('/admin/products/:id/status', auth, admin, productController.updateProductStatus);
router.put('/admin/products/:id/status', auth, admin, productController.updateProductStatus);
router.delete('/products/:id', auth, admin, productController.deleteProduct);

module.exports = router;
