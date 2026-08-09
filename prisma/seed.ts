import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminPassword = await bcrypt.hash('ChangeThisPassword123!', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tovedrop.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@tovedrop.com',
      password: adminPassword,
      role: 'ADMIN',
      dropsBalance: 0,
    },
  })
  
  console.log('Admin account seeded:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
