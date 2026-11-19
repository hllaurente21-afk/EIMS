require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

(async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`, [username, hash]);
  console.log(`Admin account ready -> username: ${username}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
