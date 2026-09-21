"use strict";

const { q, qAll, qRun, transaction } = require('../database');

const getProducts = (req, res) => {
  try {
    let sql = 'SELECT * FROM products WHERE status = ?';
    const args = ['active'];

    if (req.query.category) {
      sql += ' AND category = ?';
      args.push(req.query.category);
    }
    if (req.query.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const term = `%${req.query.search}%`;
      args.push(term, term);
    }
    sql += ' ORDER BY id DESC';

    const products = qAll(sql, args);
    res.json(products);
  } catch (e) {
    console.error('Get products error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getAdminProducts = (req, res) => {
  try {
    let sql = 'SELECT * FROM products';
    const args = [];

    if (req.query.category) {
      sql += ' WHERE category = ?';
      args.push(req.query.category);
    }
    sql += ' ORDER BY id DESC';

    const products = qAll(sql, args);
    res.json(products);
  } catch (e) {
    console.error('Get admin products error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getProductById = (req, res) => {
  try {
    const p = q('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(p);
  } catch (e) {
    console.error('Get single product error:', e);
    res.status(500).json({ error: e.message });
  }
};

const createProduct = (req, res) => {
  try {
    const {
      name,
      description = '',
      price,
      discount = 0,
      stock = 0,
      category = 'General',
      status = 'active',
      rating = 4.5
    } = req.body;

    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    let image = '';
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    } else if (req.body.image) {
      image = req.body.image;
    }

    const info = qRun(
      'INSERT INTO products(name, description, price, discount, stock, category, image, status, rating) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        description.trim(),
        Number(price) || 0,
        Number(discount) || 0,
        Number(stock) || 0,
        category.trim() || 'General',
        image,
        status === 'inactive' ? 'inactive' : 'active',
        Number(rating) || 4.5
      ]
    );

    const created = q('SELECT * FROM products WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json({ ok: true, id: info.lastInsertRowid, product: created });
  } catch (e) {
    console.error('Create product error:', e);
    res.status(500).json({ error: e.message });
  }
};

const updateProduct = (req, res) => {
  try {
    const old = q('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!old) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const name = req.body.name !== undefined ? req.body.name.trim() : old.name;
    const description = req.body.description !== undefined ? req.body.description.trim() : old.description;
    const price = req.body.price !== undefined ? (Number(req.body.price) || 0) : old.price;
    const discount = req.body.discount !== undefined ? (Number(req.body.discount) || 0) : old.discount;
    const stock = req.body.stock !== undefined ? (Number(req.body.stock) || 0) : old.stock;
    const category = req.body.category !== undefined ? req.body.category.trim() : old.category;
    const status = req.body.status !== undefined ? (req.body.status === 'inactive' ? 'inactive' : 'active') : old.status;

    let image = old.image;
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    } else if (req.body.image !== undefined && req.body.image !== '') {
      image = req.body.image;
    }

    qRun(
      'UPDATE products SET name = ?, description = ?, price = ?, discount = ?, stock = ?, category = ?, status = ?, image = ? WHERE id = ?',
      [name, description, price, discount, stock, category, status, image, req.params.id]
    );

    const updated = q('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ ok: true, product: updated });
  } catch (e) {
    console.error('Update product error:', e);
    res.status(500).json({ error: e.message });
  }
};

const updateProductStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "Valid status ('active' or 'inactive') is required" });
    }
    const old = q('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!old) {
      return res.status(404).json({ error: 'Product not found' });
    }
    qRun('UPDATE products SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true, id: Number(req.params.id), status });
  } catch (e) {
    console.error('Update product status error:', e);
    res.status(500).json({ error: e.message });
  }
};

const deleteProduct = (req, res) => {
  try {
    const p = q('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const tx = transaction(() => {
      qRun('DELETE FROM wishlist WHERE product_id = ?', [req.params.id]);
      qRun('DELETE FROM order_items WHERE product_id = ?', [req.params.id]);
      qRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    });
    tx();
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete product error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getCategories = (req, res) => {
  try {
    const rows = qAll(
      'SELECT DISTINCT category FROM products WHERE status = ? AND category IS NOT NULL AND category != ? ORDER BY category',
      ['active', '']
    );
    res.json(rows.map(x => x.category));
  } catch (e) {
    console.error('Get categories error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getCategories
};
