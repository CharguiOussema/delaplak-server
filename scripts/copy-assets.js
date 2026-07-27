const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'templates');
const dest = path.join(__dirname, '..', 'dist', 'templates');

fs.cpSync(src, dest, { recursive: true });
console.log(`copied templates: ${src} -> ${dest}`);
