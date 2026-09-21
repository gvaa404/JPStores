"use strict";

const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { auth, admin } = require('../middleware/auth');

router.post('/support', supportController.createTicket);
router.get('/admin/support', auth, admin, supportController.getTickets);

module.exports = router;
