import { PrismaService } from './src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  const pwd = await bcrypt.hash('admin123', 10);
  await prisma.user.updateMany({
    where: { email: 'admin@studentforge.com' },
    data: { passwordHash: pwd }
  });
  console.log('Password updated to admin123');
  await prisma.$disconnect();
}

main().catch(console.error);
