"use strict";

const path = require('path');
const serverRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(serverRoot, '.env') });

const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'jp-store-change-this-secret',
  serverRoot,
  uploadsDir: path.join(serverRoot, 'uploads'),
  databasePath: path.join(serverRoot, 'jp-store.db'),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || ''
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'JP Store <onboarding@resend.dev>',
    gmailUser: process.env.GMAIL_USER || '',
    gmailPass: process.env.GMAIL_APP_PASSWORD || ''
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173'
};

module.exports = config;