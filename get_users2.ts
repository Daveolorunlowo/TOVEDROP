import prisma from './lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    include: { driver: true, accounts: true, sessions: true }
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch(console.error).finally(() => {
  // BetterSQLite3 does not need an explicit disconnect like this, but we can do it if the client supports it
  // Actually, let's just exit
  process.exit(0)
})
