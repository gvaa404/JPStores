const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Helper to get active credentials from environment or settings row
function getEmailConfig(settings = {}) {
  return {
    resendApiKey: process.env.RESEND_API_KEY || settings.resend_api_key || '',
    emailFrom: process.env.EMAIL_FROM || settings.email_from || 'JP Store <onboarding@resend.dev>',
    gmailUser: process.env.GMAIL_USER || settings.gmail_user || '',
    gmailPass: process.env.GMAIL_APP_PASSWORD || settings.gmail_pass || '',
    appUrl: process.env.APP_URL || 'http://localhost:5173'
  };
}

/**
 * Core email sender with Resend as primary and Gmail SMTP as fallback.
 */
async function sendEmail({ to, subject, html, text, settings = {} }) {
  const config = getEmailConfig(settings);
  let resendError = null;

  // 1. Attempt sending via Resend
  if (config.resendApiKey && config.resendApiKey.trim()) {
    try {
      const resend = new Resend(config.resendApiKey.trim());
      const data = await resend.emails.send({
        from: config.emailFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || ''
      });
      if (data && data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }
      console.log(`[Mailer] Successfully delivered via Resend to ${to} (ID: ${data?.id || data?.data?.id})`);
      return { success: true, provider: 'resend', id: data?.id || data?.data?.id };
    } catch (err) {
      resendError = err;
      console.warn(`[Mailer] Resend delivery failed (${err.message}). Falling back to Gmail SMTP...`);
    }
  } else {
    console.log('[Mailer] Resend API Key not configured. Trying Gmail SMTP fallback...');
  }

  // 2. Attempt sending via Gmail SMTP fallback
  if (config.gmailUser && config.gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.gmailUser.trim(),
          pass: config.gmailPass.trim().replace(/\s+/g, '') // remove spaces from 16-character app password
        }
      });

      const info = await transporter.sendMail({
        from: `"${settings.store_name || 'JP Store'}" <${config.gmailUser.trim()}>`,
        to,
        subject,
        html,
        text: text || ''
      });

      console.log(`[Mailer] Successfully delivered via Gmail SMTP fallback to ${to} (MessageID: ${info.messageId})`);
      return { success: true, provider: 'gmail_smtp', id: info.messageId };
    } catch (smtpErr) {
      console.error(`[Mailer] Gmail SMTP fallback delivery failed: ${smtpErr.message}`);
      return {
        success: false,
        resendError: resendError?.message,
        smtpError: smtpErr.message,
        message: 'Both Resend and Gmail SMTP failed'
      };
    }
  }

  // 3. Neither provider configured
  const notice = '[Mailer Notice] Neither Resend API Key nor Gmail credentials are fully configured. Email was not dispatched across the wire, but content was generated successfully.';
  console.log(notice);
  return {
    success: false,
    resendError: resendError?.message,
    notice,
    simulated: true
  };
}

/**
 * Account Verification Email
 */
async function sendAccountVerificationEmail({ to, name, token, settings = {} }) {
  const config = getEmailConfig(settings);
  const verifyUrl = `${config.appUrl}/verify?token=${encodeURIComponent(token)}`;

  const subject = `Verify Your JP Store Account - Welcome, ${name || 'Friend'}!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fffdfd; color: #292727; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #ffffff; border: 1px solid #ead6d4; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(201,135,135,0.08); }
        .header { background: #f8e9e8; padding: 32px 24px; text-align: center; border-bottom: 1px solid #ead6d4; }
        .header h1 { font-family: Georgia, serif; color: #c98787; margin: 0 0 8px; font-size: 28px; }
        .header p { margin: 0; color: #7d7474; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 36px 30px; font-size: 15px; line-height: 1.7; color: #3d3a3a; }
        .btn { display: inline-block; background: #c98787; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 600; margin: 24px 0; }
        .link-text { word-break: break-all; font-size: 13px; color: #9c6c6c; }
        .footer { background: #faf5f5; padding: 20px; text-align: center; font-size: 12px; color: #8c8282; border-top: 1px solid #f0e3e2; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JP Store</h1>
          <p>Fancy finds, pretty vibes</p>
        </div>
        <div class="content">
          <h2>Welcome to JP Store, ${name || 'there'}! ♡</h2>
          <p>Thank you for joining our community of fancy stationery and aesthetic lifestyle lovers. Please verify your email address to ensure your orders, notifications, and invoices reach you securely.</p>
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="btn">Verify My Account</a>
          </div>
          <p>Or copy and paste this verification link into your browser:</p>
          <p class="link-text">${verifyUrl}</p>
          <p style="margin-top: 30px; font-size: 13px; color: #7d7474;">If you did not register for a JP Store account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${settings.store_name || 'JP Store'}. All rights reserved.<br/>
          ${settings.email || 'hello@jpstore.com'} · ${settings.phone || '+91 98765 43210'}
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Welcome to JP Store! Please verify your account by visiting: ${verifyUrl}`,
    settings
  });
}

/**
 * Order Confirmation & Invoice Email
 */
