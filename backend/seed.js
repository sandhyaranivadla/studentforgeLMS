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
    // Check if user exists
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin@studentforge.com',
          passwordHash: 'dummy',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
    }

    // Check if course exists
    let course = await prisma.course.findFirst({ where: { title: 'Full-Stack Next.js Masterclass' } });
    if (!course) {
      course = await prisma.course.create({
        data: {
          title: 'Full-Stack Next.js Masterclass',
          description: 'Learn to build production-ready apps.',
          price: 99.00,
          instructorId: admin.id,
          published: true,
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop',
          modules: {
            create: [
              {
                title: 'Module 1: Introduction',
                orderIndex: 0,
                lessons: {
                  create: [
                    { title: 'Welcome to the Course', type: 'VIDEO', duration: '5m', orderIndex: 0 },
                    { title: 'Setting up the environment', type: 'VIDEO', duration: '15m', orderIndex: 1 }
                  ]
                }
              }
            ]
          }
        }
      });
      console.log('Seeded course:', course.id);
    } else {
      console.log('Course already exists:', course.id);
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}
main();
