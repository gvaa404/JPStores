"use strict";

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const clientDist = path.join(__dirname, 'client', 'dist');
if (!fs.existsSync(clientDist) || !fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.log('Client build missing; building frontend assets...');
  execSync('npm run build --prefix client', { stdio: 'inherit' });
}

require('./server/src/server');
