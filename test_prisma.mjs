import { PrismaClient } from '@prisma/client'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })

const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const user = await prisma.user.findFirst()
    console.log(user)
  } catch (e) {
    console.error(e)
  }
}
main()
