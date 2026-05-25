#!/usr/bin/env node

/**
 * Generate a bcryptjs hash for an admin password.
 * Usage: node scripts/hash-password.js <password>
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

console.log('\nPassword hash generated:');
console.log(hash);
console.log('\nAdd this to your environment variables:');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
