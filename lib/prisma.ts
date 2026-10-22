import { PrismaClient } from '../generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  const rawUrl = "postgresql://neondb_owner:npg_v5LAkEz6rGcM@ep-summer-moon-ay1fb9vh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  // Strip channel_binding param â€” pg driver doesn't support it and Neon's pooler adds it
  const connectionString = rawUrl?.replace(/[?&]channel_binding=[^&]*/g, (match) =>
    match.startsWith('?') ? '?' : ''
  ).replace(/\?&/, '?').replace(/\?$/, '')
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma


