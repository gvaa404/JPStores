"use strict";

const jwt = require('jsonwebtoken');
const config = require('../config');
const { q } = require('../database');

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!rawToken) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const decoded = jwt.verify(rawToken, config.jwtSecret);
    req.user = q('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!req.user || req.user.status === 'blocked') {
      return res.status(401).json({ error: 'Unauthorized: Invalid user or blocked' });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

function admin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

module.exports = {
  generateToken,
  token: generateToken,
  auth,
  admin
};
