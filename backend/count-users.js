const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');

async function main() {
  const connectionString = 'postgresql://task:1Ui_8StKe7wyI4ldZingVA@okay-mastiff-32707.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full&sslrootcert=C:/Users/padar/AppData/Roaming/postgresql/root.crt';
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync('C:/Users/padar/AppData/Roaming/postgresql/root.crt').toString() }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({
      select: { name: true, email: true, role: true }
    });
    console.log(`Total users in DB: ${users.length}`);
    console.log('--- User Details ---');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name || 'No Name'} (${u.email}) - [${u.role}]`);
    });
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}
main();
