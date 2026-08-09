import prisma from './lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    include: { driverProfile: true, accounts: true, sessions: true }
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch(console.error).finally(() => {
  process.exit(0)
})
