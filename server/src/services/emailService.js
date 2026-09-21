"use strict";

const mailer = require('../../mailer');

module.exports = {
  sendEmail: mailer.sendEmail,
  sendAccountVerificationEmail: mailer.sendAccountVerificationEmail,
  sendOrderConfirmationAndInvoiceEmail: mailer.sendOrderConfirmationAndInvoiceEmail
};
