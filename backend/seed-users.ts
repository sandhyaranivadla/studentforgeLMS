import { PrismaService } from './src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const instructorPassword = await bcrypt.hash('instructor123', 10);

  let admin = await prisma.user.findFirst({ where: { email: 'admin@studentforge.com' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@studentforge.com',
        name: 'System Admin',
        passwordHash: adminPassword,
        role: 'ADMIN',
      },
    });
  }

  let instructor = await prisma.user.findFirst({ where: { email: 'instructor@studentforge.com' } });
  if (!instructor) {
    instructor = await prisma.user.create({
      data: {
        email: 'instructor@studentforge.com',
        name: 'Jane Instructor',
        passwordHash: instructorPassword,
        role: 'INSTRUCTOR',
      },
    });
  }

  console.log('Admin:', admin.email, 'Pass: admin123');
  console.log('Instructor:', instructor.email, 'Pass: instructor123');

  await prisma.$disconnect();
}

main().catch(console.error);
