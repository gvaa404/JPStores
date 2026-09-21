"use strict";

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const adminRoutes = require('./adminRoutes');
const settingsRoutes = require('./settingsRoutes');
const geocodeRoutes = require('./geocodeRoutes');
const reviewRoutes = require('./reviewRoutes');
const supportRoutes = require('./supportRoutes');

router.use(authRoutes);
router.use(productRoutes);
router.use(orderRoutes);
router.use(paymentRoutes);
router.use(wishlistRoutes);
router.use(adminRoutes);
router.use(settingsRoutes);
router.use(geocodeRoutes);
router.use(reviewRoutes);
router.use(supportRoutes);

module.exports = router;
