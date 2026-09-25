"use strict";

const config = require('./config');
const database = require('./database');
const app = require('./app');

// Initialize schema and seed default data
database.initDatabase();
database.seedDatabase();

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`JP Store running on http://0.0.0.0:${config.port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };
