require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Database = require('better-sqlite3');

const {
  sendEmail,
  sendAccountVerificationEmail,
  sendOrderConfirmationAndInvoiceEmail
} = require('./mailer');
const {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpaySignature,
  testRazorpayCredentials
} = require('./payment');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'jp-store-change-this-secret';
const ROOT = __dirname;
const UPLOADS = path.join(ROOT, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS));

// Initialize persistent SQLite Database
const dbPath = path.join(ROOT, 'jp-store.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  status TEXT NOT NULL DEFAULT 'active',
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL,
  discount REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  category TEXT DEFAULT 'General',
  image TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  rating REAL DEFAULT 4.5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'Pending',
  status TEXT DEFAULT 'Ordered',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlist (
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  PRIMARY KEY(user_id, product_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  store_name TEXT DEFAULT 'JP Store',
  email TEXT DEFAULT 'hello@jpstore.com',
  phone TEXT DEFAULT '+91 98765 43210',
  shipping REAL DEFAULT 49,
  tax REAL DEFAULT 0,
  return_policy TEXT DEFAULT '7-day return policy',
  privacy_policy TEXT DEFAULT 'Your privacy matters.',
  terms TEXT DEFAULT 'Standard terms apply.',
  razorpay_key_id TEXT DEFAULT '',
  razorpay_key_secret TEXT DEFAULT '',
  resend_api_key TEXT DEFAULT '',
  gmail_user TEXT DEFAULT '',
  gmail_pass TEXT DEFAULT '',
  email_from TEXT DEFAULT 'JP Store <onboarding@resend.dev>'
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Auto-migration for new columns in users table
const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
if (!userCols.includes('is_verified')) {
  db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0');
}
if (!userCols.includes('verification_token')) {
  db.exec('ALTER TABLE users ADD COLUMN verification_token TEXT DEFAULT ""');
}

// Auto-migration for new columns in settings table
const settingsCols = db.prepare('PRAGMA table_info(settings)').all().map(c => c.name);
const settingFieldsToAdd = [
  ['razorpay_key_id', 'TEXT DEFAULT ""'],
  ['razorpay_key_secret', 'TEXT DEFAULT ""'],
  ['resend_api_key', 'TEXT DEFAULT ""'],
  ['gmail_user', 'TEXT DEFAULT ""'],
  ['gmail_pass', 'TEXT DEFAULT ""'],
  ['email_from', 'TEXT DEFAULT "JP Store <onboarding@resend.dev>"']
];
for (const [colName, colType] of settingFieldsToAdd) {
  if (!settingsCols.includes(colName)) {
    db.exec(`ALTER TABLE settings ADD COLUMN ${colName} ${colType}`);
  }
}

// Database helpers supporting parameters
const q = (sql, params = []) => {
  const p = Array.isArray(params) ? params : [params];
  return db.prepare(sql).get(...p);
};

const qAll = (sql, params = []) => {
  const p = Array.isArray(params) ? params : [params];
  return db.prepare(sql).all(...p);
};

const qRun = (sql, params = []) => {
  const p = Array.isArray(params) ? params : [params];
  return db.prepare(sql).run(...p);
};

// Seed initial default admin and settings if missing
if (!q('SELECT 1 FROM users WHERE email = ?', ['admin@jpstore.com'])) {
  qRun('INSERT INTO users(name, email, password, role, is_verified) VALUES(?, ?, ?, ?, ?)', [
    'JP Store Admin',
    'admin@jpstore.com',
    bcrypt.hashSync('admin123', 10),
    'admin',
    1
  ]);
}

if (!q('SELECT 1 FROM settings WHERE id = 1')) {
  qRun('INSERT INTO settings(id) VALUES(1)');
}

const productCount = q('SELECT COUNT(*) AS c FROM products');
if (!productCount || productCount.c === 0) {
  const insertProduct = db.prepare(
    'INSERT INTO products(name, description, price, discount, stock, category, image, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)'
  );
  [
    ['Elegant Floral Journal', 'Premium hardbound journal with floral detailing', 499, 10, 25, 'Stationery', '', 'active'],
    ['Pastel Gift Box', 'Curated fancy gift box for special occasions', 899, 15, 12, 'Gifts', '', 'active'],
    ['Rose Gold Pen Set', 'Smooth writing pen set with premium finish', 299, 5, 40, 'Pens', '', 'active'],
    ['Pretty Sticker Pack', 'Aesthetic decorative sticker collection', 149, 0, 100, 'Stickers', '', 'active']
  ].forEach(item => insertProduct.run(...item));
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${cleanName}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Auth helpers
function token(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!rawToken) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const decoded = jwt.verify(rawToken, JWT_SECRET);
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

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, phone = '', address = '' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const verificationToken = crypto.randomBytes(24).toString('hex');

    const info = qRun(
      'INSERT INTO users(name, email, password, phone, address, is_verified, verification_token) VALUES(?, ?, ?, ?, ?, ?, ?)',
      [name, cleanEmail, bcrypt.hashSync(password, 10), phone, address, 0, verificationToken]
    );
    const u = q('SELECT id, name, email, phone, address, role, is_verified FROM users WHERE id = ?', [info.lastInsertRowid]);

    // Send verification email in the background
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    sendAccountVerificationEmail({
      to: cleanEmail,
      name,
      token: verificationToken,
      settings
    }).catch(err => console.error('[Auth] Verification email error:', err.message));

    res.json({ token: token(u), user: u, message: 'Registration successful. Verification email sent!' });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Register error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const u = q('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!u || !bcrypt.compareSync(password, u.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (u.status === 'blocked') {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    res.json({
      token: token(u),
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
});

app.get('/api/auth/verify', (req, res) => {
  try {
    const { token: verifyToken } = req.query;
    if (!verifyToken || !verifyToken.trim()) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    const user = q('SELECT * FROM users WHERE verification_token = ?', [verifyToken.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    qRun('UPDATE users SET is_verified = 1, verification_token = ? WHERE id = ?', ['', user.id]);
    res.json({ ok: true, message: 'Account verified successfully!' });
  } catch (e) {
    console.error('Verify error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/resend-verification', auth, async (req, res) => {
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
});

app.get('/api/me', auth, (req, res) => {
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
});

app.put('/api/me', auth, (req, res) => {
  try {
    const { name, phone = '', address = '' } = req.body;
    const addressStr = typeof address === 'object' ? JSON.stringify(address) : String(address || '');
    qRun('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, addressStr, req.user.id]);
    const updated = q('SELECT id, name, email, phone, address, role, is_verified FROM users WHERE id = ?', [req.user.id]);
    res.json({ ok: true, user: updated });
  } catch (e) {
    console.error('Update me error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ----------------------------------------------------
// PAYMENT ROUTES (RAZORPAY)
// ----------------------------------------------------
app.get('/api/payment/config', (req, res) => {
  try {
    const settings = q('SELECT * FROM settings WHERE id = 1') || {};
    const config = getRazorpayConfig(settings);
    res.json({ keyId: config.keyId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/payment/create-order', auth, async (req, res) => {
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
});

app.post('/api/payment/verify', auth, (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
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

    if (order_id) {
      qRun(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['Paid', 'Ordered', order_id]
      );
    }

    res.json({ ok: true, message: 'Payment verified successfully' });
  } catch (e) {
    console.error('Verify payment error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin test endpoint for Razorpay connection
app.post('/api/admin/test-razorpay', auth, admin, async (req, res) => {
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
});

// ----------------------------------------------------
// GEOCODING & LOCATION ROUTES (FLIPKART / AMAZON STYLE)
// ----------------------------------------------------

// Reverse Geocode: GPS Coordinates -> Split Address
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    let data = null;
    // Attempt 1: Nominatim OpenStreetMap
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'JPStore-Ecommerce/1.0 (contact@jpstore.com)'
          },
          signal: AbortSignal.timeout(5000)
        }
      );
      if (resp.ok) {
        data = await resp.json();
      }
    } catch (err) {
      console.warn('[Geocode] Nominatim reverse geocode error:', err.message);
    }

    // Attempt 2: BigDataCloud client API fallback
    if (!data || !data.address) {
      try {
        const resp2 = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (resp2.ok) {
          const bdc = await resp2.json();
          return res.json({
            pincode: bdc.postcode || '',
            city: bdc.city || bdc.locality || '',
            state: bdc.principalSubdivision || '',
            area: bdc.locality || '',
            flat: '',
            formatted: [bdc.locality, bdc.city, bdc.principalSubdivision, bdc.postcode].filter(Boolean).join(', ')
          });
        }
      } catch (err2) {
        console.warn('[Geocode] BigDataCloud fallback error:', err2.message);
      }
    }

    if (!data || !data.address) {
      return res.status(404).json({ error: 'Could not resolve address from coordinates' });
    }

    const addr = data.address || {};
    const city = addr.city || addr.town || addr.city_district || addr.county || '';
    const state = addr.state || addr.state_district || '';
    const pincode = addr.postcode || '';
    const area = [addr.suburb, addr.neighbourhood, addr.quarter, addr.road].filter(Boolean).slice(0, 2).join(', ');
    const flat = [addr.house_number, addr.building, addr.amenity].filter(Boolean).join(' ') || '';

    res.json({
      pincode,
      city,
      state,
      area,
      flat,
      formatted: data.display_name || [area, city, state, pincode].filter(Boolean).join(', ')
    });
  } catch (e) {
    console.error('Reverse geocode error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Pincode Lookup: 6-digit Indian PIN Code -> City & State
app.get('/api/geocode/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const cleanPin = String(pincode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return res.status(400).json({ error: 'PIN code must be 6 digits' });
    }

    const resp = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) {
      return res.status(502).json({ error: 'Postal API unavailable' });
    }
    const data = await resp.json();
    if (!Array.isArray(data) || data[0]?.Status !== 'Success' || !data[0]?.PostOffice?.length) {
      return res.status(404).json({ error: 'Unrecognized PIN code' });
    }

    const po = data[0].PostOffice[0];
    res.json({
      valid: true,
      pincode: cleanPin,
      city: po.District || po.Division || po.Circle || '',
      state: po.State || '',
      district: po.District || '',
      country: 'India',
      areas: data[0].PostOffice.map(p => p.Name)
    });
  } catch (e) {
    console.error('Pincode lookup error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ----------------------------------------------------
// PRODUCT ROUTES
// ----------------------------------------------------

// User endpoint: Only active products
app.get('/api/products', (req, res) => {
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
});

// Admin endpoint: ALL products (active and inactive)
app.get('/api/admin/products', auth, admin, (req, res) => {
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
});

app.get('/api/products/:id', (req, res) => {
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
});

// Create product (Admin)
app.post('/api/products', auth, admin, upload.single('image'), (req, res) => {
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
});

// Update product (Admin)
app.put('/api/products/:id', auth, admin, upload.single('image'), (req, res) => {
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
});

// Quick activate / deactivate product status (Admin)
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
app.patch('/api/admin/products/:id/status', auth, admin, updateProductStatus);
app.put('/api/admin/products/:id/status', auth, admin, updateProductStatus);

// Delete product (Admin) with cascading cleanup
app.delete('/api/products/:id', auth, admin, (req, res) => {
  try {
    const p = q('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const tx = db.transaction(() => {
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
});

// ----------------------------------------------------
// ORDER ROUTES
// ----------------------------------------------------
app.post('/api/orders', auth, (req, res) => {
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

    const tx = db.transaction(() => {
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
});

app.get('/api/orders', auth, (req, res) => {
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
});

app.get('/api/orders/:id', auth, (req, res) => {
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
});

app.put('/api/orders/:id/status', auth, admin, (req, res) => {
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
});

app.put('/api/orders/:id/cancel', auth, (req, res) => {
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
});

// ----------------------------------------------------
// WISHLIST ROUTES
// ----------------------------------------------------
app.get('/api/wishlist', auth, (req, res) => {
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
});

app.post('/api/wishlist/:id', auth, (req, res) => {
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
});

// ----------------------------------------------------
// ADMIN DASHBOARD & MANAGEMENT
// ----------------------------------------------------
app.get('/api/admin/dashboard', auth, admin, (req, res) => {
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
});

app.get('/api/admin/customers', auth, admin, (req, res) => {
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
});

app.put('/api/admin/customers/:id/status', auth, admin, (req, res) => {
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
});

app.get('/api/admin/payments', auth, admin, (req, res) => {
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
});

// ----------------------------------------------------
// SETTINGS & METADATA
// ----------------------------------------------------
app.get('/api/settings', (req, res) => {
  try {
    const s = q('SELECT * FROM settings WHERE id = 1');
    res.json(s || {});
  } catch (e) {
    console.error('Get settings error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings', auth, admin, (req, res) => {
  try {
    const s = req.body;
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
        s.razorpay_key_id || '',
        s.razorpay_key_secret || '',
        s.resend_api_key || '',
        s.gmail_user || '',
        s.gmail_pass || '',
        s.email_from || 'JP Store <onboarding@resend.dev>'
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('Update settings error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/categories', (req, res) => {
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
});

app.get('/api/reviews/:id', (req, res) => {
  res.json([]);
});

app.post('/api/reviews/:id', auth, (req, res) => {
  try {
    const { rating, comment } = req.body;
    // Return simulated success
    res.json({ ok: true, message: 'Review submitted successfully!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ----------------------------------------------------
// SUPPORT TICKETS & INQUIRIES
// ----------------------------------------------------
app.post('/api/support', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const info = qRun(
      'INSERT INTO support_tickets (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), subject ? subject.trim() : 'General Inquiry', message.trim()]
    );
    res.json({
      ok: true,
      ticketId: info.lastInsertRowid,
      message: 'Thank you for reaching out! Your inquiry has been received. Our Pretty Picks concierge team will get back to you within 24 hours.'
    });
  } catch (e) {
    console.error('Support ticket error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/support', auth, admin, (req, res) => {
  try {
    const tickets = qAll('SELECT * FROM support_tickets ORDER BY id DESC');
    res.json(tickets);
  } catch (e) {
    console.error('Get support tickets error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Global catch-all error handler for multer and unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`JP Store API running on http://localhost:${PORT}`));
