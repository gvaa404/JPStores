"use strict";

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');

let db;

function initDatabase() {
  if (db) return db;

  const dbPath = config.databasePath;
  db = new Database(dbPath);
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

  return db;
}

function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}

function seedDatabase() {
  const database = getDb();

  const queryOne = (sql, params = []) => {
    const p = Array.isArray(params) ? params : [params];
    return database.prepare(sql).get(...p);
  };

  const queryRun = (sql, params = []) => {
    const p = Array.isArray(params) ? params : [params];
    return database.prepare(sql).run(...p);
  };

  // Seed default admin if missing
  if (!queryOne('SELECT 1 FROM users WHERE email = ?', ['admin@jpstore.com'])) {
    queryRun('INSERT INTO users(name, email, password, role, is_verified) VALUES(?, ?, ?, ?, ?)', [
      'JP Store Admin',
      'admin@jpstore.com',
      bcrypt.hashSync('admin123', 10),
      'admin',
      1
    ]);
  }

  // Seed settings row if missing
  if (!queryOne('SELECT 1 FROM settings WHERE id = 1')) {
    queryRun('INSERT INTO settings(id) VALUES(1)');
  }

  const productCount = queryOne('SELECT COUNT(*) AS c FROM products');
  if (!productCount || productCount.c === 0) {
    const insertProduct = database.prepare(
      'INSERT INTO products(name, description, price, discount, stock, category, image, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)'
    );
    [
      ['Elegant Floral Journal', 'Premium hardbound journal with floral detailing', 499, 10, 25, 'Stationery', '', 'active'],
      ['Pastel Gift Box', 'Curated fancy gift box for special occasions', 899, 15, 12, 'Gifts', '', 'active'],
      ['Rose Gold Pen Set', 'Smooth writing pen set with premium finish', 299, 5, 40, 'Pens', '', 'active'],
      ['Pretty Sticker Pack', 'Aesthetic decorative sticker collection', 149, 0, 100, 'Stickers', '', 'active']
    ].forEach(item => insertProduct.run(...item));
  }
}

// Database helpers supporting parameterized inputs
function q(sql, params = []) {
  const database = getDb();
  const p = Array.isArray(params) ? params : [params];
  return database.prepare(sql).get(...p);
}

function qAll(sql, params = []) {
  const database = getDb();
  const p = Array.isArray(params) ? params : [params];
  return database.prepare(sql).all(...p);
}

function qRun(sql, params = []) {
  const database = getDb();
  const p = Array.isArray(params) ? params : [params];
  return database.prepare(sql).run(...p);
}

function transaction(fn) {
  const database = getDb();
  return database.transaction(fn);
}

module.exports = {
  initDatabase,
  getDb,
  seedDatabase,
  q,
  qAll,
  qRun,
  transaction
};