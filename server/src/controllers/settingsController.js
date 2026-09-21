"use strict";

const jwt = require('jsonwebtoken');
const config = require('../config');
const { q, qRun } = require('../database');

const maskSecret = (val) => {
  if (!val) return '';
  return '••••••••';
};

const getSettings = (req, res) => {
  try {
    const s = q('SELECT * FROM settings WHERE id = 1') || {};

    // Check if request is authenticated as admin
    let isAdmin = false;
    const authHeader = req.headers.authorization || '';
    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (rawToken) {
      try {
        const decoded = jwt.verify(rawToken, config.jwtSecret);
        if (decoded && decoded.role === 'admin') {
          isAdmin = true;
        }
      } catch (_) {
        // Token invalid or expired - treat as public
      }
    }

    if (isAdmin) {
      // Authenticated admin receives configuration for dashboard editing
      return res.json(s);
    }

    // Public / unauthenticated callers receive public settings with masked secrets
    res.json({
      id: s.id || 1,
      store_name: s.store_name || 'JP Store',
      email: s.email || '',
      phone: s.phone || '',
      shipping: s.shipping || 0,
      tax: s.tax || 0,
      return_policy: s.return_policy || '',
      privacy_policy: s.privacy_policy || '',
      terms: s.terms || '',
      razorpay_key_id: s.razorpay_key_id || '',
      email_from: s.email_from || '',
      // Mask sensitive credentials
      razorpay_key_secret: maskSecret(s.razorpay_key_secret),
      resend_api_key: maskSecret(s.resend_api_key),
      gmail_user: maskSecret(s.gmail_user),
      gmail_pass: maskSecret(s.gmail_pass)
    });
  } catch (e) {
    console.error('Get settings error:', e);
    res.status(500).json({ error: e.message });
  }
};

const updateSettings = (req, res) => {
  try {
    const s = req.body || {};
    const existing = q('SELECT * FROM settings WHERE id = 1') || {};

    // Do not overwrite existing secrets if submitted as masked bullets
    const isMasked = (val) => typeof val === 'string' && (val.includes('••') || val.includes('**'));

    const razorpay_key_secret = isMasked(s.razorpay_key_secret)
      ? existing.razorpay_key_secret
      : (s.razorpay_key_secret !== undefined ? s.razorpay_key_secret : existing.razorpay_key_secret);

    const resend_api_key = isMasked(s.resend_api_key)
      ? existing.resend_api_key
      : (s.resend_api_key !== undefined ? s.resend_api_key : existing.resend_api_key);

    const gmail_pass = isMasked(s.gmail_pass)
      ? existing.gmail_pass
      : (s.gmail_pass !== undefined ? s.gmail_pass : existing.gmail_pass);

    const gmail_user = isMasked(s.gmail_user)
      ? existing.gmail_user
      : (s.gmail_user !== undefined ? s.gmail_user : existing.gmail_user);

    qRun(
      `UPDATE settings 
       SET store_name = ?, email = ?, phone = ?, shipping = ?, tax = ?, return_policy = ?, privacy_policy = ?, terms = ?,
           razorpay_key_id = ?, razorpay_key_secret = ?, resend_api_key = ?, gmail_user = ?, gmail_pass = ?, email_from = ?
       WHERE id = 1`,
      [
        s.store_name || 'JP Store',
        s.email || '',
        s.phone || '',
        Number(s.shipping) || 0,
        Number(s.tax) || 0,
        s.return_policy || '',
        s.privacy_policy || '',
        s.terms || '',
        s.razorpay_key_id !== undefined ? s.razorpay_key_id : existing.razorpay_key_id,
        razorpay_key_secret || '',
        resend_api_key || '',
        gmail_user || '',
        gmail_pass || '',
        s.email_from || existing.email_from || 'JP Store <onboarding@resend.dev>'
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('Update settings error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
