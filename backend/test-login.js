const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'student@studentforge.com';
  const password = 'password123';
  
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log('User found:', user.email);
  console.log('Hash from DB:', user.passwordHash);
  
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log('Password match:', isMatch);
}

main().finally(() => process.exit(0));
