"use strict";

const { q, qAll, qRun, transaction } = require('../database');
const { sendOrderConfirmationAndInvoiceEmail } = require('../services/emailService');
const {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpaySignature,
  testRazorpayCredentials
} = require('../services/paymentService');

const getPaymentConfigEndpoint = (req, res) => {
  try {
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    const config = getRazorpayConfig(settings);
    res.json({ keyId: config.keyId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createPaymentOrderEndpoint = async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    const result = await createRazorpayOrder({
      amount: Number(amount),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: { userId: String(req.user.id), userEmail: req.user.email },
      settings
    });
    res.json({ ...result, order_id: result.orderId });
  } catch (e) {
    console.error('Create payment order error:', e);
    res.status(500).json({ error: e.message });
  }
};

// Bug 3 fix: handle orderData to atomically create order, decrement stock, and return order_id
const verifyPaymentEndpoint = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, orderData } = req.body;
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      settings
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Case A: existing order_id provided — just mark it as paid
    if (order_id && !orderData) {
      qRun(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['Paid', 'Ordered', order_id]
      );
      return res.json({ ok: true, order_id, message: 'Payment verified successfully' });
    }

    // Case B: orderData provided — atomically create order, decrement stock, send invoice
    if (orderData) {
      const { items, address, payment_method = 'Razorpay' } = orderData;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Build address string
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
          [req.user.id, total, addressStr, payment_method, 'Paid', 'Ordered']
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

      // Async invoice email
      const createdOrder = q('SELECT * FROM orders WHERE id = ?', [orderId]);
      sendOrderConfirmationAndInvoiceEmail({
        to: req.user.email,
        name: req.user.name,
        order: createdOrder,
        items: rows.map(r => ({ name: r.p.name, price: r.price, quantity: r.qty })),
        settings
      }).catch(err => console.error('[Payment] Invoice email dispatch error:', err.message));

      return res.json({ ok: true, order_id: orderId, message: 'Payment verified and order placed successfully' });
    }

    // Fallback: no order_id or orderData
    res.json({ ok: true, message: 'Payment verified successfully' });
  } catch (e) {
    console.error('Verify payment error:', e);
    res.status(500).json({ error: e.message });
  }
};

const testRazorpayEndpoint = async (req, res) => {
  try {
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    const keyId = req.body.keyId || settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const keySecret = req.body.keySecret || settings.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    const result = await testRazorpayCredentials({ keyId, keySecret });
    res.json(result);
  } catch (e) {
    console.error('Test Razorpay error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getPaymentConfig: getPaymentConfigEndpoint,
  createPaymentOrder: createPaymentOrderEndpoint,
  verifyPayment: verifyPaymentEndpoint,
  testRazorpay: testRazorpayEndpoint
};
