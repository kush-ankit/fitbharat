import fs from 'fs';
try {
    fs.writeFileSync('trivial.txt', 'success');
    console.log('trivial success');
} catch (e) {
    console.error(e);
}
