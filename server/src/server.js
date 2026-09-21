"use strict";

const config = require('./config');
const database = require('./database');
const app = require('./app');

// Initialize schema and seed default data
database.initDatabase();
database.seedDatabase();

const server = app.listen(config.port, () => {
  console.log(`JP Store API running on http://localhost:${config.port}`);
});

module.exports = { app, server };
