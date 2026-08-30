const bcrypt = require('bcrypt');

// Generate bcrypt hashes for test passwords
const password = 'password123'; // Simple test password for all users

async function generateHashes() {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: "${password}"`);
  console.log(`Bcrypt hash: ${hash}`);
  console.log('\nUse this hash in seed data for all test users');
}

generateHashes();
