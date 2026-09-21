"use strict";

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

router.get('/reviews/:id', reviewController.getReviews);
router.post('/reviews/:id', auth, reviewController.addReview);

module.exports = router;
