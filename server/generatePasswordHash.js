const { createPasswordHash } = require('./auth');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node server/generatePasswordHash.js "your-password"');
  process.exit(1);
}

console.log(createPasswordHash(password));
