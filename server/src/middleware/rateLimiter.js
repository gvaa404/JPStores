"use strict";

const rateLimit = require('express-rate-limit');

// Disable rate limiter validation errors triggered by reverse proxy headers (X-Forwarded-For / Forwarded)
const defaultLimiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false
  }
};

// Authentication rate limiter to prevent password guessing and registration floods
const authLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 attempts per window
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Payment creation rate limiter to prevent payment testing abuse
const paymentLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  message: { error: 'Too many payment requests. Please try again later.' }
});

// Geocoding rate limiter to protect upstream third-party APIs
const geocodeLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many location lookups. Please try again in a moment.' }
});

// General API rate limiter
const generalLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests. Please slow down.' }
});

module.exports = {
  authLimiter,
  paymentLimiter,
  geocodeLimiter,
  generalLimiter
};
