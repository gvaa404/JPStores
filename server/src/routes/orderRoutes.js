"use strict";

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

router.post('/orders', auth, orderController.createOrder);
router.get('/orders', auth, orderController.getOrders);
router.get('/orders/:id', auth, orderController.getOrderById);
router.put('/orders/:id/status', auth, admin, orderController.updateOrderStatus);
router.put('/orders/:id/cancel', auth, orderController.cancelOrder);

module.exports = router;
