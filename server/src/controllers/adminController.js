"use strict";

const { q, qAll, qRun } = require('../database');

const getDashboard = (req, res) => {
  try {
    const orders = q('SELECT COUNT(*) AS c FROM orders')?.c || 0;
    const sales = q('SELECT COALESCE(SUM(total), 0) AS c FROM orders WHERE payment_status = ?', ['Paid'])?.c || 0;
    const products = q('SELECT COUNT(*) AS c FROM products')?.c || 0;
    const customers = q('SELECT COUNT(*) AS c FROM users WHERE role = ?', ['customer'])?.c || 0;
    const pending = q('SELECT COUNT(*) AS c FROM orders WHERE status IN (?, ?)', ['Ordered', 'Processing'])?.c || 0;
    const lowStock = q('SELECT COUNT(*) AS c FROM products WHERE stock <= ?', [5])?.c || 0;
    const cancelled = q('SELECT COUNT(*) AS c FROM orders WHERE status IN (?, ?)', ['Cancelled', 'Returned'])?.c || 0;
    const recent = qAll(
      `SELECT o.*, u.name AS customer_name, u.email 
       FROM orders o 
       JOIN users u ON u.id = o.user_id 
       ORDER BY o.id DESC 
       LIMIT 8`
    );

    res.json({
      orders,
      sales,
      revenue: sales,   // Bug 2 fix: frontend accesses metrics.revenue
      products,
      customers,
      pending,
      lowStock,
      cancelled,
      recent
    });
  } catch (e) {
    console.error('Admin dashboard error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getCustomers = (req, res) => {
  try {
    const rows = qAll(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.is_verified, u.created_at,
              COUNT(o.id) AS orders,
              COALESCE(SUM(o.total), 0) AS spending
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.role = ?
       GROUP BY u.id
       ORDER BY u.id DESC`,
      ['customer']
    );
    res.json(rows);
  } catch (e) {
    console.error('Admin customers error:', e);
    res.status(500).json({ error: e.message });
  }
};

const updateCustomerStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: "Valid status ('active' or 'blocked') is required" });
    }
    qRun('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Update customer status error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getPayments = (req, res) => {
  try {
    const rows = qAll(
      `SELECT o.id, o.total, o.payment_method, o.payment_status, o.created_at,
              u.name, u.email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('Admin payments error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getDashboard,
  getCustomers,
  updateCustomerStatus,
  getPayments
};
