"use strict";

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

router.get('/admin/dashboard', auth, admin, adminController.getDashboard);
router.get('/admin/metrics', auth, admin, adminController.getDashboard);     // Bug 2 fix: alias for metrics
router.get('/admin/customers', auth, admin, adminController.getCustomers);
router.put('/admin/customers/:id/status', auth, admin, adminController.updateCustomerStatus);
router.get('/admin/payments', auth, admin, adminController.getPayments);
router.get('/admin/orders', auth, admin, orderController.getOrders);         // Bug 1 fix: admin orders

module.exports = router;
