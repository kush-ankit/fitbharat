const fs = require('fs');
try {
    fs.writeFileSync('trivial_js.txt', 'success');
    console.log('trivial js success');
} catch (e) {
    console.error(e);
}
