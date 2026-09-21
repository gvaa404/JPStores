"use strict";

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

router.get('/wishlist', auth, wishlistController.getWishlist);
router.post('/wishlist/:id', auth, wishlistController.toggleWishlist);

module.exports = router;
