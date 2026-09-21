"use strict";

const payment = require('../../payment');

module.exports = {
  getRazorpayConfig: payment.getRazorpayConfig,
  createRazorpayOrder: payment.createRazorpayOrder,
  verifyRazorpaySignature: payment.verifyRazorpaySignature,
  testRazorpayCredentials: payment.testRazorpayCredentials
};
