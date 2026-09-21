"use strict";

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// HTTP Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://checkout.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.razorpay.com'],
        connectSrc: [
          "'self'",
          'http://localhost:*',
          'http://127.0.0.1:*',
          'https://api.razorpay.com',
          'https://lumberjack.razorpay.com',
          'https://nominatim.openstreetmap.org',
          'https://api.bigdatacloud.net',
          'https://api.postalpincode.in'
        ],
        frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com']
      }
    }
  })
);

// Restricted CORS policy
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  config.appUrl
].filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, test scripts, same-origin)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Access blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(config.uploadsDir));

// Mount main API router with general rate limiting
app.use('/api', generalLimiter, routes);

// Central error handler
app.use(errorHandler);

module.exports = app;
