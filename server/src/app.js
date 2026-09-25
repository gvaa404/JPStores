"use strict";

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy headers (e.g. Cloud Run / Nginx)
app.set('trust proxy', 1);

// Disable x-powered-by header
app.disable('x-powered-by');

// HTTP Security Headers via Helmet (configured to allow AI Studio iframe embedding)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    contentSecurityPolicy: false
  })
);

// Flexible CORS policy for preview and dev environments
app.use(
  cors({
    origin: true,
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

// Serve static frontend assets and SPA fallback
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
}

// Central error handler
app.use(errorHandler);

module.exports = app;
