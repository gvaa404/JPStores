"use strict";

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (err.message === 'Access blocked by CORS policy') {
    return res.status(403).json({ error: err.message });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum permitted size is 5MB.' });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err.message && err.message.includes('Only JPEG, PNG, WEBP, and GIF images are permitted')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
