// Inlines the QR library so index.html is a single offline file.  Run: node src/build.js
const fs = require('fs'), path = require('path');
const t = fs.readFileSync(path.join(__dirname, 'index.template.html'), 'utf8');
const lib = fs.readFileSync(path.join(__dirname, 'qrcode-generator-1.4.4.min.js'), 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), t.replace('/*@@QRLIB@@*/', () => lib));
console.log('wrote index.html');
