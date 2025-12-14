const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, 'debug.txt'), 'hello from node');
console.log('wrote debug.txt');
