import prisma from './lib/prisma'

async function main() {
  await prisma.user.update({
    where: { email: 'admin@tovedrop.com' },
    data: { role: 'ADMIN' }
  })
  console.log("Admin user successfully updated to ADMIN role")
}

main().catch(console.error).finally(() => process.exit(0))
