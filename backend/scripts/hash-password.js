#!/usr/bin/env node

/**
 * Generate bcrypt hash for admin password
 * Usage: node scripts/hash-password.js <password>
 */

import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log('\n✅ Password hash generated:');
console.log(hash);
console.log('\n📝 Add this to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);

