"use strict";

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.get('/auth/verify', authController.verify);
router.post('/auth/resend-verification', auth, authLimiter, authController.resendVerification);
router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateMe);

module.exports = router;
