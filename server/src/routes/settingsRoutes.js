"use strict";

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, admin } = require('../middleware/auth');

router.get('/settings', settingsController.getSettings);
router.put('/settings', auth, admin, settingsController.updateSettings);

module.exports = router;
