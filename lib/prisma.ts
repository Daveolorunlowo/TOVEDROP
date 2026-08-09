import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

// Ensure we are pointing to the correct absolute path for the sqlite file
const sqlitePath = path.join(process.cwd(), 'dev.db')
console.log("=== DB PATH ===", sqlitePath)

const adapter = new PrismaBetterSqlite3({
  url: `file:${sqlitePath}`
})

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
