const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');

async function main() {
  let connectionString = 'postgresql://task:1Ui_8StKe7wyI4ldZingVA@okay-mastiff-32707.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full&sslrootcert=C:\\Users\\padar\\AppData\\Roaming\\postgresql\\root.crt';
  let ssl = false;

  const match = connectionString.match(/sslrootcert=([^&]+)/);
  if (match && match[1]) {
    ssl = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(match[1]).toString(),
    };
  }

  const pool = new Pool({ connectionString, ssl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findFirst({ where: { email: 'test@test.com' } });
    console.log('SUCCESS:', user);
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
