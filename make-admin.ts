import 'dotenv/config'
import prisma from './lib/prisma'

async function main() {
  const users = await prisma.user.findMany()
  if (users.length > 0) {
    const userToUpdate = users[0]
    await prisma.user.update({
      where: { id: userToUpdate.id },
      data: { role: 'ADMIN' }
    })
    console.log(`Successfully updated ${userToUpdate.email} to ADMIN`)
  }
}

main()
