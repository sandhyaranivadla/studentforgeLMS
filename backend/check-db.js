const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL || '';
let ssl = false;
if (connectionString && connectionString.includes('sslmode=verify-full')) {
  const match = connectionString.match(/sslrootcert=([^&]+)/);
  if (match && match[1]) {
    ssl = {
      rejectUnauthorized: false,
      ca: fs.readFileSync(match[1]).toString(),
    };
  }
}

const pool = new Pool({ connectionString, ssl: ssl || undefined });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    let user = await prisma.user.findFirst({ where: { email: 'admin@studentforge.com' } });
    if (!user) {
      console.log('User not found, creating one...');
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('password', 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@studentforge.com',
          passwordHash,
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
      console.log('Created admin user:', user.email);
    } else {
      console.log('Admin user already exists:', user.email);
    }
  } catch (e) {
    console.error('Database query failed:', e);
  }
}

main().finally(() => process.exit(0));
