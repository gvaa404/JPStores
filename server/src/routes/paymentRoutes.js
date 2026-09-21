"use strict";

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, admin } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

router.get('/payment/config', paymentController.getPaymentConfig);
router.post('/payment/create-order', auth, paymentLimiter, paymentController.createPaymentOrder);
router.post('/payment/verify', auth, paymentLimiter, paymentController.verifyPayment);
router.post('/admin/test-razorpay', auth, admin, paymentController.testRazorpay);

module.exports = router;
