"use strict";

const { q, qAll, qRun } = require('../database');

const getWishlist = (req, res) => {
  try {
    const rows = qAll(
      'SELECT p.* FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('Get wishlist error:', e);
    res.status(500).json({ error: e.message });
  }
};

const toggleWishlist = (req, res) => {
  try {
    const exists = q('SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.id]);
    if (exists) {
      qRun('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.id]);
    } else {
      qRun('INSERT OR IGNORE INTO wishlist(user_id, product_id) VALUES(?, ?)', [req.user.id, req.params.id]);
    }
    res.json({ ok: true, added: !exists });
  } catch (e) {
    console.error('Toggle wishlist error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist
};
