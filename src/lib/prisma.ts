import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { validateServerEnv } from '@/lib/env'

// Validasi env vars saat module pertama kali di-load
validateServerEnv()

// Versi ini harus diincrement setiap kali schema berubah
// agar singleton lama di globalThis di-reset
const PRISMA_VERSION = '3' // incremented after adding Review model

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion: string | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Make sure .env file exists and contains DATABASE_URL.'
    )
  }

  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Reset singleton jika versi schema berubah
if (
  process.env.NODE_ENV !== 'production' &&
  globalForPrisma.prismaVersion !== PRISMA_VERSION
) {
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaVersion = PRISMA_VERSION
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaVersion = PRISMA_VERSION
}
