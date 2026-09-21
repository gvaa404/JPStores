"use strict";

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { q, qRun } = require('../database');
const { generateToken } = require('../middleware/auth');
const { sendAccountVerificationEmail } = require('../services/emailService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  try {
    const { name, email, password, phone = '', address = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPhone = String(phone || '').trim();
    const cleanAddress = typeof address === 'object' ? JSON.stringify(address) : String(address || '').trim();
    const verificationToken = crypto.randomBytes(24).toString('hex');

    const info = qRun(
      'INSERT INTO users(name, email, password, phone, address, is_verified, verification_token) VALUES(?, ?, ?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, bcrypt.hashSync(password, 10), cleanPhone, cleanAddress, 0, verificationToken]
    );
    const u = q('SELECT id, name, email, phone, address, role, is_verified FROM users WHERE id = ?', [info.lastInsertRowid]);

    // Send verification email in the background
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    sendAccountVerificationEmail({
      to: cleanEmail,
      name: cleanName,
      token: verificationToken,
      settings
    }).catch(err => console.error('[Auth] Verification email error:', err.message));

    res.json({ token: generateToken(u), user: u, message: 'Registration successful. Verification email sent!' });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Register error:', e);
    res.status(500).json({ error: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const u = q('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!u || !bcrypt.compareSync(String(password), u.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (u.status === 'blocked') {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    res.json({
      token: generateToken(u),
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: u.role,
        is_verified: u.is_verified || 0
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
};

const verify = async (req, res) => {
  try {
    const { token: verifyToken } = req.query;
    if (!verifyToken || !String(verifyToken).trim()) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    const user = q('SELECT * FROM users WHERE verification_token = ?', [String(verifyToken).trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    qRun('UPDATE users SET is_verified = 1, verification_token = ? WHERE id = ?', ['', user.id]);
    res.json({ ok: true, message: 'Account verified successfully!' });
  } catch (e) {
    console.error('Verify error:', e);
    res.status(500).json({ error: e.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const newToken = crypto.randomBytes(24).toString('hex');
    qRun('UPDATE users SET verification_token = ? WHERE id = ?', [newToken, req.user.id]);
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    sendAccountVerificationEmail({
      to: req.user.email,
      name: req.user.name,
      token: newToken,
      settings
    }).catch(err => console.error('[Auth] Resend verification email error:', err.message));
    res.json({ ok: true, message: 'Verification email sent!' });
  } catch (e) {
    console.error('Resend verification error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getMe = (req, res) => {
  try {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      role: req.user.role,
      is_verified: req.user.is_verified || 0
    });
  } catch (e) {
    console.error('Get me error:', e);
    res.status(500).json({ error: e.message });
  }
};

const updateMe = (req, res) => {
  try {
    const { name, phone = '', address = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    const addressStr = typeof address === 'object' ? JSON.stringify(address) : String(address || '');
    qRun('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name.trim(), String(phone).trim(), addressStr, req.user.id]);
    const updated = q('SELECT id, name, email, phone, address, role, is_verified FROM users WHERE id = ?', [req.user.id]);
    res.json({ ok: true, user: updated });
  } catch (e) {
    console.error('Update me error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  register,
  login,
  verify,
  resendVerification,
  getMe,
  updateMe
};
