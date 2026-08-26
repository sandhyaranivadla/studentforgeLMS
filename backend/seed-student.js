const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const email = 'student@studentforge.com';
    const password = 'password123';
    
    let user = await prisma.user.findFirst({ where: { email } });
    
    if (!user) {
      console.log('Creating sample student user...');
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Jane Student',
          role: 'STUDENT'
        }
      });
      console.log('Successfully created student!');
    } else {
      console.log('Student user already exists!');
    }
    
    console.log('\n--- Credentials ---');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', user.role);
    console.log('-------------------\n');
    
  } catch (e) {
    console.error('Database query failed:', e);
  }
}

main().finally(() => process.exit(0));
