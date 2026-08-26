const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const instructorPassword = await bcrypt.hash('instructor123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@studentforge.com' },
    update: { passwordHash: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@studentforge.com',
      name: 'System Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@studentforge.com' },
    update: { passwordHash: instructorPassword, role: 'INSTRUCTOR' },
    create: {
      email: 'instructor@studentforge.com',
      name: 'Jane Instructor',
      passwordHash: instructorPassword,
      role: 'INSTRUCTOR',
    },
  });

  console.log('Admin:', admin.email, 'Pass: admin123');
  console.log('Instructor:', instructor.email, 'Pass: instructor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
