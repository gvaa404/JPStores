"use strict";

const express = require('express');
const router = express.Router();
const geocodeController = require('../controllers/geocodeController');
const { geocodeLimiter } = require('../middleware/rateLimiter');

router.get('/geocode/reverse', geocodeLimiter, geocodeController.reverseGeocode);
router.get('/geocode/pincode/:pincode', geocodeLimiter, geocodeController.lookupPincode);

module.exports = router;
