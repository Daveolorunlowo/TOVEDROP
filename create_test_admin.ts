import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'testadmin@tovedrop.com' },
    update: { password: hash, role: 'ADMIN' },
    create: { email: 'testadmin@tovedrop.com', name: 'Test Admin', password: hash, role: 'ADMIN' }
  });
  console.log('Created test admin: testadmin@tovedrop.com / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