async function sendOrderConfirmationAndInvoiceEmail({ to, name, order, items = [], settings = {} }) {
  const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const shipping = Number(settings.shipping) || 49;
  const taxRate = Number(settings.tax) || 0;
  const grandTotal = Number(order.total) || subtotal;

  const subject = `Order Confirmed & Invoice #${order.id} - ${settings.store_name || 'JP Store'}`;

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f0e3e2; font-size: 14px;">
        <strong>${item.name || 'Stationery Item'}</strong>
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f0e3e2; text-align: center; font-size: 14px;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f0e3e2; text-align: right; font-size: 14px;">
        ₹${Number(item.price || 0).toFixed(0)}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f0e3e2; text-align: right; font-size: 14px; font-weight: bold;">
        ₹${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fffdfd; color: #292727; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 30px auto; background: #ffffff; border: 1px solid #ead6d4; border-radius: 8px; overflow: hidden; }
        .header { background: #f8e9e8; padding: 28px; display: flex; justify-content: space-between; border-bottom: 1px solid #ead6d4; }
        .brand { font-family: Georgia, serif; color: #c98787; font-size: 26px; font-weight: bold; }
        .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; font-size: 12px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        .content { padding: 30px; }
        .invoice-meta { display: table; width: 100%; margin-bottom: 24px; font-size: 13px; color: #666; }
        .meta-col { display: table-cell; vertical-align: top; width: 50%; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { text-align: left; padding: 10px; background: #faf4f3; font-size: 12px; text-transform: uppercase; color: #8e5f5f; letter-spacing: 1px; }
        .totals { margin-top: 15px; width: 260px; margin-left: auto; font-size: 14px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; }
        .totals-row.grand { font-size: 18px; font-weight: bold; color: #c98787; border-top: 2px solid #ead6d4; border-bottom: 0; padding-top: 10px; margin-top: 6px; }
        .address-box { background: #fdfaf9; border: 1px solid #f0e3e2; padding: 14px; border-radius: 4px; margin-top: 24px; font-size: 13px; }
        .footer { background: #faf5f5; padding: 22px; text-align: center; font-size: 12px; color: #8c8282; border-top: 1px solid #f0e3e2; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="background: #f8e9e8; padding: 25px 30px; border-bottom: 1px solid #ead6d4;">
          <table style="margin: 0;">
            <tr>
              <td>
                <span class="brand">${settings.store_name || 'JP Store'}</span><br/>
                <small style="color: #7d7474; letter-spacing: 1px;">TAX INVOICE & ORDER CONFIRMATION</small>
              </td>
              <td style="text-align: right;">
                <span class="badge">Paid</span><br/>
                <span style="font-size: 14px; font-weight: bold; color: #555;">Order #${order.id}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="content">
          <p style="font-size: 16px; margin-top: 0;">Dear <b>${name || 'Valued Customer'}</b>,</p>
          <p>Thank you for shopping with JP Store! We are thrilled to confirm that your order has been received and is being prepared with loving care.</p>

          <table class="invoice-meta" style="margin: 15px 0 25px;">
            <tr>
              <td class="meta-col">
                <strong>Billed To:</strong><br/>
                ${name || 'Customer'}<br/>
                ${to}<br/>
                ${order.address || 'Address provided at checkout'}
              </td>
              <td class="meta-col" style="text-align: right;">
                <strong>Invoice Date:</strong> ${invoiceDate}<br/>
                <strong>Payment Method:</strong> ${order.payment_method || 'Razorpay'}<br/>
                <strong>Status:</strong> ${order.status || 'Ordered'}
              </td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="text-align: right;">
            <table style="width: 260px; margin-left: auto; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Subtotal:</td>
                <td style="padding: 4px 0; text-align: right;">₹${subtotal.toFixed(0)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Shipping:</td>
                <td style="padding: 4px 0; text-align: right;">${shipping > 0 ? `₹${shipping}` : 'Free'}</td>
              </tr>
              ${taxRate > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #666;">Tax (${taxRate}%):</td>
                <td style="padding: 4px 0; text-align: right;">₹${((subtotal * taxRate) / 100).toFixed(0)}</td>
              </tr>` : ''}
              <tr style="font-size: 18px; font-weight: bold; color: #c98787; border-top: 2px solid #ead6d4;">
                <td style="padding-top: 10px;">Total Paid:</td>
                <td style="padding-top: 10px; text-align: right;">₹${grandTotal.toFixed(0)}</td>
              </tr>
            </table>
          </div>

          <div class="address-box">
            <strong>Shipping Information:</strong><br/>
            ${order.address || 'Standard Delivery'}<br/>
            <em>Estimated delivery: 3–5 business days. You will receive dispatch updates soon!</em>
          </div>
        </div>

        <div class="footer">
          Thank you for choosing <strong>${settings.store_name || 'JP Store'}</strong>! ♡<br/>
          Return Policy: ${settings.return_policy || '7-day easy return policy'}<br/>
          Questions? Reach out to <a href="mailto:${settings.email || 'hello@jpstore.com'}" style="color: #c98787;">${settings.email || 'hello@jpstore.com'}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Order #${order.id} confirmed for ₹${grandTotal.toFixed(0)}. Thank you for shopping with JP Store!`,
    settings
  });
}

module.exports = {
  sendEmail,
  sendAccountVerificationEmail,
  sendOrderConfirmationAndInvoiceEmail
};
