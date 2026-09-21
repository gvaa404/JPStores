"use strict";

const { q, qAll, qRun, transaction } = require('../database');
const { sendOrderConfirmationAndInvoiceEmail } = require('../services/emailService');

const createOrder = (req, res) => {
  try {
    const { items, address, payment_method = 'Razorpay', payment_status = 'Paid' } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    let addressStr = '';
    if (typeof address === 'object' && address !== null) {
      const parts = [];
      if (address.name) parts.push(address.name + (address.phone ? ` (Phone: ${address.phone})` : ''));
      if (address.flat) parts.push(address.flat);
      if (address.area) parts.push(address.area);
      if (address.landmark) parts.push(`Landmark: ${address.landmark}`);
      const cityState = [address.city, address.state].filter(Boolean).join(', ');
      const pin = address.pincode ? ` - ${address.pincode}` : '';
      if (cityState || pin) parts.push(`${cityState}${pin}`);
      if (address.type) parts.push(`Type: ${address.type}`);
      addressStr = parts.join('\n');
    } else {
      addressStr = String(address || '').trim();
    }

    if (!addressStr) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    const tx = transaction(() => {
      let total = 0;
      const rows = [];
      for (const i of items) {
        const p = q('SELECT * FROM products WHERE id = ?', [i.product_id]);
        if (!p || p.status !== 'active') {
          throw new Error(`Product "${p ? p.name : i.product_id}" is currently unavailable`);
        }
        if (p.stock < i.quantity) {
          throw new Error(`Insufficient stock for "${p.name}". Only ${p.stock} available.`);
        }
        const effectivePrice = p.price * (1 - (p.discount || 0) / 100);
        total += effectivePrice * i.quantity;
        rows.push({ p, qty: i.quantity, price: effectivePrice });
      }

      const o = qRun(
        'INSERT INTO orders(user_id, total, address, payment_method, payment_status, status) VALUES(?, ?, ?, ?, ?, ?)',
        [req.user.id, total, addressStr, payment_method, payment_status, 'Ordered']
      );

      for (const r of rows) {
        qRun(
          'INSERT INTO order_items(order_id, product_id, quantity, price) VALUES(?, ?, ?, ?)',
          [o.lastInsertRowid, r.p.id, r.qty, r.price]
        );
        qRun('UPDATE products SET stock = stock - ? WHERE id = ?', [r.qty, r.p.id]);
      }
      return { orderId: o.lastInsertRowid, total, rows };
    });

    const { orderId, total, rows } = tx();

    // Asynchronously dispatch Order Confirmation & Invoice email
    const createdOrder = q('SELECT * FROM orders WHERE id = ?', [orderId]);
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    sendOrderConfirmationAndInvoiceEmail({
      to: req.user.email,
      name: req.user.name,
      order: createdOrder,
      items: rows.map(r => ({
        name: r.p.name,
        price: r.price,
        quantity: r.qty
      })),
      settings
    }).catch(err => console.error('[Order] Invoice email dispatch error:', err.message));

    res.json({ orderId, total });
  } catch (e) {
    console.error('Create order error:', e);
    res.status(400).json({ error: e.message });
  }
};

const getOrders = (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const where = isAdmin ? '' : 'WHERE o.user_id = ?';
    const args = isAdmin ? [] : [req.user.id];

    const rows = qAll(
      `SELECT o.*, u.name AS customer_name, u.email 
       FROM orders o 
       JOIN users u ON u.id = o.user_id 
       ${where} 
       ORDER BY o.id DESC`,
      args
    );

    for (const o of rows) {
      o.items = qAll(
        `SELECT oi.*, COALESCE(p.name, 'Deleted Product') AS name, COALESCE(p.image, '') AS image 
         FROM order_items oi 
         LEFT JOIN products p ON p.id = oi.product_id 
         WHERE oi.order_id = ?`,
        [o.id]
      );
    }
    res.json(rows);
  } catch (e) {
    console.error('Get orders error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getOrderById = (req, res) => {
  try {
    const o = q(
      `SELECT o.*, u.name AS customer_name, u.email 
       FROM orders o 
       JOIN users u ON u.id = o.user_id 
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (!o) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (req.user.role !== 'admin' && o.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this order' });
    }
    o.items = qAll(
      `SELECT oi.*, COALESCE(p.name, 'Deleted Product') AS name, COALESCE(p.image, '') AS image 
       FROM order_items oi 
       LEFT JOIN products p ON p.id = oi.product_id 
       WHERE oi.order_id = ?`,
      [o.id]
    );
    res.json(o);
  } catch (e) {
    console.error('Get single order error:', e);
    res.status(500).json({ error: e.message });
  }
};

const updateOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    qRun('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Update order status error:', e);
    res.status(500).json({ error: e.message });
  }
};

const cancelOrder = (req, res) => {
  try {
    const o = q('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!o || (req.user.role !== 'admin' && o.user_id !== req.user.id)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    qRun(
      'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
      ['Cancelled', 'Refund pending', o.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('Cancel order error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};
